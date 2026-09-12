import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AcademicService } from '../../src/modules/academic/academic.service';
import { PrismaService } from '@sigrade/shared-prisma';

const mockPrisma = {
  schoolYear: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  academicPeriod: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  gradeLevel: { findMany: jest.fn(), create: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
  subject: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  course: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  courseSubject: { create: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
  schedule: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },
};

describe('AcademicService', () => {
  let service: AcademicService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AcademicService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<AcademicService>(AcademicService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  // ==================== SCHOOL YEARS ====================
  describe('SchoolYears', () => {
    it('findAll', async () => {
      prisma.schoolYear.findMany.mockResolvedValue([{ id: 'sy-1' }]);
      const result = await service.findSchoolYears('tenant-1');
      expect(prisma.schoolYear.findMany).toHaveBeenCalledWith({ where: { tenantId: 'tenant-1' }, orderBy: { startDate: 'desc' } });
      expect(result).toHaveLength(1);
    });

    it('findById returns entity', async () => {
      const mock = { id: 'sy-1', periods: [] };
      prisma.schoolYear.findUnique.mockResolvedValue(mock);
      const result = await service.findSchoolYearById('sy-1');
      expect(result).toEqual(mock);
    });

    it('findById throws NotFound when missing', async () => {
      prisma.schoolYear.findUnique.mockResolvedValue(null);
      await expect(service.findSchoolYearById('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('create', async () => {
      prisma.schoolYear.create.mockResolvedValue({ id: 'sy-1' });
      const result = await service.createSchoolYear('t-1', { name: '2024', startDate: '2024-08-19', endDate: '2025-06-27' });
      expect(prisma.schoolYear.create).toHaveBeenCalledWith({ data: expect.objectContaining({ name: '2024' }) });
      expect(result.id).toBe('sy-1');
    });

    it('update', async () => {
      prisma.schoolYear.findUnique.mockResolvedValue({ id: 'sy-1' });
      prisma.schoolYear.update.mockResolvedValue({ id: 'sy-1', name: 'Updated' });
      const result = await service.updateSchoolYear('sy-1', { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });

    it('delete', async () => {
      prisma.schoolYear.findUnique.mockResolvedValue({ id: 'sy-1' });
      prisma.schoolYear.delete.mockResolvedValue({ id: 'sy-1' });
      const result = await service.deleteSchoolYear('sy-1');
      expect(result.id).toBe('sy-1');
    });
  });

  // ==================== PERIODS ====================
  describe('Periods', () => {
    it('findAll', async () => {
      prisma.academicPeriod.findMany.mockResolvedValue([{ id: 'p-1' }]);
      const result = await service.findPeriods('sy-1');
      expect(prisma.academicPeriod.findMany).toHaveBeenCalledWith({ where: { schoolYearId: 'sy-1' }, orderBy: { ordinal: 'asc' } });
      expect(result).toHaveLength(1);
    });

    it('create', async () => {
      prisma.schoolYear.findUnique.mockResolvedValue({ id: 'sy-1' });
      prisma.academicPeriod.create.mockResolvedValue({ id: 'p-1' });
      const result = await service.createPeriod('sy-1', { name: 'P1', ordinal: 1, startDate: '2025-08-18', endDate: '2025-10-31' });
      expect(result.id).toBe('p-1');
    });

    it('create throws when schoolYear missing', async () => {
      prisma.schoolYear.findUnique.mockResolvedValue(null);
      await expect(service.createPeriod('nonexistent', { name: 'P1', ordinal: 1, startDate: '2025-08-18', endDate: '2025-10-31' })).rejects.toThrow(NotFoundException);
    });

    it('delete throws when missing', async () => {
      prisma.academicPeriod.findUnique.mockResolvedValue(null);
      await expect(service.deletePeriod('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== GRADE LEVELS ====================
  describe('GradeLevels', () => {
    it('findAll', async () => {
      prisma.gradeLevel.findMany.mockResolvedValue([{ id: 'gl-1' }]);
      const result = await service.findGradeLevels('t-1');
      expect(result).toHaveLength(1);
    });

    it('create', async () => {
      prisma.gradeLevel.create.mockResolvedValue({ id: 'gl-1' });
      const result = await service.createGradeLevel('t-1', { name: '1ro', ordinal: 1, educationLevel: 'PRIMARIA' });
      expect(result.id).toBe('gl-1');
    });

    it('delete throws when missing', async () => {
      prisma.gradeLevel.findUnique.mockResolvedValue(null);
      await expect(service.deleteGradeLevel('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== SUBJECTS ====================
  describe('Subjects', () => {
    it('findAll', async () => {
      prisma.subject.findMany.mockResolvedValue([{ id: 'sub-1' }]);
      const result = await service.findSubjects('t-1');
      expect(result).toHaveLength(1);
    });

    it('findAll with educationLevel filter', async () => {
      prisma.subject.findMany.mockResolvedValue([]);
      await service.findSubjects('t-1', { educationLevel: 'PRIMARY' });
      expect(prisma.subject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ educationLevel: 'PRIMARY' }) }),
      );
    });

    it('create', async () => {
      prisma.subject.create.mockResolvedValue({ id: 'sub-1' });
      const result = await service.createSubject('t-1', { code: 'MATH', name: 'Math', educationLevel: 'PRIMARIA', area: 'MATEMATICAS' });
      expect(result.id).toBe('sub-1');
    });

    it('update', async () => {
      prisma.subject.findUnique.mockResolvedValue({ id: 'sub-1' });
      prisma.subject.update.mockResolvedValue({ id: 'sub-1', name: 'Updated' });
      const result = await service.updateSubject('sub-1', { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });

    it('delete', async () => {
      prisma.subject.findUnique.mockResolvedValue({ id: 'sub-1' });
      prisma.subject.delete.mockResolvedValue({ id: 'sub-1' });
      const result = await service.deleteSubject('sub-1');
      expect(result.id).toBe('sub-1');
    });
  });

  // ==================== COURSES ====================
  describe('Courses', () => {
    it('findAll', async () => {
      prisma.course.findMany.mockResolvedValue([{ id: 'c-1' }]);
      const result = await service.findCourses('t-1');
      expect(result).toHaveLength(1);
    });

    it('findAll with filters', async () => {
      await service.findCourses('t-1', { schoolYearId: 'sy-1', gradeLevelId: 'gl-1' });
      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: 't-1', schoolYearId: 'sy-1', gradeLevelId: 'gl-1' } }),
      );
    });

    it('findById', async () => {
      prisma.course.findUnique.mockResolvedValue({ id: 'c-1', subjects: [], schedule: [] });
      const result = await service.findCourseById('c-1');
      expect(result.id).toBe('c-1');
    });

    it('findById throws when missing', async () => {
      prisma.course.findUnique.mockResolvedValue(null);
      await expect(service.findCourseById('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('create', async () => {
      prisma.course.create.mockResolvedValue({ id: 'c-1' });
      const result = await service.createCourse('t-1', { gradeLevelId: 'gl-1', schoolYearId: 'sy-1', name: '1ro A' });
      expect(result.id).toBe('c-1');
    });
  });

  // ==================== COURSE-SUBJECT ====================
  describe('CourseSubject assignments', () => {
    it('assign', async () => {
      prisma.courseSubject.create.mockResolvedValue({ id: 'cs-1' });
      const result = await service.assignSubjectToCourse({ courseId: 'c-1', subjectId: 's-1', teacherId: 't-1', hoursWeekly: 4 });
      expect(result.id).toBe('cs-1');
    });

    it('remove throws when missing', async () => {
      prisma.courseSubject.findUnique.mockResolvedValue(null);
      await expect(service.removeSubjectFromCourse('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== SCHEDULES ====================
  describe('Schedules', () => {
    it('findAll', async () => {
      prisma.schedule.findMany.mockResolvedValue([{ id: 'sch-1' }]);
      const result = await service.findSchedules('c-1');
      expect(result).toHaveLength(1);
    });

    it('create', async () => {
      prisma.course.findUnique.mockResolvedValue({ id: 'c-1', schoolYearId: 'sy-1' });
      prisma.schedule.create.mockResolvedValue({ id: 'sch-1' });
      const result = await service.createSchedule({ courseId: 'c-1', dayOfWeek: 1, startTime: '08:00', endTime: '09:00' });
      expect(result.id).toBe('sch-1');
    });

    it('delete throws when missing', async () => {
      prisma.schedule.findUnique.mockResolvedValue(null);
      await expect(service.deleteSchedule('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
