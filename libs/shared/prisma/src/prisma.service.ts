import { Injectable, OnModuleInit, OnModuleDestroy, INestApplication } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Per-request RLS tenant context.
 *
 * The runtime application connects (via PrismaService) as the NON-OWNER
 * `sigrade_app` role so Row Level Security is actually enforced (table owners
 * bypass RLS in PostgreSQL — see prisma/apply-rls.sql and DIAGNOSTICO.md).
 *
 * To avoid leaking one request's tenant context into another on a shared
 * connection, every HTTP request is wrapped in a DB transaction that scopes
 * the `app.current_tenant_id` GUC to that transaction (see
 * TenantContextInterceptor + runInTenantContext). Service code keeps using
 * `this.prisma.<model>` unchanged; the proxy below routes those calls to the
 * current request's transaction client when one is active.
 */
const txStorage = new AsyncLocalStorage<Prisma.TransactionClient>();

const OWN_METHODS = new Set<string>([
  'constructor',
  'setTenantContext',
  'clearTenantContext',
  'runInTenantContext',
  'enableShutdownHooks',
  'onModuleInit',
  'onModuleDestroy',
  '$connect',
  '$disconnect',
  '$on',
  '$use',
  '$metrics',
]);

function createTenantProxy(instance: PrismaService): PrismaService {
  return new Proxy(instance, {
    get(target, prop, receiver) {
      if (typeof prop !== 'string') {
        return Reflect.get(target, prop, receiver);
      }
      if (OWN_METHODS.has(prop)) {
        return Reflect.get(target, prop, receiver);
      }
      const tx = txStorage.getStore();
      if (tx && prop in tx) {
        return (tx as unknown as Record<string, unknown>)[prop];
      }
      return Reflect.get(target, prop, receiver);
    },
  }) as PrismaService;
}

function runtimeConnectionString(fallback: string): string {
  // In tests we always use the OWNER role so existing unit/e2e suites (which
  // seed/inspect data directly) are not subject to RLS. In every other
  // environment the runtime MUST connect as the non-owner `sigrade_app` role
  // so Row Level Security is enforced; falling back to the owner connection
  // would silently bypass RLS, so we fail fast instead.
  if (process.env.NODE_ENV === 'test') {
    return process.env.DATABASE_URL ?? fallback;
  }
  const appUrl = process.env.APP_DATABASE_URL;
  if (!appUrl) {
    throw new Error(
      'APP_DATABASE_URL is required for the runtime connection (non-owner role so ' +
        'Row Level Security is enforced). Define it in .env (see .env.example) and run ' +
        '`psql "$DATABASE_URL" -f prisma/apply-rls.sql` before starting the API.',
    );
  }
  return appUrl;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const pool = new Pool({
      connectionString: runtimeConnectionString(
        'postgresql://sigrade:sigrade_dev@localhost:5432/sigrade?schema=public',
      ),
      // Pool can grow now: tenant context is scoped per-request via a
      // transaction, so a shared connection no longer leaks tenant state
      // across concurrent requests (eliminates the old max:1 race condition).
      max: Number(process.env.DB_POOL_MAX ?? 10),
    });
    const adapter = new PrismaPg(pool);
    super({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }

  /** Set the RLS tenant GUC for the CURRENT connection/transaction. */
  async setTenantContext(tenantId: string | null) {
    await this.$executeRawUnsafe(`SELECT set_current_tenant($1)`, tenantId);
  }

  async clearTenantContext() {
    await this.$executeRawUnsafe(`SELECT set_current_tenant(NULL)`);
  }

  /**
   * Runs `work` inside a DB transaction that scopes the RLS tenant context to
   * `tenantId`. While `work` executes, all Prisma access on this service
   * (through the request proxy) uses this transaction's client, so concurrent
   * requests cannot leak each other's tenant context.
   */
  async runInTenantContext<T>(tenantId: string | null, work: () => Promise<T>): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_current_tenant($1)`, tenantId);
      return txStorage.run(tx, async () => work());
    });
  }
}

/**
 * Privileged, RLS-bypassing client bound to the OWNER `DATABASE_URL`.
 * Used ONLY for bootstrap/identity operations (login by email, token refresh,
 * profile lookup by id) where the tenant is not yet known and RLS would hide
 * the row. Never use it for tenant-scoped business data.
 */
@Injectable()
export class OwnerPrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL ?? 'postgresql://sigrade:sigrade_dev@localhost:5432/sigrade?schema=public',
      max: Number(process.env.DB_POOL_MAX ?? 10),
    });
    const adapter = new PrismaPg(pool);
    super({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async setTenantContext(tenantId: string | null) {
    await this.$executeRawUnsafe(`SELECT set_current_tenant($1)`, tenantId);
  }

  async clearTenantContext() {
    await this.$executeRawUnsafe(`SELECT set_current_tenant(NULL)`);
  }
}

export { PrismaClient } from '@prisma/client';
export { createTenantProxy };
