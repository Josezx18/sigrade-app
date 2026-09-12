import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@sigrade/shared-prisma';
import { Prisma, PlanningStatus } from '@prisma/client';
import { CreatePlanningDto, UpdatePlanningDto, CreatePlanningSessionDto, UpdatePlanningSessionDto, ExecuteSessionDto, AiAssistPlanningDto, PlanningQueryDto, PlanningSessionQueryDto } from './dto/planning.dto';

@Injectable()
export class PlanningService {
  constructor(private prisma: PrismaService) {}

  private mapSession(s: Record<string, unknown>) {
    const activities = s.activities;
    return {
      id: s.id as string,
      planningId: s.planningId as string,
      sessionNumber: s.sessionNumber as number,
      date: s.date as Date,
      startTime: (s.date as Date)?.toISOString ? (s.date as Date).toISOString() : '',
      endTime: (s.date as Date)?.toISOString ? (s.date as Date).toISOString() : '',
      topic: s.topic as string | null,
      activities: typeof activities === 'object' ? JSON.stringify(activities) : ((activities as string) || ''),
      homework: s.homework as string | null,
      status: (s.executed as boolean) ? 'EXECUTED' : 'PENDING',
      executed: s.executed as boolean,
      executedAt: s.executedAt as Date | null,
      observations: s.observations as string | null,
      evidence: (s.evidenceFiles as Array<{ id: string; url: string; originalName: string }>)?.map((e) => ({ id: e.id, file: { url: e.url, name: e.originalName } })),
    };
  }

  private mapPlanning(p: Record<string, unknown>) {
    const teacher = p.teacher as { id: string; user?: { firstName?: string; lastName?: string } | null } | undefined;
    const courseSubject = p.courseSubject as {
      id: string;
      course?: { id?: string; name?: string; gradeLevel?: { id: string; name: string } | null } | null;
      subject?: { id?: string; code?: string; name?: string } | null;
    } | undefined;
    const period = p.period as { id: string; name: string; schoolYear?: { id: string; name: string } | null } | undefined;
    const sessions = p.sessions as Array<Record<string, unknown>> | undefined;
    return {
      id: p.id as string,
      teacherId: p.teacherId as string,
      teacher: teacher ? { id: teacher.id, user: { firstName: teacher.user?.firstName, lastName: teacher.user?.lastName } } : undefined,
      courseSubjectId: p.courseSubjectId as string,
      courseSubject: courseSubject ? {
        id: courseSubject.id,
        course: { id: courseSubject.course?.id, name: courseSubject.course?.name, gradeLevel: courseSubject.course?.gradeLevel },
        subject: { id: courseSubject.subject?.id, code: courseSubject.subject?.code, name: courseSubject.subject?.name },
      } : undefined,
      periodId: p.periodId as string,
      period: period ? { id: period.id, name: period.name, schoolYear: period.schoolYear } : undefined,
      unitNumber: p.unitNumber as number,
      title: p.unitTitle as string,
      unitTitle: p.unitTitle as string,
      description: p.content ? String(p.content).substring(0, 200) : '',
      competencies: p.competencies as unknown,
      objectives: Array.isArray(p.objectives) ? (p.objectives as string[]).join(', ') : p.objectives,
      content: p.content as unknown,
      methodology: p.methodology as string | null,
      resources: Array.isArray(p.resources) ? (p.resources as string[]).join(', ') : p.resources,
      assessment: p.assessment as string | null,
      startDate: p.startDate as Date,
      endDate: p.endDate as Date,
      status: p.status as string,
      aiGenerated: p.aiGenerated as boolean | null,
      totalSessions: sessions?.length || 0,
      sessions: sessions?.map((s) => this.mapSession(s)),
      createdAt: p.createdAt as Date,
      updatedAt: p.updatedAt as Date,
    };
  }

  private readonly planningInclude = {
    teacher: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
    courseSubject: {
      include: {
        course: { include: { gradeLevel: { select: { id: true, name: true } } } },
        subject: { select: { id: true, code: true, name: true } },
        teacher: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
      },
    },
    period: { include: { schoolYear: { select: { id: true, name: true } } } },
    sessions: { orderBy: { sessionNumber: 'asc' } },
  } as const;

  private readonly planningDetailInclude = {
    ...this.planningInclude,
    sessions: { orderBy: { sessionNumber: 'asc' }, include: { evidenceFiles: true } },
  } as const;

