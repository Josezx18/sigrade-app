import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app/app.module';
import { PrismaService } from '@sigrade/shared-prisma';

describe('CounselingController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let directorToken: string;
  let tenantId: string;
  let studentId: string;
  let alertId: string;

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

    const school = await prisma.tenant.findFirst({ where: { type: 'SCHOOL' } });
    tenantId = school!.id;

    const student = await prisma.student.findFirst({ where: { tenantId } });
    studentId = student!.id;
  });

  afterAll(async () => {
    if (alertId) await prisma.riskAlert.delete({ where: { id: alertId } }).catch(() => undefined);
    await app.close();
  });

  describe('Risk Alerts', () => {
    it('should create a risk alert', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/counseling/risk-alerts')
        .set('Authorization', `Bearer ${directorToken}`)
        .send({
          studentId,
          type: 'ACADEMIC_FAILURE',
          severity: 'MEDIUM',
          title: 'Bajo rendimiento en matemáticas',
          description: 'El estudiante ha obtenido calificaciones por debajo del mínimo en las últimas evaluaciones.',
        })
        .expect(201);
      expect(res.body).toHaveProperty('id');
      alertId = res.body.id;
    });

    it('should list risk alerts', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/counseling/risk-alerts')
        .set('Authorization', `Bearer ${directorToken}`)
        .expect(200);
      expect(res.body.data).toBeDefined();
    });

    it('should get a risk alert by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/counseling/risk-alerts/${alertId}`)
        .set('Authorization', `Bearer ${directorToken}`)
        .expect(200);
      expect(res.body.id).toBe(alertId);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer()).get('/api/v1/counseling/risk-alerts').expect(401);
    });
  });

  describe('Dashboard', () => {
    it('should return risk dashboard stats', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/counseling/risk-alerts/dashboard')
        .set('Authorization', `Bearer ${directorToken}`)
        .expect(200);
      expect(res.body).toHaveProperty('totalAlerts');
    });
  });

  describe('Counseling Cases', () => {
    it('should list counseling cases', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/counseling/cases')
        .set('Authorization', `Bearer ${directorToken}`)
        .expect(200);
      expect(res.body.data).toBeDefined();
    });
  });
});
