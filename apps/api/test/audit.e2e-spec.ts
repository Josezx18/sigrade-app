import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app/app.module';
import { PrismaService } from '@sigrade/shared-prisma';

describe('AuditController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let directorToken: string;
  let tenantId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, transformOptions: { enableImplicitConversion: true } }));
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'director@escuela.edu.do', password: 'Admin123!' });
    directorToken = login.body.accessToken;

    tenantId = login.body.user.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Audit Logs', () => {
    it('should create an audit log', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/audit/logs')
        .set('Authorization', `Bearer ${directorToken}`)
        .send({
          tenantId,
          action: 'LOGIN',
          entityType: 'User',
          entityId: tenantId,
        })
        .expect(201);
      expect(res.body).toHaveProperty('id');
    });

    it('should list audit logs', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/audit/logs')
        .set('Authorization', `Bearer ${directorToken}`)
        .expect(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer()).get('/api/v1/audit/logs').expect(401);
    });
  });
});
