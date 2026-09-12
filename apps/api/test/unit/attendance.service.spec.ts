import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { AttendanceStatus } from '@prisma/client';
import { AttendanceService } from '../../src/modules/attendance/attendance.service';
import { PrismaService } from '@sigrade/shared-prisma';

const mockPrisma = {
  attendance: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  student: {
    findUnique: jest.fn(),
  },
  courseSubject: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  course: {
    findUnique: jest.fn(),
  },
  studentCourse: {
    findMany: jest.fn(),
  },
};

const rawAttendance = {
  id: 'att-1',
  studentId: 'student-1',
  courseSubjectId: 'cs-1',
  date: new Date('2024-09-15'),
  status: AttendanceStatus.PRESENT,
  checkInTime: new Date('2024-09-15T08:05:00'),
  checkOutTime: null,
  justification: null,
  recordedById: 'teacher-1',
  createdAt: new Date('2024-09-15'),
  student: { id: 'student-1', studentCode: 'STU-001', firstName: 'Juan', lastName: 'Pérez' },
  courseSubject: {
    id: 'cs-1',
    courseId: 'course-1',
    subjectId: 'subj-1',
    course: { id: 'course-1', name: '1ro A', gradeLevel: { id: 'gl-1', name: '1er Grado' } },
    subject: { id: 'subj-1', code: 'MATH-01', name: 'Matemáticas' },
    teacher: { id: 'teacher-1', user: { id: 'user-1', firstName: 'Carlos', lastName: 'García' } },
  },
  recordedBy: { id: 'teacher-1', firstName: 'Carlos', lastName: 'García' },
};

const mappedAttendance = {
  id: 'att-1',
  studentId: 'student-1',
  studentName: 'Juan Pérez',
  studentCode: 'STU-001',
  courseSubjectId: 'cs-1',
  courseId: 'course-1',
  courseName: '1ro A',
  subjectId: 'subj-1',
  subjectName: 'Matemáticas',
  date: rawAttendance.date,
  hour: 8,
  status: AttendanceStatus.PRESENT,
  checkInTime: rawAttendance.checkInTime,
  checkOutTime: null,
  justification: null,
  recordedById: 'teacher-1',
  recordedByName: 'Carlos García',
  createdAt: rawAttendance.createdAt,
  updatedAt: rawAttendance.createdAt,
};

