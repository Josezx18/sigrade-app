import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PlanningService } from '../../src/modules/planning/planning.service';
import { PrismaService } from '@sigrade/shared-prisma';
import { PlanningStatus } from '@prisma/client';

const mockPrisma = {
  teacher: { findUnique: jest.fn() },
  courseSubject: { findUnique: jest.fn() },
  academicPeriod: { findUnique: jest.fn() },
  planning: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  planningSession: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  evidenceFile: { findUnique: jest.fn(), create: jest.fn() },
};

const rawPlanning = {
  id: 'plan-1',
  teacherId: 't-1',
  courseSubjectId: 'cs-1',
  periodId: 'p-1',
  unitNumber: 1,
  unitTitle: 'Unidad 1',
  competencies: ['C1'],
  objectives: ['O1'],
  content: 'Contenido',
  methodology: 'Metodologia',
  resources: ['R1'],
  assessment: 'Evaluacion',
  startDate: new Date('2024-09-01'),
  endDate: new Date('2024-09-30'),
  status: PlanningStatus.DRAFT,
  aiGenerated: false,
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  teacher: { id: 't-1', user: { id: 'u-1', firstName: 'Juan', lastName: 'Perez' } },
  courseSubject: {
    id: 'cs-1',
    courseId: 'course-1',
    subjectId: 'subj-1',
    course: { id: 'course-1', name: '1ro A', gradeLevel: { id: 'gl-1', name: '1er Grado' } },
    subject: { id: 'subj-1', code: 'MATH', name: 'Matematicas' },
    teacher: { id: 't-1', user: { id: 'u-1', firstName: 'Juan', lastName: 'Perez' } },
  },
  period: { id: 'p-1', name: 'Periodo 1', schoolYear: { id: 'sy-1', name: '2024-2025' } },
  sessions: [],
};

const rawSession = {
  id: 'sess-1',
  planningId: 'plan-1',
  sessionNumber: 1,
  date: new Date('2024-09-02'),
  topic: 'Intro',
  activities: { type: 'lecture' },
  homework: null,
  executed: false,
  executedAt: null,
  observations: null,
  planning: {
    courseSubject: { subject: { name: 'Mat' }, course: { name: '1ro' } },
  },
  evidenceFiles: [],
};

