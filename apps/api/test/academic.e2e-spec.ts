import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app/app.module';
import { PrismaService } from '@sigrade/shared-prisma';

describe('AcademicController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let directorToken: string;
  let adminToken: string;
  let tenantId: string;
  let schoolYearId: string;
  let schoolGradeLevelId: string;
  let newGradeLevelId: string;
  let newSubjectId: string;
  let courseId: string;

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

    const loginAdmin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@sigrade.gob.do', password: 'Admin123!' });
    adminToken = loginAdmin.body.accessToken;

    tenantId = login.body.user.tenantId;

    const schoolGradeLevel = await prisma.gradeLevel.findFirst({ where: { tenantId } });
    schoolGradeLevelId = schoolGradeLevel!.id;
  });

  afterAll(async () => {
    if (courseId) await prisma.courseSubject.deleteMany({ where: { courseId } }).catch(() => undefined);
    if (courseId) await prisma.course.delete({ where: { id: courseId } }).catch(() => undefined);
    if (newSubjectId) await prisma.subject.delete({ where: { id: newSubjectId } }).catch(() => undefined);
    if (newGradeLevelId) await prisma.gradeLevel.delete({ where: { id: newGradeLevelId } }).catch(() => undefined);
    if (schoolYearId) await prisma.schoolYear.delete({ where: { id: schoolYearId } }).catch(() => undefined);
    await app.close();
  });

  describe('School Years', () => {
    it('should create a school year', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/academic/school-years')
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ name: `2026-2027-E2E-${Date.now()}`, startDate: '2026-08-15', endDate: '2027-06-30', isActive: true })
        .expect(201);
      expect(res.body).toHaveProperty('id');
      schoolYearId = res.body.id;
    });

    it('should list school years', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/academic/school-years')
        .set('Authorization', `Bearer ${directorToken}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should get a school year by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/academic/school-years/${schoolYearId}`)
        .set('Authorization', `Bearer ${directorToken}`)
        .expect(200);
      expect(res.body.id).toBe(schoolYearId);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer()).get('/api/v1/academic/school-years').expect(401);
    });
  });

  describe('Grade Levels', () => {
    it('should create a grade level as SUPER_ADMIN', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/academic/grade-levels')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Nivel E2E', ordinal: 31, educationLevel: 'SECUNDARIA' })
        .expect(201);
      expect(res.body).toHaveProperty('id');
      newGradeLevelId = res.body.id;
    });

    it('should list grade levels', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/academic/grade-levels')
        .set('Authorization', `Bearer ${directorToken}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Subjects', () => {
    it('should create a subject as SUPER_ADMIN', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/academic/subjects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: `E2E-${Date.now()}`, name: 'Matemáticas E2E', educationLevel: 'PRIMARIA', area: 'MATEMATICAS' })
        .expect(201);
      expect(res.body).toHaveProperty('id');
      newSubjectId = res.body.id;
    });

    it('should list subjects', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/academic/subjects')
        .set('Authorization', `Bearer ${directorToken}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Courses', () => {
    it('should create a course', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/academic/courses')
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ name: `1ro E2E-${Date.now()}`, gradeLevelId: schoolGradeLevelId, schoolYearId })
        .expect(201);
      expect(res.body).toHaveProperty('id');
      courseId = res.body.id;
    });

    it('should list courses', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/academic/courses')
        .set('Authorization', `Bearer ${directorToken}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