describe('AttendanceService', () => {
  let service: AttendanceService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated attendance records', async () => {
      prisma.attendance.findMany.mockResolvedValue([rawAttendance]);
      prisma.attendance.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20, studentId: 'student-1' });

      expect(prisma.attendance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { studentId: 'student-1' },
          skip: 0,
          take: 20,
          orderBy: { date: 'desc' },
        }),
      );
      expect(result).toEqual({
        data: [mappedAttendance],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should apply date range filters', async () => {
      prisma.attendance.findMany.mockResolvedValue([]);
      prisma.attendance.count.mockResolvedValue(0);

      await service.findAll({ startDate: '2024-09-01', endDate: '2024-09-30' });

      expect(prisma.attendance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { date: { gte: new Date('2024-09-01'), lte: new Date('2024-09-30') } },
        }),
      );
    });

    it('should apply courseId filter', async () => {
      prisma.attendance.findMany.mockResolvedValue([]);
      prisma.attendance.count.mockResolvedValue(0);

      await service.findAll({ courseId: 'course-1' });

      expect(prisma.attendance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { courseSubject: { courseId: 'course-1' } },
        }),
      );
    });
  });

  describe('create', () => {
    it('should create an attendance record', async () => {
      prisma.student.findUnique.mockResolvedValue({ id: 'student-1' });
      prisma.courseSubject.findUnique.mockResolvedValue({ id: 'cs-1' });
      prisma.attendance.findFirst.mockResolvedValue(null);
      prisma.attendance.create.mockResolvedValue({ id: 'att-1' });
      prisma.attendance.findUnique.mockResolvedValue(rawAttendance);

      const result = await service.create(
        { studentId: 'student-1', courseSubjectId: 'cs-1', date: '2024-09-15T08:00:00Z', status: AttendanceStatus.PRESENT },
        'teacher-1',
      );

      expect(prisma.student.findUnique).toHaveBeenCalledWith({ where: { id: 'student-1' } });
      expect(prisma.courseSubject.findUnique).toHaveBeenCalledWith({ where: { id: 'cs-1' } });
      expect(prisma.attendance.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            studentId: 'student-1',
            courseSubjectId: 'cs-1',
            recordedById: 'teacher-1',
          }),
        }),
      );
      expect(result).toEqual(mappedAttendance);
    });

    it('should throw NotFoundException when student does not exist', async () => {
      prisma.student.findUnique.mockResolvedValue(null);
      prisma.courseSubject.findUnique.mockResolvedValue({ id: 'cs-1' });

      await expect(
        service.create(
          { studentId: 'nonexistent', courseSubjectId: 'cs-1', date: '2024-09-15', status: AttendanceStatus.PRESENT },
          'teacher-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when duplicate exists', async () => {
      prisma.student.findUnique.mockResolvedValue({ id: 'student-1' });
      prisma.courseSubject.findUnique.mockResolvedValue({ id: 'cs-1' });
      prisma.attendance.findFirst.mockResolvedValue(rawAttendance);

      await expect(
        service.create(
          { studentId: 'student-1', courseSubjectId: 'cs-1', date: '2024-09-15', status: AttendanceStatus.PRESENT },
          'teacher-1',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple attendance records', async () => {
      prisma.courseSubject.findUnique.mockResolvedValue({ id: 'cs-1' });
      prisma.attendance.findFirst.mockResolvedValue(null);
      prisma.attendance.create.mockResolvedValue({ id: 'att-1' });

      const result = await service.bulkCreate(
        {
          courseSubjectId: 'cs-1',
          date: '2024-09-15',
          attendances: [
            { studentId: 'student-1', status: AttendanceStatus.PRESENT },
            { studentId: 'student-2', status: AttendanceStatus.ABSENT },
          ],
        },
        'teacher-1',
      );

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should update existing records instead of duplicates', async () => {
      prisma.courseSubject.findUnique.mockResolvedValue({ id: 'cs-1' });
      prisma.attendance.findFirst.mockResolvedValueOnce(rawAttendance).mockResolvedValueOnce(null);
      prisma.attendance.update.mockResolvedValue({ id: 'att-1' });
      prisma.attendance.create.mockResolvedValue({ id: 'att-2' });

      const result = await service.bulkCreate(
        {
          courseSubjectId: 'cs-1',
          date: '2024-09-15',
          attendances: [
            { studentId: 'student-1', status: AttendanceStatus.PRESENT },
            { studentId: 'student-2', status: AttendanceStatus.LATE },
          ],
        },
        'teacher-1',
      );

      expect(result.created).toBe(1);
      expect(result.updated).toBe(1);
      expect(prisma.attendance.update).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an attendance record', async () => {
      prisma.attendance.findUnique
        .mockResolvedValueOnce(rawAttendance)
        .mockResolvedValueOnce(rawAttendance);
      prisma.attendance.update.mockResolvedValue({ id: 'att-1' });

      const result = await service.update('att-1', {
        status: AttendanceStatus.JUSTIFIED,
        justification: 'Cita médica',
      });

      expect(prisma.attendance.update).toHaveBeenCalledWith({
        where: { id: 'att-1' },
        data: { status: AttendanceStatus.JUSTIFIED, justification: 'Cita médica' },
      });
      expect(result).toEqual(mappedAttendance);
    });

    it('should throw NotFoundException when record does not exist', async () => {
      prisma.attendance.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { status: AttendanceStatus.PRESENT }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMonthlyReport', () => {
    it('should generate a monthly report', async () => {
      const mockCourse = { id: 'course-1', name: '1ro A', gradeLevel: { name: '1er Grado' } };
      const mockCourseSubjects = [{ id: 'cs-1' }, { id: 'cs-2' }];
      const mockEnrollments = [{
        studentId: 'student-1',
        student: { id: 'student-1', studentCode: 'STU-001', firstName: 'Juan', lastName: 'Pérez' },
      }];
      const mockAttendances = [
        { id: 'att-1', date: new Date('2024-09-15'), status: AttendanceStatus.PRESENT, checkInTime: null, checkOutTime: null, justification: null },
        { id: 'att-2', date: new Date('2024-09-16'), status: AttendanceStatus.PRESENT, checkInTime: null, checkOutTime: null, justification: null },
        { id: 'att-3', date: new Date('2024-09-17'), status: AttendanceStatus.ABSENT, checkInTime: null, checkOutTime: null, justification: null },
      ];

      prisma.course.findUnique.mockResolvedValue(mockCourse);
      prisma.courseSubject.findMany.mockResolvedValue(mockCourseSubjects);
      prisma.studentCourse.findMany.mockResolvedValue(mockEnrollments);
      prisma.attendance.findMany.mockResolvedValue(mockAttendances);

      const result = await service.generateMonthlyReport({ courseId: 'course-1', year: 2024, month: 9 });

      expect(result).toMatchObject({
        courseId: 'course-1',
        courseName: '1ro A',
        gradeLevel: '1er Grado',
        year: 2024,
        month: 9,
        summary: {
          totalStudents: 1,
          averageAttendanceRate: expect.any(Number),
          totalAbsences: 1,
          totalJustified: 0,
          criticalCases: expect.any(Array),
        },
      });
      expect(result.students).toHaveLength(1);
      expect(result.students[0].present).toBe(2);
      expect(result.students[0].absent).toBe(1);
    });

    it('should throw NotFoundException when course does not exist', async () => {
      prisma.course.findUnique.mockResolvedValue(null);

      await expect(
        service.generateMonthlyReport({ courseId: 'nonexistent', year: 2024, month: 9 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete an attendance record', async () => {
      prisma.attendance.findUnique.mockResolvedValue(rawAttendance);
      prisma.attendance.delete.mockResolvedValue(rawAttendance);

      const result = await service.delete('att-1');

      expect(prisma.attendance.delete).toHaveBeenCalledWith({ where: { id: 'att-1' } });
      expect(result).toEqual({ message: 'Registro de asistencia eliminado correctamente' });
    });

    it('should throw NotFoundException when record does not exist', async () => {
      prisma.attendance.findUnique.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
