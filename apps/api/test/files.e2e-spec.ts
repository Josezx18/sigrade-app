import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Pool } from 'pg';
import { AppModule } from '../src/app/app.module';

/**
 * Files/MinIO integration (e2e) — real S3-compatible storage round trip.
 *
 * Requires a running MinIO and its env vars (MINIO_ENDPOINT/PORT/ACCESS_KEY/
 * SECRET_KEY, ...). When absent the suite is skipped so it never breaks CI
 * environments that only run the Postgres+Redis-backed suites.
 */

const minioEnabled = !!(
  process.env.MINIO_ENDPOINT &&
  process.env.MINIO_ACCESS_KEY &&
  process.env.MINIO_SECRET_KEY
);

const describeFiles = minioEnabled ? describe : describe.skip;

describeFiles('FilesController (e2e — real MinIO)', () => {
  let app: INestApplication;
  let pool: Pool;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();
    pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'director@escuela.edu.do', password: 'Admin123!' })
      .expect(200);
    accessToken = login.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  it('sube un archivo real a MinIO, lo descarga y lo elimina', async () => {
    const content = Buffer.from('SIGRADE evidence content');
    const res = await request(app.getHttpServer())
      .post('/api/v1/files')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', content, 'evidencia.txt')
      .expect(201);

    expect(res.body.id).toBeTruthy();
    expect(res.body.objectKey).toBeTruthy();
    expect(res.body.url).toContain('http');
    const fileId = res.body.id as string;

    const dbRow = await pool.query(`SELECT count(*)::int AS c FROM "evidence_files" WHERE "id" = $1`, [
      fileId,
    ]);
    expect(dbRow.rows[0].c).toBe(1);

    const download = await fetch(res.body.url as string);
    expect(download.ok).toBe(true);
    expect(await download.text()).toBe(content.toString('utf-8'));

    await request(app.getHttpServer())
      .delete(`/api/v1/files/${fileId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const afterDelete = await pool.query(
      `SELECT count(*)::int AS c FROM "evidence_files" WHERE "id" = $1`,
      [fileId],
    );
    expect(afterDelete.rows[0].c).toBe(0);
  });

  it('rechaza subir sin autenticación', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/files')
      .attach('file', Buffer.from('x'), 'x.txt')
      .expect(401);
  });
});