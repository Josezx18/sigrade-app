import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app/app.module';
import { PrismaService } from '@sigrade/shared-prisma';

describe('TenantsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let schoolId: string;

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
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();

    // Login as SCHOOL_DIRECTOR
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'director@escuela.edu.do',
        password: 'Admin123!',
      });
    accessToken = loginResponse.body.accessToken;

    // Get the director's school tenant ID
    const school = await prisma.tenant.findFirst({ where: { type: 'SCHOOL' } });
    schoolId = school?.id ?? '';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/tenants (GET) — requires SUPER_ADMIN/MINERD_ANALYST', () => {
    it('should reject SCHOOL_DIRECTOR with 403', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/tenants')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
    });
  });

  describe('/tenants/tree (GET) — requires SUPER_ADMIN/MINERD_ANALYST', () => {
    it('should reject SCHOOL_DIRECTOR with 403', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/tenants/tree')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
    });
  });

  describe('/tenants/:id (GET)', () => {
    it('should return tenant by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/tenants/${schoolId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('type', 'SCHOOL');
    });

    it('should return 404 for non-existent id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/tenants/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('/tenants/:id/hierarchy (GET)', () => {
    it('should return hierarchy path for the school', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/tenants/${schoolId}/hierarchy`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(1);
      expect(response.body[0].type).toBe('SYSTEM');
      expect(response.body[response.body.length - 1].id).toBe(schoolId);
    });
  });
});
