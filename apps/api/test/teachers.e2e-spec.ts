import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app/app.module';
import { PrismaService } from '@sigrade/shared-prisma';

describe('TeachersController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let directorToken: string;
  let teacherToken: string;
  let tenantId: string;
  let directorUserId: string;
  let createdTeacherId: string;

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

    const loginDirector = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'director@escuela.edu.do', password: 'Admin123!' });
    directorToken = loginDirector.body.accessToken;
    directorUserId = loginDirector.body.user.id;

    const loginTeacher = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'docente@escuela.edu.do', password: 'Docente123!' });
    teacherToken = loginTeacher.body.accessToken;

    tenantId = loginDirector.body.user.tenantId;
  });

  afterAll(async () => {
    if (createdTeacherId) {
      await prisma.teacher.delete({ where: { id: createdTeacherId } }).catch(() => undefined);
    }
    await app.close();
  });

  const teacherPayload = () => ({
    userId: directorUserId,
    employeeCode: `E2E-TCH-${Date.now()}`,
    degree: 'Licenciatura en Pruebas',
    specialization: 'Testing E2E',
    hireDate: '2020-01-15T00:00:00.000Z',
    contractType: 'NOMBRADO',
    tenantId,
  });

  describe('POST /api/v1/teachers', () => {
    it('should create a teacher when authenticated as SCHOOL_DIRECTOR', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/teachers')
        .set('Authorization', `Bearer ${directorToken}`)
        .send(teacherPayload())
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.employeeCode).toBeDefined();
      createdTeacherId = res.body.id;
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/teachers')
        .send(teacherPayload())
        .expect(401);
    });

    it('should return 403 when authenticated as TEACHER', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/teachers')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(teacherPayload())
        .expect(403);
    });
  });

  describe('GET /api/v1/teachers', () => {
    it('should list teachers as SCHOOL_DIRECTOR', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/teachers')
        .set('Authorization', `Bearer ${directorToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/teachers')
        .expect(401);
    });
  });

  describe('GET /api/v1/teachers/:id', () => {
    it('should return a teacher by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/teachers/${createdTeacherId}`)
        .set('Authorization', `Bearer ${directorToken}`)
        .expect(200);

      expect(res.body.id).toBe(createdTeacherId);
    });

    it('should return 404 for non-existent id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/teachers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${directorToken}`)
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/teachers/${createdTeacherId}`)
        .expect(401);
    });
  });

  describe('PUT /api/v1/teachers/:id', () => {
    it('should update a teacher', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/teachers/${createdTeacherId}`)
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ degree: 'Maestría en Testing' })
        .expect(200);

      expect(res.body.degree).toBe('Maestría en Testing');
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/teachers/${createdTeacherId}`)
        .send({ degree: 'NoAuth' })
        .expect(401);
    });

    it('should return 403 when authenticated as TEACHER', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/teachers/${createdTeacherId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ degree: 'TeacherUpdate' })
        .expect(403);
    });
  });

  describe('DELETE /api/v1/teachers/:id', () => {
    it('should delete a teacher', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/teachers/${createdTeacherId}`)
        .set('Authorization', `Bearer ${directorToken}`)
        .expect(200);
    });

    it('should return 404 after deletion', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/teachers/${createdTeacherId}`)
        .set('Authorization', `Bearer ${directorToken}`)
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/teachers')
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ ...teacherPayload(), employeeCode: `E2E-TCH-DEL-${Date.now()}` });
      const tmpId = createRes.body.id;

      await request(app.getHttpServer())
        .delete(`/api/v1/teachers/${tmpId}`)
        .expect(401);

      await prisma.teacher.delete({ where: { id: tmpId } }).catch(() => undefined);
    });

    it('should return 403 when authenticated as TEACHER', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/teachers')
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ ...teacherPayload(), employeeCode: `E2E-TCH-DEL2-${Date.now()}` });
      const tmpId = createRes.body.id;

      await request(app.getHttpServer())
        .delete(`/api/v1/teachers/${tmpId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);

      await prisma.teacher.delete({ where: { id: tmpId } }).catch(() => undefined);
    });
  });
});
