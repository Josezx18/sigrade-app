import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app/app.module';
import { PrismaService } from '@sigrade/shared-prisma';

describe('AttendanceController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let directorToken: string;
  let tenantId: string;
  let studentId: string;
  let courseSubjectId: string;
  let courseId: string;
  let createdAttendanceId: string;

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

    tenantId = loginDirector.body.user.tenantId;

    const existingStudent = await prisma.student.findFirst({ where: { tenantId } });
    studentId = existingStudent!.id;

    const course = await prisma.course.findFirst({ where: { tenantId } });
    courseId = course!.id;

    const subject = await prisma.subject.findFirst({ where: { tenantId } });
    const teacher = await prisma.teacher.findFirst({ where: { tenantId } });

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
  });

  afterAll(async () => {
    if (createdAttendanceId) {
      await prisma.attendance.delete({ where: { id: createdAttendanceId } }).catch(() => undefined);
    }
    await prisma.courseSubject.delete({ where: { id: courseSubjectId } }).catch(() => undefined);
    await app.close();
  });

  const attendancePayload = () => ({
    studentId,
    courseSubjectId,
    date: '2024-09-15T08:00:00Z',
    status: 'PRESENT',
    checkInTime: '2024-09-15T07:55:00Z',
    checkOutTime: '2024-09-15T14:00:00Z',
  });

  describe('POST /api/v1/attendance', () => {
    it('should create an attendance record when authenticated as SCHOOL_DIRECTOR', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/attendance')
        .set('Authorization', `Bearer ${directorToken}`)
        .send(attendancePayload())
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.status).toBe('PRESENT');
      createdAttendanceId = res.body.id;
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/attendance')
        .send(attendancePayload())
        .expect(401);
    });
  });

  describe('POST /api/v1/attendance/bulk', () => {
    it('should create attendance records in bulk', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/attendance/bulk')
        .set('Authorization', `Bearer ${directorToken}`)
        .send({
          courseSubjectId,
          date: '2024-09-16',
          attendances: [
            { studentId, status: 'PRESENT', checkInTime: '2024-09-16T07:55:00Z' },
          ],
        })
        .expect(201);

      expect(res.body).toHaveProperty('created');
      expect(res.body).toHaveProperty('updated');
      expect(res.body).toHaveProperty('errors');
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/attendance/bulk')
        .send({ courseSubjectId, date: '2024-09-16', attendances: [] })
        .expect(401);
    });
  });

  describe('GET /api/v1/attendance', () => {
    it('should list attendance records', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/attendance')
        .set('Authorization', `Bearer ${directorToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter by studentId', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/attendance?studentId=${studentId}`)
        .set('Authorization', `Bearer ${directorToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/attendance')
        .expect(401);
    });
  });

  describe('GET /api/v1/attendance/monthly-report', () => {
    it('should generate a monthly report', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/attendance/monthly-report?courseId=${courseId}&year=2024&month=9`)
        .set('Authorization', `Bearer ${directorToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('courseId', courseId);
      expect(res.body).toHaveProperty('students');
      expect(res.body).toHaveProperty('summary');
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/attendance/monthly-report?courseId=${courseId}&year=2024&month=9`)
        .expect(401);
    });
  });

  describe('PATCH /api/v1/attendance/:id', () => {
    it('should update an attendance record', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/attendance/${createdAttendanceId}`)
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ status: 'LATE' })
        .expect(200);

      expect(res.body.status).toBe('LATE');
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/attendance/${createdAttendanceId}`)
        .send({ status: 'ABSENT' })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/attendance/:id', () => {
    it('should delete an attendance record', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/attendance/${createdAttendanceId}`)
        .set('Authorization', `Bearer ${directorToken}`)
        .expect(200);
    });

    it('should return 404 after deletion', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/attendance/${createdAttendanceId}`)
        .set('Authorization', `Bearer ${directorToken}`)
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/attendance')
        .set('Authorization', `Bearer ${directorToken}`)
        .send(attendancePayload());
      const tmpId = createRes.body.id;

      await request(app.getHttpServer())
        .delete(`/api/v1/attendance/${tmpId}`)
        .expect(401);

      await prisma.attendance.delete({ where: { id: tmpId } }).catch(() => undefined);
    });
  });
});
