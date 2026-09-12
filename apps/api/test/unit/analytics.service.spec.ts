import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AnalyticsService } from '../../src/modules/analytics/analytics.service';
import { PrismaService } from '@sigrade/shared-prisma';

const mockPrisma = {
  tenant: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  student: {
    count: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  teacher: {
    count: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  course: { count: jest.fn() },
  subject: { count: jest.fn(), findMany: jest.fn() },
  grade: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  attendance: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  riskAlert: {
    count: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  counselingCase: { count: jest.fn() },
  auditLog: { findMany: jest.fn() },
  planning: { count: jest.fn() },
  planningSession: { count: jest.fn() },
  studentCourse: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('should return national dashboard for SYSTEM tenant', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ id: 'tenant-1', type: 'SYSTEM' });
      prisma.tenant.findMany.mockResolvedValue([]);
      prisma.student.count.mockResolvedValue(100);
      prisma.teacher.count.mockResolvedValue(10);
      prisma.course.count.mockResolvedValue(5);
      prisma.subject.count.mockResolvedValue(20);
      prisma.subject.findMany.mockResolvedValue([]);
      prisma.grade.findMany.mockResolvedValue([{ score: 85, maxScore: 100 }]);
      prisma.attendance.findMany.mockResolvedValue([{ status: 'PRESENT' }]);
      prisma.teacher.findMany.mockResolvedValue([]);
      prisma.riskAlert.findMany.mockResolvedValue([]);
      prisma.riskAlert.count.mockResolvedValue(2);
      prisma.counselingCase.count.mockResolvedValue(1);
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.tenant.count.mockResolvedValue(0);

      const result = await service.getDashboard('tenant-1');

      expect(result).toBeDefined();
      expect(result.kpis).toBeDefined();
      expect(result.kpis.totalStudents).toBe(100);
    });

    it('should return school dashboard for SCHOOL tenant', async () => {
      prisma.tenant.findUnique.mockResolvedValue({ id: 'tenant-1', type: 'SCHOOL' });
      prisma.tenant.findMany.mockResolvedValue([]);
      prisma.student.count.mockResolvedValue(50);
      prisma.teacher.count.mockResolvedValue(5);
      prisma.course.count.mockResolvedValue(3);
      prisma.subject.count.mockResolvedValue(10);
      prisma.subject.findMany.mockResolvedValue([]);
      prisma.grade.findMany.mockResolvedValue([]);
      prisma.attendance.findMany.mockResolvedValue([]);
      prisma.riskAlert.count.mockResolvedValue(0);
      prisma.riskAlert.findMany.mockResolvedValue([]);
      prisma.counselingCase.count.mockResolvedValue(0);
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.teacher.findMany.mockResolvedValue([]);

      const result = await service.getDashboard('tenant-1');

      expect(result).toBeDefined();
      expect(result.kpis).toBeDefined();
    });

    it('should throw NotFoundException when tenant not found', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.getDashboard('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });



  describe('getSchoolPerformance', () => {
    it('should return school ranking', async () => {
      prisma.tenant.findMany.mockResolvedValue([
        { id: 'school-1', name: 'School A', parentId: 'dist-1' },
        { id: 'school-2', name: 'School B', parentId: 'dist-1' },
      ]);
      prisma.grade.findMany.mockResolvedValue([{ score: 90, maxScore: 100 }]);
      prisma.attendance.findMany.mockResolvedValue([{ status: 'PRESENT' }]);

      const result = await service.getSchoolRanking('dist-1');

      expect(result).toHaveLength(2);
      expect(result[0].schoolId).toBeDefined();
    });

    it('should return empty array when no schools', async () => {
      prisma.tenant.findMany.mockResolvedValue([]);

      const result = await service.getSchoolRanking('dist-1');

      expect(result).toEqual([]);
    });
  });

  describe('getSchoolDashboard', () => {
    it('should return school dashboard with teachers and at-risk students', async () => {
      prisma.tenant.findMany.mockResolvedValue([]);
      prisma.student.count.mockResolvedValue(100);
      prisma.teacher.count.mockResolvedValue(10);
      prisma.course.count.mockResolvedValue(5);
      prisma.subject.count.mockResolvedValue(15);
      prisma.subject.findMany.mockResolvedValue([]);
      prisma.grade.findMany.mockResolvedValue([]);
      prisma.attendance.findMany.mockResolvedValue([]);
      prisma.riskAlert.count.mockResolvedValue(0);
      prisma.riskAlert.findMany.mockResolvedValue([]);
      prisma.counselingCase.count.mockResolvedValue(0);
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.teacher.findMany.mockResolvedValue([]);

      const result = await service.getSchoolDashboard('tenant-1');

      expect(result).toBeDefined();
      expect(result.teacherPerformance).toEqual([]);
      expect(result.studentsAtRisk).toEqual([]);
      expect(result.subjectDetails).toEqual([]);
    });
  });

  describe('getPredictiveAnalytics', () => {
    it('should return risk prediction for a student', async () => {
      prisma.student.findFirst.mockResolvedValue({ id: 's-1', tenantId: 'tenant-1' });

      const result = await service.getPredictiveAnalytics('s-1', 'tenant-1');

      expect(result.studentId).toBe('s-1');
      expect(result.dropoutProbability).toBeGreaterThanOrEqual(0);
      expect(result.riskLevel).toBeDefined();
      expect(result.riskFactors).toHaveLength(5);
      expect(result.recommendations).toBeDefined();
      expect(result.confidence).toBe(0.85);
    });

    it('should throw NotFoundException when student not found', async () => {
      prisma.student.findFirst.mockResolvedValue(null);

      await expect(service.getPredictiveAnalytics('nonexistent', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTeacherDashboard', () => {
    it('should return teacher dashboard', async () => {
      prisma.teacher.findFirst.mockResolvedValue({
        id: 't-1', tenantId: 'tenant-1', user: { firstName: 'Juan', lastName: 'Perez' },
        courseSubjects: [{ id: 'cs-1', courseId: 'c-1', hoursWeekly: 4, course: { id: 'c-1', name: '1ro A' }, subject: { id: 'sub-1', name: 'Matematicas' } }],
      });
      prisma.studentCourse.count.mockResolvedValue(25);
      prisma.grade.findMany.mockResolvedValue([]);
      prisma.attendance.findMany.mockResolvedValue([]);
      prisma.planning.count.mockResolvedValue(0);
      prisma.studentCourse.findMany.mockResolvedValue([]);
      prisma.planningSession.count.mockResolvedValue(0);

      const result = await service.getTeacherDashboard('t-1', 'tenant-1');

      expect(result.teacherId).toBe('t-1');
      expect(result.courses).toHaveLength(1);
      expect(result.workload).toBeDefined();
    });

    it('should throw NotFoundException when teacher not found', async () => {
      prisma.teacher.findFirst.mockResolvedValue(null);

      await expect(service.getTeacherDashboard('nonexistent', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStudentsAtRisk', () => {
    it('should return students at risk', async () => {
      prisma.riskAlert.findMany.mockResolvedValue([
        { studentId: 's-1', severity: 'HIGH', student: { id: 's-1', studentCode: 'STU001', firstName: 'Juan', lastName: 'Perez', enrollments: [{ course: { name: '1ro A', gradeLevel: { name: 'Primero' } } }] } },
      ]);
      prisma.student.findUnique.mockResolvedValue({
        id: 's-1', studentCode: 'STU001', firstName: 'Juan', lastName: 'Perez',
        enrollments: [{ status: 'ACTIVE', course: { name: '1ro A', gradeLevel: { name: 'Primero' } } }],
      });
      prisma.grade.findMany.mockResolvedValue([]);
      prisma.attendance.findMany.mockResolvedValue([]);

      const result = await service.getStudentsAtRisk('tenant-1');

      expect(result).toHaveLength(1);
      expect(result[0].studentId).toBe('s-1');
    });
  });

  describe('exportReport / getReportStatus', () => {
    it('should create report and return status', async () => {
      const response = await service.exportReport({ reportType: 'DASHBOARD', format: 'PDF' }, 'u-1', 'tenant-1');

      expect(response.reportId).toBeDefined();
      expect(response.status).toBe('PENDING');

      const status = await service.getReportStatus(response.reportId);

      expect(status.reportId).toBe(response.reportId);
    });

    it('should throw NotFoundException for unknown report', async () => {
      await expect(service.getReportStatus('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDistrictRanking', () => {
    it('should return district ranking', async () => {
      prisma.tenant.findMany.mockResolvedValueOnce([{ id: 'reg-1', name: 'Regional 1', parentId: 'nat-1' }]);
      prisma.tenant.findMany.mockResolvedValueOnce([{ id: 'dist-1', name: 'Distrito 1', parentId: 'reg-1' }]);
      prisma.tenant.findMany.mockResolvedValueOnce([{ id: 'school-1', name: 'School', parentId: 'dist-1' }]);
      prisma.grade.findMany.mockResolvedValue([]);
      prisma.attendance.findMany.mockResolvedValue([]);

      const result = await service.getDistrictRanking('nat-1');

      expect(result).toBeDefined();
    });
  });

  describe('getNationalDashboard', () => {
    it('should return national dashboard with regions', async () => {
      prisma.tenant.findMany.mockResolvedValueOnce([]);
      prisma.tenant.findMany.mockResolvedValue([]);
      prisma.student.count.mockResolvedValue(100);
      prisma.teacher.count.mockResolvedValue(10);
      prisma.course.count.mockResolvedValue(5);
      prisma.subject.count.mockResolvedValue(20);
      prisma.subject.findMany.mockResolvedValue([]);
      prisma.grade.findMany.mockResolvedValue([]);
      prisma.attendance.findMany.mockResolvedValue([]);
      prisma.riskAlert.count.mockResolvedValue(0);
      prisma.counselingCase.count.mockResolvedValue(0);
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.tenant.count.mockResolvedValue(0);

      const result = await service.getNationalDashboard('tenant-1');

      expect(result.regionalComparison).toEqual([]);
      expect(result.districtRanking).toBeDefined();
    });
  });
});