  async findAll(query: PlanningQueryDto) {
    const { page = 1, limit = 20, ...filters } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PlanningWhereInput = {};
    if (filters.teacherId) where.teacherId = filters.teacherId;
    if (filters.courseSubjectId) where.courseSubjectId = filters.courseSubjectId;
    if (filters.periodId) where.periodId = filters.periodId;
    if (filters.status) where.status = filters.status;

    const [plannings, total] = await Promise.all([
      this.prisma.planning.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: this.planningInclude,
      }),
      this.prisma.planning.count({ where }),
    ]);

    return {
      data: plannings.map((p) => this.mapPlanning(p)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const planning = await this.prisma.planning.findUnique({
      where: { id },
      include: this.planningDetailInclude,
    });

    if (!planning) throw new NotFoundException('Planificación no encontrada');
    return this.mapPlanning(planning);
  }

  async create(dto: CreatePlanningDto) {
    const [teacher, courseSubject, period] = await Promise.all([
      this.prisma.teacher.findUnique({ where: { id: dto.teacherId } }),
      this.prisma.courseSubject.findUnique({ where: { id: dto.courseSubjectId } }),
      this.prisma.academicPeriod.findUnique({ where: { id: dto.periodId } }),
    ]);

    if (!teacher) throw new NotFoundException('Docente no encontrado');
    if (!courseSubject) throw new NotFoundException('Asignatura del curso no encontrada');
    if (!period) throw new NotFoundException('Periodo no encontrado');

    if (courseSubject.teacherId !== dto.teacherId) {
      throw new ForbiddenException('El docente no está asignado a esta asignatura');
    }

    const existing = await this.prisma.planning.findFirst({
      where: { teacherId: dto.teacherId, courseSubjectId: dto.courseSubjectId, periodId: dto.periodId, unitNumber: dto.unitNumber },
    });
    if (existing) throw new BadRequestException('Ya existe una planificación para esta unidad en este periodo');

    const planning = await this.prisma.planning.create({
      data: {
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        competencies: dto.competencies,
        objectives: dto.objectives,
        resources: dto.resources,
      },
    });

    return this.findById(planning.id);
  }

  async update(id: string, dto: UpdatePlanningDto) {
    const planning = await this.prisma.planning.findUnique({ where: { id } });
    if (!planning) throw new NotFoundException('Planificación no encontrada');

    const data: Prisma.PlanningUpdateInput = {};
    if (dto.unitNumber) data.unitNumber = dto.unitNumber;
    if (dto.unitTitle) data.unitTitle = dto.unitTitle;
    if (dto.competencies) data.competencies = dto.competencies;
    if (dto.objectives) data.objectives = dto.objectives;
    if (dto.content) data.content = dto.content;
    if (dto.methodology) data.methodology = dto.methodology;
    if (dto.resources) data.resources = dto.resources;
    if (dto.assessment) data.assessment = dto.assessment;
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);
    if (dto.status) data.status = dto.status;

    const updated = await this.prisma.planning.update({ where: { id }, data });
    return this.findById(updated.id);
  }

  async delete(id: string) {
    const planning = await this.prisma.planning.findUnique({ where: { id } });
    if (!planning) throw new NotFoundException('Planificación no encontrada');
    await this.prisma.planning.delete({ where: { id } });
    return { message: 'Planificación eliminada correctamente' };
  }

  async submitForApproval(id: string) {
    const planning = await this.prisma.planning.findUnique({ where: { id } });
    if (!planning) throw new NotFoundException('Planificación no encontrada');
    if (planning.status !== PlanningStatus.DRAFT) throw new BadRequestException('Solo se pueden enviar planificaciones en borrador');

    const updated = await this.prisma.planning.update({ where: { id }, data: { status: PlanningStatus.SUBMITTED } });
    return this.findById(updated.id);
  }

  async approveOrReject(id: string, status: 'APPROVED' | 'REJECTED') {
    const planning = await this.prisma.planning.findUnique({ where: { id } });
    if (!planning) throw new NotFoundException('Planificación no encontrada');
    if (planning.status !== PlanningStatus.SUBMITTED) throw new BadRequestException('Solo se pueden aprobar/rechazar planificaciones enviadas');

    const updated = await this.prisma.planning.update({ where: { id }, data: { status } });
    return this.findById(updated.id);
  }

  async getSessions(query: PlanningSessionQueryDto) {
    const { page = 1, limit = 20, ...filters } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PlanningSessionWhereInput = {};
    if (filters.planningId) where.planningId = filters.planningId;
    if (filters.executed !== undefined) where.executed = filters.executed;
    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }

    const [sessions, total] = await Promise.all([
      this.prisma.planningSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'asc' },
        include: {
          planning: { include: { courseSubject: { include: { subject: true, course: true } } } },
          evidenceFiles: true,
        },
      }),
      this.prisma.planningSession.count({ where }),
    ]);

    return {
      data: sessions.map((s) => this.mapSession(s)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSessionById(id: string) {
    const session = await this.prisma.planningSession.findUnique({
      where: { id },
      include: {
        planning: { include: { courseSubject: { include: { subject: true, course: true } } } },
        evidenceFiles: true,
      },
    });
    if (!session) throw new NotFoundException('Sesión no encontrada');
    return this.mapSession(session);
  }

  async createSession(dto: CreatePlanningSessionDto) {
    const planning = await this.prisma.planning.findUnique({ where: { id: dto.planningId } });
    if (!planning) throw new NotFoundException('Planificación no encontrada');

    const existing = await this.prisma.planningSession.findFirst({
      where: { planningId: dto.planningId, sessionNumber: dto.sessionNumber },
    });
    if (existing) throw new ConflictException('Ya existe una sesión con este número en la planificación');

    const session = await this.prisma.planningSession.create({
      data: {
        planningId: dto.planningId,
        sessionNumber: dto.sessionNumber,
        date: new Date(dto.date),
        topic: dto.topic,
        activities: dto.activities as never,
        homework: dto.homework,
        resources: dto.resources,
      },
    });

    return this.getSessionById(session.id);
  }

  async updateSession(id: string, dto: UpdatePlanningSessionDto) {
    const session = await this.prisma.planningSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Sesión no encontrada');

    const data: Prisma.PlanningSessionUpdateInput = {};
    if (dto.sessionNumber) data.sessionNumber = dto.sessionNumber;
    if (dto.date) data.date = new Date(dto.date);
    if (dto.topic) data.topic = dto.topic;
    if (dto.activities) data.activities = dto.activities as never;
    if (dto.homework !== undefined) data.homework = dto.homework;
    if (dto.resources) data.resources = dto.resources;
    if (dto.executed !== undefined) data.executed = dto.executed;
    if (dto.executedAt) data.executedAt = new Date(dto.executedAt);
    if (dto.observations !== undefined) data.observations = dto.observations;

    const updated = await this.prisma.planningSession.update({ where: { id }, data });
    return this.getSessionById(updated.id);
  }

  async executeSession(dto: ExecuteSessionDto) {
    const session = await this.prisma.planningSession.findUnique({ where: { id: dto.sessionId } });
    if (!session) throw new NotFoundException('Sesión no encontrada');
    if (session.executed) throw new BadRequestException('La sesión ya fue ejecutada');

    const data: Prisma.PlanningSessionUpdateInput = {
      executed: true,
      executedAt: dto.executedAt ? new Date(dto.executedAt) : new Date(),
      observations: dto.observations,
    };

    const updated = await this.prisma.planningSession.update({ where: { id: dto.sessionId }, data });
    return this.getSessionById(updated.id);
  }

  async deleteSession(id: string) {
    const session = await this.prisma.planningSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Sesión no encontrada');
    await this.prisma.planningSession.delete({ where: { id } });
    return { message: 'Sesión eliminada correctamente' };
  }

  async addEvidenceToSession(sessionId: string, fileId: string, uploadedById: string) {
    const session = await this.prisma.planningSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Sesión no encontrada');

    const file = await this.prisma.evidenceFile.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundException('Archivo no encontrado');

    const evidence = await this.prisma.evidenceFile.create({
      data: { sessionId, uploadedById, fileName: file.fileName, originalName: file.originalName, mimeType: file.mimeType, size: file.size, bucket: file.bucket, objectKey: file.objectKey },
    });

    return evidence;
  }

  async aiAssistPlanning(dto: AiAssistPlanningDto) {
    const mockPlanning = {
      unitNumber: 1,
      unitTitle: 'Unidad Generada por IA',
      competencies: ['Competencia específica 1', 'Competencia específica 2'],
      objectives: ['Objetivo de aprendizaje 1', 'Objetivo de aprendizaje 2'],
      content: 'Contenido generado por IA basado en el currículo MINERD...',
      methodology: 'Aprendizaje basado en proyectos, trabajo colaborativo, gamificación',
      resources: ['Plataforma educativa', 'Materiales manipulativos', 'Recursos digitales'],
      assessment: 'Rúbricas de evaluación, autoevaluación, coevaluación',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      aiGenerated: true,
      aiPrompt: dto.prompt,
    };

    return {
      planningId: dto.planningId,
      suggestedPlanning: mockPlanning,
      confidence: 0.85,
      note: 'IA Assist (stub) - Conectar con servicio de IA real para generación automática',
    };
  }

  async getPlanningStats(teacherId?: string, periodId?: string) {
    const where: Prisma.PlanningWhereInput = {};
    if (teacherId) where.teacherId = teacherId;
    if (periodId) where.periodId = periodId;

    const plannings = await this.prisma.planning.findMany({ where, select: { status: true, aiGenerated: true } });
    const sessions = await this.prisma.planningSession.findMany({
      where: { planning: { ...where } },
      select: { executed: true },
    });

    const byStatus = { DRAFT: 0, SUBMITTED: 0, APPROVED: 0, REJECTED: 0, ARCHIVED: 0 };
    let aiGenerated = 0;
    plannings.forEach(p => { byStatus[p.status]++; if (p.aiGenerated) aiGenerated++; });

    const totalSessions = sessions.length;
    const executedSessions = sessions.filter(s => s.executed).length;
    const executionRate = totalSessions > 0 ? (executedSessions / totalSessions) * 100 : 0;

    return {
      totalPlannings: plannings.length,
      byStatus,
      aiGenerated,
      totalSessions,
      executedSessions,
      executionRate: Number(executionRate.toFixed(2)),
    };
  }
}