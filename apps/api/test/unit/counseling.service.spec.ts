import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CounselingService } from '../../src/modules/counseling/counseling.service';
import { PrismaService } from '@sigrade/shared-prisma';
import { RiskType, RiskSeverity, AlertStatus, CounselingType, CaseStatus } from '@prisma/client';

const mockPrisma = {
  student: {
    findFirst: jest.fn(),
  },
  user: {
    findFirst: jest.fn(),
  },
  riskAlert: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  counselingCase: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  counselingNote: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  intervention: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('CounselingService', () => {
  let service: CounselingService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CounselingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CounselingService>(CounselingService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('getRiskAlerts', () => {
    it('should return paginated risk alerts', async () => {
      const alerts = [{ id: 'alert-1', studentId: 's-1', type: RiskType.ACADEMIC_FAILURE, severity: RiskSeverity.HIGH, status: AlertStatus.PENDING, createdAt: new Date(), student: { id: 's-1', studentCode: 'STU001', firstName: 'Juan', lastName: 'Perez' }, assignedTo: null }];
      prisma.riskAlert.findMany.mockResolvedValue(alerts);
      prisma.riskAlert.count.mockResolvedValue(1);

      const result = await service.getRiskAlerts({ page: 1, limit: 20 }, 'tenant-1');

      expect(prisma.riskAlert.findMany).toHaveBeenCalledWith({
        where: { student: { tenantId: 'tenant-1' } },
        skip: 0, take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          student: { select: { id: true, studentCode: true, firstName: true, lastName: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });
      expect(result).toEqual({ data: alerts, meta: { total: 1, page: 1, limit: 20, totalPages: 1 } });
    });

    it('should apply filters when provided', async () => {
      prisma.riskAlert.findMany.mockResolvedValue([]);
      prisma.riskAlert.count.mockResolvedValue(0);

      await service.getRiskAlerts({ page: 1, limit: 10, studentId: 's-1', type: RiskType.ACADEMIC_FAILURE, severity: RiskSeverity.HIGH, status: AlertStatus.PENDING, assignedToId: 'u-1' }, 'tenant-1');

      expect(prisma.riskAlert.findMany).toHaveBeenCalledWith({
        where: {
          student: { tenantId: 'tenant-1' },
          studentId: 's-1',
          type: RiskType.ACADEMIC_FAILURE,
          severity: RiskSeverity.HIGH,
          status: AlertStatus.PENDING,
          assignedToId: 'u-1',
        },
        skip: 0, take: 10,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });
  });

  describe('getRiskDashboard', () => {
    it('should return dashboard stats', async () => {
      const now = new Date();
      const recent = new Date(now.getTime() - 2 * 86400000);
      const old = new Date(now.getTime() - 10 * 86400000);
      const alerts = [
        { status: AlertStatus.PENDING, type: RiskType.ACADEMIC_FAILURE, severity: RiskSeverity.HIGH, createdAt: recent },
        { status: AlertStatus.IN_REVIEW, type: RiskType.BEHAVIORAL, severity: RiskSeverity.MEDIUM, createdAt: recent },
        { status: AlertStatus.RESOLVED, type: RiskType.ACADEMIC_FAILURE, severity: RiskSeverity.LOW, createdAt: old },
      ];
      prisma.riskAlert.findMany.mockResolvedValue(alerts);
      prisma.riskAlert.count.mockResolvedValue(1);
      prisma.riskAlert.groupBy.mockResolvedValueOnce([{ type: RiskType.ACADEMIC_FAILURE, _count: 2 }, { type: RiskType.BEHAVIORAL, _count: 1 }]);
      prisma.riskAlert.groupBy.mockResolvedValueOnce([{ severity: RiskSeverity.HIGH, _count: 1 }, { severity: RiskSeverity.MEDIUM, _count: 1 }, { severity: RiskSeverity.LOW, _count: 1 }]);

      const result = await service.getRiskDashboard('tenant-1');

      expect(result.totalAlerts).toBe(3);
      expect(result.pendingAlerts).toBe(1);
      expect(result.inReview).toBe(1);
      expect(result.resolvedCount).toBe(1);
      expect(result.recentAlerts).toBe(2);
    });
  });

  describe('getRiskAlertById', () => {
    it('should return alert when found', async () => {
      const alert = { id: 'alert-1', studentId: 's-1', student: { id: 's-1', studentCode: 'STU001', firstName: 'Juan', lastName: 'Perez' }, assignedTo: null };
      prisma.riskAlert.findFirst.mockResolvedValue(alert);

      const result = await service.getRiskAlertById('alert-1', 'tenant-1');

      expect(result).toEqual(alert);
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.riskAlert.findFirst.mockResolvedValue(null);

      await expect(service.getRiskAlertById('nonexistent', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createRiskAlert', () => {
    it('should create a risk alert', async () => {
      prisma.student.findFirst.mockResolvedValue({ id: 's-1' });
      const created = { id: 'alert-1', studentId: 's-1', type: RiskType.ACADEMIC_FAILURE, severity: RiskSeverity.HIGH, title: 'Test Alert', description: '', indicators: {}, assignedToId: null, aiGenerated: false, student: { id: 's-1', studentCode: 'STU001', firstName: 'Juan', lastName: 'Perez' }, assignedTo: null };
      prisma.riskAlert.create.mockResolvedValue(created);

      const result = await service.createRiskAlert({ studentId: 's-1', type: RiskType.ACADEMIC_FAILURE, severity: RiskSeverity.HIGH, title: 'Test Alert', description: 'Desc', indicators: [], assignedToId: undefined }, 'tenant-1');

      expect(prisma.student.findFirst).toHaveBeenCalledWith({ where: { id: 's-1', tenantId: 'tenant-1' } });
      expect(result).toEqual(created);
    });

    it('should throw NotFoundException when student not found in tenant', async () => {
      prisma.student.findFirst.mockResolvedValue(null);

      await expect(service.createRiskAlert({ studentId: 's-1', type: RiskType.ACADEMIC_FAILURE, severity: RiskSeverity.HIGH, title: 'Test' }, 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateRiskAlert', () => {
    it('should update alert fields', async () => {
      prisma.riskAlert.findFirst.mockResolvedValue({ id: 'alert-1', studentId: 's-1' });
      const updated = { id: 'alert-1', severity: RiskSeverity.CRITICAL, status: AlertStatus.IN_REVIEW, student: { id: 's-1', studentCode: 'STU001', firstName: 'Juan', lastName: 'Perez' }, assignedTo: null };
      prisma.riskAlert.update.mockResolvedValue(updated);

      const result = await service.updateRiskAlert('alert-1', { severity: RiskSeverity.CRITICAL, status: AlertStatus.IN_REVIEW }, 'tenant-1');

      expect(result).toEqual(updated);
    });

    it('should set resolvedAt when status is RESOLVED', async () => {
      prisma.riskAlert.findFirst.mockResolvedValue({ id: 'alert-1', studentId: 's-1' });
      prisma.riskAlert.update.mockResolvedValue({ id: 'alert-1', status: AlertStatus.RESOLVED, student: { id: 's-1', studentCode: 'STU001', firstName: 'Juan', lastName: 'Perez' }, assignedTo: null });

      await service.updateRiskAlert('alert-1', { status: AlertStatus.RESOLVED }, 'tenant-1');

      expect(prisma.riskAlert.update).toHaveBeenCalledWith({
        where: { id: 'alert-1' },
        data: expect.objectContaining({ status: AlertStatus.RESOLVED, resolvedAt: expect.any(Date) }),
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when alert not found', async () => {
      prisma.riskAlert.findFirst.mockResolvedValue(null);

      await expect(service.updateRiskAlert('nonexistent', { severity: RiskSeverity.HIGH }, 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteRiskAlert', () => {
    it('should delete alert', async () => {
      prisma.riskAlert.findFirst.mockResolvedValue({ id: 'alert-1', studentId: 's-1' });
      prisma.riskAlert.delete.mockResolvedValue({ id: 'alert-1' });

      const result = await service.deleteRiskAlert('alert-1', 'tenant-1');

      expect(result).toEqual({ message: 'Alerta eliminada correctamente' });
    });

    it('should throw NotFoundException when alert not found', async () => {
      prisma.riskAlert.findFirst.mockResolvedValue(null);

      await expect(service.deleteRiskAlert('nonexistent', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCases', () => {
    it('should return paginated cases', async () => {
      const cases = [{ id: 'case-1', studentId: 's-1', counselorId: 'u-1', type: CounselingType.ACADEMIC_SUPPORT, status: CaseStatus.OPEN, openedAt: new Date(), student: { id: 's-1', studentCode: 'STU001', firstName: 'Juan', lastName: 'Perez' }, counselor: { id: 'u-1', firstName: 'Ana', lastName: 'Lopez', email: 'ana@test.com' }, _count: { notes: 0, interventions: 0 } }];
      prisma.counselingCase.findMany.mockResolvedValue(cases);
      prisma.counselingCase.count.mockResolvedValue(1);

      const result = await service.getCases({ page: 1, limit: 20 }, 'tenant-1');

      expect(result).toEqual({ data: cases, meta: { total: 1, page: 1, limit: 20, totalPages: 1 } });
    });

    it('should apply filters', async () => {
      prisma.counselingCase.findMany.mockResolvedValue([]);
      prisma.counselingCase.count.mockResolvedValue(0);

      await service.getCases({ studentId: 's-1', counselorId: 'u-1', type: CounselingType.ACADEMIC_SUPPORT, status: CaseStatus.OPEN }, 'tenant-1');

      expect(prisma.counselingCase.findMany).toHaveBeenCalledWith({
        where: { student: { tenantId: 'tenant-1' }, studentId: 's-1', counselorId: 'u-1', type: CounselingType.ACADEMIC_SUPPORT, status: CaseStatus.OPEN },
        skip: 0, take: 20, orderBy: { openedAt: 'desc' }, include: expect.any(Object),
      });
    });
  });

  describe('getCaseById', () => {
    it('should return case with notes and interventions', async () => {
      const counselingCase = { id: 'case-1', student: { id: 's-1' }, counselor: { id: 'u-1' }, notes: [], interventions: [] };
      prisma.counselingCase.findFirst.mockResolvedValue(counselingCase);

      const result = await service.getCaseById('case-1', 'tenant-1');

      expect(result).toEqual(counselingCase);
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.counselingCase.findFirst.mockResolvedValue(null);

      await expect(service.getCaseById('nonexistent', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createCase', () => {
    it('should create a counseling case', async () => {
      prisma.student.findFirst.mockResolvedValue({ id: 's-1' });
      prisma.user.findFirst.mockResolvedValue({ id: 'u-1' });
      const created = { id: 'case-1', studentId: 's-1', counselorId: 'u-1', type: CounselingType.ACADEMIC_SUPPORT, student: { id: 's-1', studentCode: 'STU001', firstName: 'Juan', lastName: 'Perez' }, counselor: { id: 'u-1', firstName: 'Ana', lastName: 'Lopez' } };
      prisma.counselingCase.create.mockResolvedValue(created);

      const result = await service.createCase({ studentId: 's-1', counselorId: 'u-1', type: CounselingType.ACADEMIC_SUPPORT }, 'tenant-1');

      expect(result).toEqual(created);
    });

    it('should throw NotFoundException when student not found', async () => {
      prisma.student.findFirst.mockResolvedValue(null);

      await expect(service.createCase({ studentId: 's-1', counselorId: 'u-1', type: CounselingType.ACADEMIC_SUPPORT }, 'tenant-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when counselor not found', async () => {
      prisma.student.findFirst.mockResolvedValue({ id: 's-1' });
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.createCase({ studentId: 's-1', counselorId: 'u-1', type: CounselingType.ACADEMIC_SUPPORT }, 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateCase', () => {
    it('should update case fields', async () => {
      prisma.counselingCase.findFirst.mockResolvedValue({ id: 'case-1', studentId: 's-1' });
      const updated = { id: 'case-1', status: CaseStatus.IN_PROGRESS, student: { id: 's-1', studentCode: 'STU001', firstName: 'Juan', lastName: 'Perez' }, counselor: { id: 'u-1', firstName: 'Ana', lastName: 'Lopez' } };
      prisma.counselingCase.update.mockResolvedValue(updated);

      const result = await service.updateCase('case-1', { status: CaseStatus.IN_PROGRESS }, 'tenant-1');

      expect(result).toEqual(updated);
    });

    it('should set closedAt when status is CLOSED', async () => {
      prisma.counselingCase.findFirst.mockResolvedValue({ id: 'case-1', studentId: 's-1' });
      prisma.counselingCase.update.mockResolvedValue({ id: 'case-1', status: CaseStatus.CLOSED, student: { id: 's-1', studentCode: 'STU001', firstName: 'Juan', lastName: 'Perez' }, counselor: { id: 'u-1', firstName: 'Ana', lastName: 'Lopez' } });

      await service.updateCase('case-1', { status: CaseStatus.CLOSED }, 'tenant-1');

      expect(prisma.counselingCase.update).toHaveBeenCalledWith({
        where: { id: 'case-1' },
        data: expect.objectContaining({ status: CaseStatus.CLOSED, closedAt: expect.any(Date) }),
        include: expect.any(Object),
      });
    });
  });

  describe('deleteCase', () => {
    it('should delete case', async () => {
      prisma.counselingCase.findFirst.mockResolvedValue({ id: 'case-1', studentId: 's-1' });
      prisma.counselingCase.delete.mockResolvedValue({ id: 'case-1' });

      const result = await service.deleteCase('case-1', 'tenant-1');

      expect(result).toEqual({ message: 'Caso eliminado correctamente' });
    });
  });

  describe('createNote', () => {
    it('should create a note on a case', async () => {
      prisma.counselingCase.findFirst.mockResolvedValue({ id: 'case-1', studentId: 's-1' });
      const note = { id: 'note-1', caseId: 'case-1', authorId: 'u-1', content: 'Nota de prueba', isPrivate: false, author: { id: 'u-1', firstName: 'Ana', lastName: 'Lopez' } };
      prisma.counselingNote.create.mockResolvedValue(note);

      const result = await service.createNote({ caseId: 'case-1', content: 'Nota de prueba', isPrivate: false }, 'u-1', 'tenant-1');

      expect(result).toEqual(note);
    });

    it('should throw NotFoundException when case not found', async () => {
      prisma.counselingCase.findFirst.mockResolvedValue(null);

      await expect(service.createNote({ caseId: 'nonexistent', content: 'Test' }, 'u-1', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getNotes', () => {
    it('should return notes for a case', async () => {
      prisma.counselingCase.findFirst.mockResolvedValue({ id: 'case-1', studentId: 's-1' });
      const notes = [{ id: 'note-1', caseId: 'case-1', authorId: 'u-1', content: 'Nota', createdAt: new Date(), author: { id: 'u-1', firstName: 'Ana', lastName: 'Lopez' } }];
      prisma.counselingNote.findMany.mockResolvedValue(notes);

      const result = await service.getNotes('case-1', 'tenant-1');

      expect(result).toEqual(notes);
    });

    it('should throw NotFoundException when case not found', async () => {
      prisma.counselingCase.findFirst.mockResolvedValue(null);

      await expect(service.getNotes('nonexistent', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createIntervention', () => {
    it('should create an intervention', async () => {
      prisma.counselingCase.findFirst.mockResolvedValue({ id: 'case-1', studentId: 's-1' });
      const intervention = { id: 'int-1', caseId: 'case-1', type: 'TUTORING', description: 'Tutoria', startDate: new Date('2024-09-01'), endDate: null, responsibleId: 'u-1', responsible: { id: 'u-1', firstName: 'Ana', lastName: 'Lopez' } };
      prisma.intervention.create.mockResolvedValue(intervention);

      const result = await service.createIntervention({ caseId: 'case-1', type: 'TUTORING', description: 'Tutoria', startDate: '2024-09-01', endDate: undefined, responsibleId: 'u-1' }, 'tenant-1');

      expect(result).toEqual(intervention);
    });
  });

  describe('getInterventions', () => {
    it('should return interventions for a case', async () => {
      prisma.counselingCase.findFirst.mockResolvedValue({ id: 'case-1', studentId: 's-1' });
      const interventions = [{ id: 'int-1', caseId: 'case-1', type: 'TUTORING', startDate: new Date(), responsible: { id: 'u-1', firstName: 'Ana', lastName: 'Lopez' } }];
      prisma.intervention.findMany.mockResolvedValue(interventions);

      const result = await service.getInterventions('case-1', 'tenant-1');

      expect(result).toEqual(interventions);
    });
  });

  describe('getStats', () => {
    it('should return counseling statistics', async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 10 * 86400000);
      prisma.riskAlert.findMany.mockResolvedValue([
        { status: AlertStatus.PENDING, type: RiskType.ACADEMIC_FAILURE, severity: RiskSeverity.HIGH },
        { status: AlertStatus.RESOLVED, type: RiskType.BEHAVIORAL, severity: RiskSeverity.LOW },
      ]);
      prisma.counselingCase.findMany.mockResolvedValue([
        { status: CaseStatus.OPEN, type: CounselingType.ACADEMIC_SUPPORT },
        { status: CaseStatus.CLOSED, type: CounselingType.BEHAVIORAL },
      ]);
      prisma.intervention.findMany.mockResolvedValue([
        { id: 'int-1', startDate: past, endDate: null },
        { id: 'int-2', startDate: past, endDate: past },
      ]);

      const result = await service.getStats('tenant-1');

      expect(result.totalAlerts).toBe(2);
      expect(result.totalCases).toBe(2);
      expect(result.totalInterventions).toBe(2);
      expect(result.activeInterventions).toBe(1);
      expect(result.criticalCases).toBe(1);
    });
  });
});
