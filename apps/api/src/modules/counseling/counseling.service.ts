import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@sigrade/shared-prisma';
import { Prisma, RiskType, RiskSeverity, AlertStatus, CounselingType, CaseStatus } from '@prisma/client';
import {
  CreateRiskAlertDto, UpdateRiskAlertDto, CreateCounselingCaseDto, UpdateCounselingCaseDto,
  CreateCounselingNoteDto, CreateInterventionDto, RiskAlertQueryDto, CounselingCaseQueryDto,
} from './dto/counseling.dto';

@Injectable()
export class CounselingService {
  constructor(private prisma: PrismaService) {}

  // ==================== RISK ALERTS ====================

  async getRiskAlerts(filters: RiskAlertQueryDto, tenantId: string) {
    const { page = 1, limit = 20, ...rest } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.RiskAlertWhereInput = { student: { tenantId } };
    if (rest.studentId) where.studentId = rest.studentId;
    if (rest.type) where.type = rest.type;
    if (rest.severity) where.severity = rest.severity;
    if (rest.status) where.status = rest.status;
    if (rest.assignedToId) where.assignedToId = rest.assignedToId;

    const [alerts, total] = await Promise.all([
      this.prisma.riskAlert.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: { select: { id: true, studentCode: true, firstName: true, lastName: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.riskAlert.count({ where }),
    ]);

    return { data: alerts, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getRiskDashboard(tenantId: string) {
    const where: Prisma.RiskAlertWhereInput = { student: { tenantId } };

    const [alerts, resolvedCount, byType, bySeverity] = await Promise.all([
      this.prisma.riskAlert.findMany({ where, select: { status: true, type: true, severity: true, createdAt: true } }),
      this.prisma.riskAlert.count({ where: { ...where, status: AlertStatus.RESOLVED } }),
      this.prisma.riskAlert.groupBy({ by: ['type'], where, _count: true }),
      this.prisma.riskAlert.groupBy({ by: ['severity'], where, _count: true }),
    ]);

    const pendingAlerts = alerts.filter(a => a.status === AlertStatus.PENDING).length;
    const inReview = alerts.filter(a => a.status === AlertStatus.IN_REVIEW).length;

    return {
      totalAlerts: alerts.length,
      pendingAlerts, inReview, resolvedCount,
      alertsByType: byType.reduce((acc, t) => ({ ...acc, [t.type]: t._count }), {} as Record<RiskType, number>),
      alertsBySeverity: bySeverity.reduce((acc, s) => ({ ...acc, [s.severity]: s._count }), {} as Record<RiskSeverity, number>),
      recentAlerts: alerts.filter(a => {
        const days = (Date.now() - a.createdAt.getTime()) / 86400000;
        return days <= 7;
      }).length,
    };
  }

  async getRiskAlertById(id: string, tenantId: string) {
    const alert = await this.prisma.riskAlert.findFirst({
      where: { id, student: { tenantId } },
      include: {
        student: { select: { id: true, studentCode: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    if (!alert) throw new NotFoundException('Alerta de riesgo no encontrada');
    return alert;
  }

  async createRiskAlert(dto: CreateRiskAlertDto, tenantId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, tenantId },
    });
    if (!student) throw new NotFoundException('Estudiante no encontrado en el tenant');

    return this.prisma.riskAlert.create({
      data: {
        studentId: dto.studentId,
        type: dto.type,
        severity: dto.severity,
        title: dto.title,
        description: dto.description ?? '',
        indicators: (dto.indicators ?? {}) as never,
        assignedToId: dto.assignedToId,
        aiGenerated: false,
      },
      include: {
        student: { select: { id: true, studentCode: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async updateRiskAlert(id: string, dto: UpdateRiskAlertDto, tenantId: string) {
    const alert = await this.prisma.riskAlert.findFirst({
      where: { id, student: { tenantId } },
    });
    if (!alert) throw new NotFoundException('Alerta de riesgo no encontrada');

    const data: Prisma.RiskAlertUpdateInput = {};
    if (dto.severity) data.severity = dto.severity;
    if (dto.status) data.status = dto.status;
    if (dto.assignedToId !== undefined) {
      data.assignedTo = dto.assignedToId ? { connect: { id: dto.assignedToId } } : { disconnect: true };
    }
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.status === AlertStatus.RESOLVED) {
      data.resolvedAt = new Date();
    }

    return this.prisma.riskAlert.update({
      where: { id },
      data,
      include: {
        student: { select: { id: true, studentCode: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async deleteRiskAlert(id: string, tenantId: string) {
    const alert = await this.prisma.riskAlert.findFirst({
      where: { id, student: { tenantId } },
    });
    if (!alert) throw new NotFoundException('Alerta de riesgo no encontrada');
    await this.prisma.riskAlert.delete({ where: { id } });
    return { message: 'Alerta eliminada correctamente' };
  }

  // ==================== COUNSELING CASES ====================

  async getCases(filters: CounselingCaseQueryDto, tenantId: string) {
    const { page = 1, limit = 20, ...rest } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.CounselingCaseWhereInput = { student: { tenantId } };
    if (rest.studentId) where.studentId = rest.studentId;
    if (rest.counselorId) where.counselorId = rest.counselorId;
    if (rest.type) where.type = rest.type;
    if (rest.status) where.status = rest.status;

    const [cases, total] = await Promise.all([
      this.prisma.counselingCase.findMany({
        where, skip, take: limit,
        orderBy: { openedAt: 'desc' },
        include: {
          student: { select: { id: true, studentCode: true, firstName: true, lastName: true } },
          counselor: { select: { id: true, firstName: true, lastName: true, email: true } },
          _count: { select: { notes: true, interventions: true } },
        },
      }),
      this.prisma.counselingCase.count({ where }),
    ]);

    return { data: cases, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getCaseById(id: string, tenantId: string) {
    const counselingCase = await this.prisma.counselingCase.findFirst({
      where: { id, student: { tenantId } },
      include: {
        student: { select: { id: true, studentCode: true, firstName: true, lastName: true } },
        counselor: { select: { id: true, firstName: true, lastName: true, email: true } },
        notes: {
          orderBy: { createdAt: 'desc' },
          include: { author: { select: { id: true, firstName: true, lastName: true } } },
        },
        interventions: {
          orderBy: { startDate: 'desc' },
          include: { responsible: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });
    if (!counselingCase) throw new NotFoundException('Caso de consejería no encontrado');
    return counselingCase;
  }

  async createCase(dto: CreateCounselingCaseDto, tenantId: string) {
    const [student, counselor] = await Promise.all([
      this.prisma.student.findFirst({ where: { id: dto.studentId, tenantId } }),
      this.prisma.user.findFirst({ where: { id: dto.counselorId, tenantId } }),
    ]);
    if (!student) throw new NotFoundException('Estudiante no encontrado');
    if (!counselor) throw new NotFoundException('Consejero no encontrado');

    return this.prisma.counselingCase.create({
      data: { studentId: dto.studentId, counselorId: dto.counselorId, type: dto.type },
      include: {
        student: { select: { id: true, studentCode: true, firstName: true, lastName: true } },
        counselor: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async updateCase(id: string, dto: UpdateCounselingCaseDto, tenantId: string) {
    const counselingCase = await this.prisma.counselingCase.findFirst({
      where: { id, student: { tenantId } },
    });
    if (!counselingCase) throw new NotFoundException('Caso de consejería no encontrado');

    const data: Prisma.CounselingCaseUpdateInput = {};
    if (dto.status) data.status = dto.status;
    if (dto.type) data.type = dto.type;
    if (dto.status === CaseStatus.CLOSED) data.closedAt = new Date();

    return this.prisma.counselingCase.update({
      where: { id },
      data,
      include: {
        student: { select: { id: true, studentCode: true, firstName: true, lastName: true } },
        counselor: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async deleteCase(id: string, tenantId: string) {
    const counselingCase = await this.prisma.counselingCase.findFirst({
      where: { id, student: { tenantId } },
    });
    if (!counselingCase) throw new NotFoundException('Caso de consejería no encontrado');
    await this.prisma.counselingCase.delete({ where: { id } });
    return { message: 'Caso eliminado correctamente' };
  }

  // ==================== NOTES ====================

  async createNote(dto: CreateCounselingNoteDto, authorId: string, tenantId: string) {
    const counselingCase = await this.prisma.counselingCase.findFirst({
      where: { id: dto.caseId, student: { tenantId } },
    });
    if (!counselingCase) throw new NotFoundException('Caso de consejería no encontrado');

    return this.prisma.counselingNote.create({
      data: { caseId: dto.caseId, authorId, content: dto.content, isPrivate: dto.isPrivate ?? false },
      include: { author: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async getNotes(caseId: string, tenantId: string) {
    const counselingCase = await this.prisma.counselingCase.findFirst({
      where: { id: caseId, student: { tenantId } },
    });
    if (!counselingCase) throw new NotFoundException('Caso de consejería no encontrado');

    return this.prisma.counselingNote.findMany({
      where: { caseId },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  // ==================== INTERVENTIONS ====================

  async createIntervention(dto: CreateInterventionDto, tenantId: string) {
    const counselingCase = await this.prisma.counselingCase.findFirst({
      where: { id: dto.caseId, student: { tenantId } },
    });
    if (!counselingCase) throw new NotFoundException('Caso de consejería no encontrado');

    return this.prisma.intervention.create({
      data: {
        caseId: dto.caseId,
        type: dto.type,
        description: dto.description,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        responsibleId: dto.responsibleId,
      },
      include: { responsible: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async getInterventions(caseId: string, tenantId: string) {
    const counselingCase = await this.prisma.counselingCase.findFirst({
      where: { id: caseId, student: { tenantId } },
    });
    if (!counselingCase) throw new NotFoundException('Caso de consejería no encontrado');

    return this.prisma.intervention.findMany({
      where: { caseId },
      orderBy: { startDate: 'desc' },
      include: { responsible: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async getStats(tenantId: string) {
    const alertsWhere: Prisma.RiskAlertWhereInput = { student: { tenantId } };
    const casesWhere: Prisma.CounselingCaseWhereInput = { student: { tenantId } };

    const [alerts, cases, interventions] = await Promise.all([
      this.prisma.riskAlert.findMany({ where: alertsWhere, select: { status: true, type: true, severity: true } }),
      this.prisma.counselingCase.findMany({ where: casesWhere, select: { status: true, type: true } }),
      this.prisma.intervention.findMany({
        where: { case: { student: { tenantId } } },
        select: { id: true, startDate: true, endDate: true },
      }),
    ]);

    const alertsByStatus = {} as Record<AlertStatus, number>;
    const alertsByType = {} as Record<RiskType, number>;
    const alertsBySeverity = {} as Record<RiskSeverity, number>;
    Object.values(AlertStatus).forEach(s => alertsByStatus[s] = 0);
    Object.values(RiskType).forEach(t => alertsByType[t] = 0);
    Object.values(RiskSeverity).forEach(s => alertsBySeverity[s] = 0);
    alerts.forEach(a => { alertsByStatus[a.status]++; alertsByType[a.type]++; alertsBySeverity[a.severity]++; });

    const casesByStatus = {} as Record<CaseStatus, number>;
    const casesByType = {} as Record<CounselingType, number>;
    Object.values(CaseStatus).forEach(s => casesByStatus[s] = 0);
    Object.values(CounselingType).forEach(t => casesByType[t] = 0);
    cases.forEach(c => { casesByStatus[c.status]++; casesByType[c.type]++; });

    const studentsAtRisk = new Set(alerts.filter(a => a.status !== AlertStatus.RESOLVED).map(a => a.status)).size;
    const criticalCases = cases.filter(c => c.status === CaseStatus.OPEN || c.status === CaseStatus.IN_PROGRESS).length;
    const activeInterventions = interventions.filter(i => !i.endDate || i.endDate > new Date()).length;

    return {
      totalAlerts: alerts.length, alertsByStatus, alertsByType, alertsBySeverity,
      totalCases: cases.length, casesByStatus, casesByType,
      totalInterventions: interventions.length, activeInterventions,
      studentsAtRisk, criticalCases,
    };
  }
}