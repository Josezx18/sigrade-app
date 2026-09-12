import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app/app.module';
import { PrismaService } from '@sigrade/shared-prisma';

describe('StudentsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let directorToken: string;
  let teacherToken: string;
  let schoolId: string;
  let createdStudentId: string;

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

    const loginTeacher = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'docente@escuela.edu.do', password: 'Docente123!' });
    teacherToken = loginTeacher.body.accessToken;

    schoolId = loginDirector.body.user.tenantId;
  });

  afterAll(async () => {
    if (createdStudentId) {
      await prisma.student.delete({ where: { id: createdStudentId } }).catch(() => undefined);
    }
    await app.close();
  });

  const studentPayload = () => ({
    studentCode: `E2E-${Date.now()}`,
    firstName: 'Test',
    lastName: 'Student',
    birthDate: '2010-01-15T00:00:00.000Z',
    gender: 'M',
    address: '123 Test Street',
    tenantId: schoolId,
  });

  describe('POST /api/v1/students', () => {
    it('should create a student when authenticated as SCHOOL_DIRECTOR', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/students')
        .set('Authorization', `Bearer ${directorToken}`)
        .send(studentPayload())
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.studentCode).toBeDefined();
      createdStudentId = res.body.id;
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/students')
        .send(studentPayload())
        .expect(401);
    });

    it('should return 403 when authenticated as TEACHER', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/students')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(studentPayload())
        .expect(403);
    });
  });

  describe('GET /api/v1/students', () => {
    it('should list students as SCHOOL_DIRECTOR', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/students')
        .set('Authorization', `Bearer ${directorToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should list students as TEACHER', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/students')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/students')
        .expect(401);
    });
  });

  describe('GET /api/v1/students/:id', () => {
    it('should return a student by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/students/${createdStudentId}`)
        .set('Authorization', `Bearer ${directorToken}`)
        .expect(200);

      expect(res.body.id).toBe(createdStudentId);
    });

    it('should return 404 for non-existent id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/students/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${directorToken}`)
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/students/${createdStudentId}`)
        .expect(401);
    });
  });

  describe('PUT /api/v1/students/:id', () => {
    it('should update a student', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/students/${createdStudentId}`)
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ firstName: 'UpdatedName' })
        .expect(200);

      expect(res.body.firstName).toBe('UpdatedName');
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/students/${createdStudentId}`)
        .send({ firstName: 'NoAuth' })
        .expect(401);
    });

    it('should return 403 when authenticated as TEACHER', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/students/${createdStudentId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ firstName: 'TeacherUpdate' })
        .expect(403);
    });
  });

  describe('DELETE /api/v1/students/:id', () => {
    it('should delete a student', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/students/${createdStudentId}`)
        .set('Authorization', `Bearer ${directorToken}`)
        .expect(200);
    });

    it('should return 404 after deletion', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/students/${createdStudentId}`)
        .set('Authorization', `Bearer ${directorToken}`)
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/students')
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ ...studentPayload(), studentCode: `E2E-DEL2-${Date.now()}` });
      const tmpId = createRes.body.id;

      await request(app.getHttpServer())
        .delete(`/api/v1/students/${tmpId}`)
        .expect(401);

      await prisma.student.delete({ where: { id: tmpId } }).catch(() => undefined);
    });

    it('should return 403 when authenticated as TEACHER', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/students')
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ ...studentPayload(), studentCode: `E2E-DEL3-${Date.now()}` });
      const tmpId = createRes.body.id;

      await request(app.getHttpServer())
        .delete(`/api/v1/students/${tmpId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);

      await prisma.student.delete({ where: { id: tmpId } }).catch(() => undefined);
    });
  });
});
