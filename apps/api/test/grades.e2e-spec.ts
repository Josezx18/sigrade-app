import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app/app.module';
import { PrismaService } from '@sigrade/shared-prisma';

describe('GradesController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let directorToken: string;
  let teacherToken: string;
  let tenantId: string;
  let studentId: string;
  let courseSubjectId: string;
  let periodId: string;
  let gradedById: string;
  let createdGradeId: string;

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
    gradedById = loginDirector.body.user.id;

    const loginTeacher = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'docente@escuela.edu.do', password: 'Docente123!' });
    teacherToken = loginTeacher.body.accessToken;

    tenantId = loginDirector.body.user.tenantId;

    const existingStudent = await prisma.student.findFirst({ where: { tenantId } });
    studentId = existingStudent!.id;

    const course = await prisma.course.findFirst({ where: { tenantId } });
    const subject = await prisma.subject.findFirst({ where: { tenantId } });
    const teacher = await prisma.teacher.findFirst({ where: { tenantId } });
    const schoolYear = await prisma.schoolYear.findFirst({ where: { tenantId, isActive: true } });

    let cs = await prisma.courseSubject.findFirst({
      where: { courseId: course!.id, subjectId: subject!.id },
    });
    if (!cs) {
      cs = await prisma.courseSubject.create({
        data: {
          courseId: course!.id,
          subjectId: subject!.id,
          teacherId: teacher!.id,
          hoursWeekly: 5,
        },
      });
    }
    courseSubjectId = cs.id;

    let period = await prisma.academicPeriod.findFirst({
      where: { schoolYearId: schoolYear!.id, ordinal: 1 },
    });
    if (!period) {
      period = await prisma.academicPeriod.create({
        data: {
          code: `E2E-P1-${Date.now()}`,
          name: 'Primer Periodo E2E',
          ordinal: 1,
          startDate: new Date('2025-08-15'),
          endDate: new Date('2025-10-15'),
          schoolYearId: schoolYear!.id,
        },
      });
    }
    periodId = period.id;
  });

  afterAll(async () => {
    if (createdGradeId) {
      await prisma.grade.delete({ where: { id: createdGradeId } }).catch(() => undefined);
    }
    await prisma.academicPeriod.delete({ where: { id: periodId } }).catch(() => undefined);
    await prisma.courseSubject.delete({ where: { id: courseSubjectId } }).catch(() => undefined);
    await app.close();
  });

  const gradePayload = () => ({
    studentId,
    subjectId: courseSubjectId,
    periodId,
    teacherId: gradedById,
    value: 85,
    weight: 1,
    name: 'Examen Parcial 1',
    type: 'EXAM',
  });

  describe('POST /api/v1/grades', () => {
    it('should create a grade when authenticated as SCHOOL_DIRECTOR', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/grades')
        .set('Authorization', `Bearer ${directorToken}`)
        .send(gradePayload())
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(Number(res.body.score)).toBe(85);
      createdGradeId = res.body.id;
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/grades')
        .send(gradePayload())
        .expect(401);
    });
  });

  describe('POST /api/v1/grades/bulk', () => {
    it('should create grades in bulk', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/grades/bulk')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send([gradePayload()])
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/grades', () => {
    it('should list grades', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/grades')
        .set('Authorization', `Bearer ${directorToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter grades by studentId', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/grades?studentId=${studentId}`)
        .set('Authorization', `Bearer ${directorToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/grades')
        .expect(401);
    });
  });

  describe('GET /api/v1/grades/:id', () => {
    it('should return a grade by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/grades/${createdGradeId}`)
        .set('Authorization', `Bearer ${directorToken}`)
        .expect(200);

      expect(res.body.id).toBe(createdGradeId);
    });

    it('should return 404 for non-existent id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/grades/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${directorToken}`)
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/grades/${createdGradeId}`)
        .expect(401);
    });
  });

  describe('PUT /api/v1/grades/:id', () => {
    it('should update a grade', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/grades/${createdGradeId}`)
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ value: 90 })
        .expect(200);

      expect(Number(res.body.score)).toBe(90);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/grades/${createdGradeId}`)
        .send({ score: 50 })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/grades/:id', () => {
    it('should delete a grade', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/grades/${createdGradeId}`)
        .set('Authorization', `Bearer ${directorToken}`)
        .expect(200);
    });

    it('should return 404 after deletion', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/grades/${createdGradeId}`)
        .set('Authorization', `Bearer ${directorToken}`)
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/grades')
        .set('Authorization', `Bearer ${directorToken}`)
        .send(gradePayload());
      const tmpId = createRes.body.id;

      await request(app.getHttpServer())
        .delete(`/api/v1/grades/${tmpId}`)
        .expect(401);

      await prisma.grade.delete({ where: { id: tmpId } }).catch(() => undefined);
    });
  });
});
