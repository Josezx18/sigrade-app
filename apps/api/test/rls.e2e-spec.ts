import { Pool } from 'pg';

/**
 * RLS isolation (e2e) — real Row Level Security test.
 *
 * Connects directly to Postgres as the NON-OWNER `sigrade_app` role (the role
 * the API uses at runtime via APP_DATABASE_URL) and verifies that tenant rows
 * are only visible when the matching tenant context is set. Regular e2e suites
 * run with NODE_ENV=test (owner role, RLS bypassed), so this is the ONLY test
 * that proves the isolation is actually enforced at the database level.
 *
 * Requires: APP_DATABASE_URL + apply-rls.sql executed (creates sigrade_app).
 * When APP_DATABASE_URL is missing the suite is skipped.
 */

const appUrl = process.env.APP_DATABASE_URL;
const ownerUrl = process.env.DATABASE_URL;

const describeRls = appUrl ? describe : describe.skip;

describeRls('RLS isolation (e2e — role sigrade_app)', () => {
  let ownerPool: Pool;
  let appPool: Pool;

  beforeAll(async () => {
    ownerPool = new Pool({ connectionString: ownerUrl, max: 2 });
    appPool = new Pool({ connectionString: appUrl, max: 2 });
  });

  afterAll(async () => {
    await ownerPool?.end();
    await appPool?.end();
  });

  async function tenantCount(tenantId: string | null, withContext = false): Promise<number> {
    const client = await appPool.connect();
    try {
      await client.query('BEGIN');
      if (withContext) {
        await client.query('SELECT set_current_tenant($1)', [tenantId]);
      }
      const res = await client.query<{ c: number }>(`SELECT count(*)::int AS c FROM "students"`);
      await client.query('COMMIT');
      return res.rows[0].c;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  it('bloquea todo sin contexto de tenant (no filtra datos ajenos)', async () => {
    const res = await tenantCount(null);
    expect(res).toBe(0);
  });

  it('ve solo los datos de SU tenant cuando el contexto es el suyo', async () => {
    const owner = await ownerPool.query<{ id: string }>(
      `SELECT t."id" FROM "tenants" t
         JOIN "students" s ON s."tenantId" = t."id"
        GROUP BY t."id" ORDER BY count(*) DESC LIMIT 1`,
    );
    expect(owner.rows.length).toBe(1);
    const ownTenant = owner.rows[0].id;

    const ownTenantCount = await ownerPool.query<{ c: number }>(
      `SELECT count(*)::int AS c FROM "students" WHERE "tenantId" = $1`,
      [ownTenant],
    );

    const visible = await tenantCount(ownTenant, true);
    expect(visible).toBe(ownTenantCount.rows[0].c);
    expect(visible).toBeGreaterThan(0);
  });

  it('no ve datos de OTRO tenant aunque se lo pida explícitamente', async () => {
    const owner = await ownerPool.query<{ id: string }>(
      `SELECT t."id" FROM "tenants" t
         JOIN "students" s ON s."tenantId" = t."id"
        GROUP BY t."id" ORDER BY count(*) DESC LIMIT 1`,
    );
    expect(owner.rows.length).toBe(1);
    const ownTenant = owner.rows[0].id;
    const tenantWithStudents = ownTenant;

    const other = await ownerPool.query<{ id: string }>(
      `SELECT t."id" FROM "tenants" t
        LEFT JOIN "students" s ON s."tenantId" = t."id"
        GROUP BY t."id" HAVING count(s."id") = 0 LIMIT 1`,
    );
    expect(other.rows.length).toBe(1);
    const otherTenant = other.rows[0].id;
    expect(otherTenant).not.toBe(tenantWithStudents);

    const student = await ownerPool.query<{ id: string }>(
      `SELECT s."id" FROM "students" s WHERE s."tenantId" = $1 LIMIT 1`,
      [tenantWithStudents],
    );
    expect(student.rows.length).toBe(1);

    // Contexto = otro tenant: no debe ver ni el counter ni el student concreto.
    expect(await tenantCount(otherTenant, true)).toBe(0);

    const client = await appPool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT set_current_tenant($1)', [otherTenant]);
      const res = await client.query(`SELECT count(*)::int AS c FROM "students" WHERE "id" = $1`, [
        student.rows[0].id,
      ]);
      expect(res.rows[0].c).toBe(0);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  });
});