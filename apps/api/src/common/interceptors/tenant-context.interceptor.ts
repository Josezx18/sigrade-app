import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { lastValueFrom } from 'rxjs';
import { Request } from 'express';
import { PrismaService } from '@sigrade/shared-prisma';

/**
 * Wraps every request in a DB transaction that scopes the RLS tenant context
 * (`app.current_tenant_id`) for the duration of the request. While the handler
 * runs, all `PrismaService` access routes to this transaction's client, so two
 * concurrent requests can no longer leak each other's tenant context — closing
 * the race condition that existed with the previous shared `max:1` connection.
 *
 * `tenantId` is taken from the authenticated user (populated by JwtAuthGuard,
 * which runs before interceptors). Public routes have no user, so the context
 * is left NULL (and should not touch tenant-scoped data).
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const tenantId = (req as unknown as { user?: { tenantId?: string } }).user?.tenantId ?? null;

    return new Observable((subscriber) => {
      this.prisma
        .runInTenantContext(tenantId, async () => {
          try {
            const result = await lastValueFrom(next.handle());
            subscriber.next(result);
            subscriber.complete();
          } catch (err) {
            subscriber.error(err);
          }
        })
        .catch((err) => subscriber.error(err));
    });
  }
}