describe('PlanningService', () => {
  let service: PlanningService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanningService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PlanningService>(PlanningService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated plannings', async () => {
      prisma.planning.findMany.mockResolvedValue([rawPlanning]);
      prisma.planning.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total', 1);
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('limit', 20);
      expect(result).toHaveProperty('totalPages', 1);
      expect(result.data[0]).toHaveProperty('id', 'plan-1');
      expect(result.data[0]).toHaveProperty('title', 'Unidad 1');
      expect(result.data[0]).toHaveProperty('status', PlanningStatus.DRAFT);
    });

    it('should apply filters', async () => {
      prisma.planning.findMany.mockResolvedValue([]);
      prisma.planning.count.mockResolvedValue(0);

      await service.findAll({ teacherId: 't-1', courseSubjectId: 'cs-1', periodId: 'p-1', status: PlanningStatus.DRAFT });

      expect(prisma.planning.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { teacherId: 't-1', courseSubjectId: 'cs-1', periodId: 'p-1', status: PlanningStatus.DRAFT },
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return planning when found', async () => {
      prisma.planning.findUnique.mockResolvedValue(rawPlanning);

      const result = await service.findById('plan-1');

      expect(result).toHaveProperty('id', 'plan-1');
      expect(result).toHaveProperty('title', 'Unidad 1');
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.planning.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      teacherId: 't-1',
      courseSubjectId: 'cs-1',
      periodId: 'p-1',
      unitNumber: 1,
      unitTitle: 'Unidad 1',
      competencies: ['C1'],
      objectives: ['O1'],
      content: 'Contenido',
      methodology: 'Metodologia',
      resources: ['R1'],
      assessment: 'Evaluacion',
      startDate: '2024-09-01',
      endDate: '2024-09-30',
    };

    it('should create a planning', async () => {
      prisma.teacher.findUnique.mockResolvedValue({ id: 't-1' });
      prisma.courseSubject.findUnique.mockResolvedValue({ id: 'cs-1', teacherId: 't-1' });
      prisma.academicPeriod.findUnique.mockResolvedValue({ id: 'p-1' });
      prisma.planning.findFirst.mockResolvedValue(null);
      prisma.planning.create.mockResolvedValue({ id: 'plan-1' });
      prisma.planning.findUnique.mockResolvedValue(rawPlanning);

      const result = await service.create(createDto);

      expect(prisma.planning.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          teacherId: 't-1',
          courseSubjectId: 'cs-1',
          periodId: 'p-1',
          unitNumber: 1,
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        }),
      });
      expect(result).toBeDefined();
      expect(result.id).toBe('plan-1');
    });

    it('should throw NotFoundException when teacher not found', async () => {
      prisma.teacher.findUnique.mockResolvedValue(null);
      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when courseSubject not found', async () => {
      prisma.teacher.findUnique.mockResolvedValue({ id: 't-1' });
      prisma.courseSubject.findUnique.mockResolvedValue(null);
      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when teacher not assigned', async () => {
      prisma.teacher.findUnique.mockResolvedValue({ id: 't-1' });
      prisma.courseSubject.findUnique.mockResolvedValue({ id: 'cs-1', teacherId: 'other' });
      await expect(service.create(createDto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when duplicate exists', async () => {
      prisma.teacher.findUnique.mockResolvedValue({ id: 't-1' });
      prisma.courseSubject.findUnique.mockResolvedValue({ id: 'cs-1', teacherId: 't-1' });
      prisma.academicPeriod.findUnique.mockResolvedValue({ id: 'p-1' });
      prisma.planning.findFirst.mockResolvedValue({ id: 'existing' });
      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update planning fields', async () => {
      prisma.planning.findUnique
        .mockResolvedValueOnce({ id: 'plan-1', status: PlanningStatus.DRAFT })
        .mockResolvedValueOnce(rawPlanning);
      prisma.planning.update.mockResolvedValue({ id: 'plan-1' });

      const result = await service.update('plan-1', { unitTitle: 'Updated' });

      expect(prisma.planning.update).toHaveBeenCalledWith({
        where: { id: 'plan-1' },
        data: { unitTitle: 'Updated' },
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.planning.findUnique.mockResolvedValue(null);
      await expect(service.update('nonexistent', { unitTitle: 'Updated' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete planning', async () => {
      prisma.planning.findUnique.mockResolvedValue(rawPlanning);
      prisma.planning.delete.mockResolvedValue({ id: 'plan-1' });

      const result = await service.delete('plan-1');

      expect(result).toEqual({ message: 'Planificación eliminada correctamente' });
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.planning.findUnique.mockResolvedValue(null);
      await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('submitForApproval', () => {
    it('should change status to SUBMITTED', async () => {
      prisma.planning.findUnique
        .mockResolvedValueOnce({ id: 'plan-1', status: PlanningStatus.DRAFT })
        .mockResolvedValueOnce(rawPlanning);
      prisma.planning.update.mockResolvedValue({ id: 'plan-1' });

      const result = await service.submitForApproval('plan-1');

      expect(prisma.planning.update).toHaveBeenCalledWith({
        where: { id: 'plan-1' },
        data: { status: PlanningStatus.SUBMITTED },
      });
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException when not in DRAFT', async () => {
      prisma.planning.findUnique.mockResolvedValue({ id: 'plan-1', status: PlanningStatus.SUBMITTED });
      await expect(service.submitForApproval('plan-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('approveOrReject', () => {
    it('should change status to APPROVED', async () => {
      prisma.planning.findUnique
        .mockResolvedValueOnce({ id: 'plan-1', status: PlanningStatus.SUBMITTED })
        .mockResolvedValueOnce(rawPlanning);
      prisma.planning.update.mockResolvedValue({ id: 'plan-1' });

      const result = await service.approveOrReject('plan-1', 'APPROVED');

      expect(prisma.planning.update).toHaveBeenCalledWith({
        where: { id: 'plan-1' },
        data: { status: 'APPROVED' },
      });
      expect(result).toBeDefined();
    });

    it('should change status to REJECTED', async () => {
      prisma.planning.findUnique
        .mockResolvedValueOnce({ id: 'plan-1', status: PlanningStatus.SUBMITTED })
        .mockResolvedValueOnce(rawPlanning);
      prisma.planning.update.mockResolvedValue({ id: 'plan-1' });

      const result = await service.approveOrReject('plan-1', 'REJECTED');

      expect(prisma.planning.update).toHaveBeenCalledWith({
        where: { id: 'plan-1' },
        data: { status: 'REJECTED' },
      });
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException when not SUBMITTED', async () => {
      prisma.planning.findUnique.mockResolvedValue({ id: 'plan-1', status: PlanningStatus.DRAFT });
      await expect(service.approveOrReject('plan-1', 'APPROVED')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.planning.findUnique.mockResolvedValue(null);
      await expect(service.approveOrReject('nonexistent', 'APPROVED')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSessions', () => {
    it('should return paginated sessions', async () => {
      prisma.planningSession.findMany.mockResolvedValue([rawSession]);
      prisma.planningSession.count.mockResolvedValue(1);

      const result = await service.getSessions({ page: 1, limit: 20, planningId: 'plan-1' });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total', 1);
      expect(result.data[0]).toHaveProperty('id', 'sess-1');
      expect(result.data[0]).toHaveProperty('status', 'PENDING');
    });
  });

  describe('getSessionById', () => {
    it('should return session when found', async () => {
      prisma.planningSession.findUnique.mockResolvedValue(rawSession);

      const result = await service.getSessionById('sess-1');

      expect(result).toHaveProperty('id', 'sess-1');
      expect(result).toHaveProperty('status', 'PENDING');
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.planningSession.findUnique.mockResolvedValue(null);
      await expect(service.getSessionById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createSession', () => {
    it('should create a session', async () => {
      prisma.planning.findUnique.mockResolvedValue({ id: 'plan-1' });
      prisma.planningSession.findFirst.mockResolvedValue(null);
      prisma.planningSession.create.mockResolvedValue({ id: 'sess-1' });
      prisma.planningSession.findUnique.mockResolvedValue(rawSession);

      const result = await service.createSession({
        planningId: 'plan-1',
        sessionNumber: 1,
        date: '2024-09-02T08:00:00Z',
        topic: 'Intro',
        activities: {},
      });

      expect(prisma.planningSession.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw ConflictException when duplicate number', async () => {
      prisma.planning.findUnique.mockResolvedValue({ id: 'plan-1' });
      prisma.planningSession.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(
        service.createSession({
          planningId: 'plan-1', sessionNumber: 1, date: '2024-09-02T08:00:00Z', topic: 'Intro', activities: {},
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateSession', () => {
    it('should update session', async () => {
      prisma.planningSession.findUnique
        .mockResolvedValueOnce({ id: 'sess-1' })
        .mockResolvedValueOnce(rawSession);
      prisma.planningSession.update.mockResolvedValue({ id: 'sess-1' });

      const result = await service.updateSession('sess-1', { topic: 'Updated' });

      expect(result).toBeDefined();
    });
  });

  describe('executeSession', () => {
    it('should mark session as executed', async () => {
      prisma.planningSession.findUnique
        .mockResolvedValueOnce({ id: 'sess-1', executed: false })
        .mockResolvedValueOnce(rawSession);
      prisma.planningSession.update.mockResolvedValue({ id: 'sess-1' });

      const result = await service.executeSession({ sessionId: 'sess-1', observations: 'Bien' });

      expect(prisma.planningSession.update).toHaveBeenCalledWith({
        where: { id: 'sess-1' },
        data: expect.objectContaining({ executed: true, observations: 'Bien' }),
      });
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException when already executed', async () => {
      prisma.planningSession.findUnique.mockResolvedValue({ id: 'sess-1', executed: true });
      await expect(service.executeSession({ sessionId: 'sess-1' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteSession', () => {
    it('should delete session', async () => {
      prisma.planningSession.findUnique.mockResolvedValue({ id: 'sess-1' });
      prisma.planningSession.delete.mockResolvedValue({ id: 'sess-1' });

      const result = await service.deleteSession('sess-1');
      expect(result).toEqual({ message: 'Sesión eliminada correctamente' });
    });
  });

  describe('addEvidenceToSession', () => {
    it('should create evidence file', async () => {
      prisma.planningSession.findUnique.mockResolvedValue({ id: 'sess-1' });
      prisma.evidenceFile.findUnique.mockResolvedValue({ id: 'file-uuid' });
      prisma.evidenceFile.create.mockResolvedValue({ id: 'file-1', sessionId: 'sess-1' });

      const result = await service.addEvidenceToSession('sess-1', 'file-uuid', 'u-1');

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when session not found', async () => {
      prisma.planningSession.findUnique.mockResolvedValue(null);
      await expect(service.addEvidenceToSession('nonexistent', 'f-1', 'u-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('aiAssistPlanning', () => {
    it('should return AI suggestions', async () => {
      const result = await service.aiAssistPlanning({ planningId: 'plan-1', prompt: 'Generate fractions unit' });

      expect(result).toBeDefined();
      expect(result.planningId).toBe('plan-1');
      expect(result.suggestedPlanning).toBeDefined();
      expect(result.confidence).toBe(0.85);
    });
  });

  describe('getPlanningStats', () => {
    it('should return planning statistics', async () => {
      prisma.planning.findMany.mockResolvedValue([
        { status: PlanningStatus.DRAFT, aiGenerated: false },
        { status: PlanningStatus.APPROVED, aiGenerated: true },
      ]);
      prisma.planningSession.findMany.mockResolvedValue([
        { executed: true },
        { executed: false },
        { executed: true },
      ]);

      const result = await service.getPlanningStats('t-1', 'p-1');

      expect(result.totalPlannings).toBe(2);
      expect(result.byStatus.DRAFT).toBe(1);
      expect(result.byStatus.APPROVED).toBe(1);
      expect(result.aiGenerated).toBe(1);
      expect(result.totalSessions).toBe(3);
      expect(result.executedSessions).toBe(2);
      expect(result.executionRate).toBe(66.67);
    });

    it('should return 0 execution rate when no sessions', async () => {
      prisma.planning.findMany.mockResolvedValue([]);
      prisma.planningSession.findMany.mockResolvedValue([]);

      const result = await service.getPlanningStats();

      expect(result.totalPlannings).toBe(0);
      expect(result.executionRate).toBe(0);
    });
  });
});
