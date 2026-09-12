import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@sigrade/shared-prisma';
import { Prisma } from '@prisma/client';
import { CreateGradeDto, UpdateGradeDto } from './dto/grade.dto';

@Injectable()
export class GradesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    studentId?: string;
    subjectId?: string;
    courseId?: string;
    periodId?: string;
    teacherId?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 25;
    const skip = (page - 1) * limit;

    const where: Prisma.GradeWhereInput = {};
    if (query.studentId) where.studentId = query.studentId;
    if (query.periodId) where.periodId = query.periodId;
    if (query.teacherId) where.gradedById = query.teacherId;
    if (query.courseId || query.subjectId) {
      where.courseSubject = {};
      if (query.courseId) where.courseSubject.courseId = query.courseId;
      if (query.subjectId) where.courseSubject.subjectId = query.subjectId;
    }

    const [data, total] = await Promise.all([
      this.prisma.grade.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: { select: { id: true, firstName: true, lastName: true } },
          courseSubject: { include: { subject: { select: { id: true, name: true } }, course: true } },
          gradedBy: { select: { id: true, firstName: true, lastName: true } },
          evidenceFiles: { select: { url: true } },
        },
      }),
      this.prisma.grade.count({ where }),
    ]);

    return {
      data: data.map((g) => ({
        id: g.id,
        studentId: g.studentId,
        studentName: `${g.student.firstName} ${g.student.lastName}`,
        subjectId: g.courseSubject.subjectId,
        subjectName: g.courseSubject.subject.name,
        courseId: g.courseSubject.courseId,
        teacherId: g.gradedById,
        teacherName: `${g.gradedBy.firstName} ${g.gradedBy.lastName}`,
        periodId: g.periodId,
        value: Number(g.score),
        weight: Number(g.weight),
        comment: g.description || '',
        evidenceUrl: g.evidenceFiles[0]?.url || '',
        createdAt: g.createdAt.toISOString(),
        updatedAt: g.updatedAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const g = await this.prisma.grade.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        courseSubject: { include: { subject: { select: { id: true, name: true } }, course: true } },
        gradedBy: { select: { id: true, firstName: true, lastName: true } },
        evidenceFiles: { select: { url: true } },
      },
    });
    if (!g) throw new NotFoundException('Calificación no encontrada');
    return {
      id: g.id,
      studentId: g.studentId,
      studentName: `${g.student.firstName} ${g.student.lastName}`,
      subjectId: g.courseSubject.subjectId,
      subjectName: g.courseSubject.subject.name,
      courseId: g.courseSubject.courseId,
      teacherId: g.gradedById,
      teacherName: `${g.gradedBy.firstName} ${g.gradedBy.lastName}`,
      periodId: g.periodId,
      value: Number(g.score),
      weight: Number(g.weight),
      comment: g.description || '',
      evidenceUrl: g.evidenceFiles[0]?.url || '',
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
    };
  }

  async create(dto: CreateGradeDto) {
    const grade = await this.prisma.grade.create({
      data: {
        studentId: dto.studentId,
        courseSubjectId: dto.subjectId,
        periodId: dto.periodId,
        gradedById: dto.teacherId,
        score: dto.value ?? 0,
        weight: dto.weight ?? 1,
        description: dto.comment || '',
        name: dto.name || 'Calificación',
        type: dto.type || 'EXAM',
      },
    });
    return grade;
  }

  async update(id: string, dto: UpdateGradeDto) {
    const existing = await this.prisma.grade.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Calificación no encontrada');

    const updateData: Prisma.GradeUncheckedUpdateInput = {};
    if (dto.value !== undefined) updateData.score = dto.value;
    if (dto.weight !== undefined) updateData.weight = dto.weight;
    if (dto.comment !== undefined) updateData.description = dto.comment;
    if (dto.studentId) updateData.studentId = dto.studentId;
    if (dto.periodId) updateData.periodId = dto.periodId;

    return this.prisma.grade.update({ where: { id }, data: updateData });
  }

  async delete(id: string) {
    const existing = await this.prisma.grade.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Calificación no encontrada');
    return this.prisma.grade.delete({ where: { id } });
  }

  async bulkCreate(grades: CreateGradeDto[]) {
    return this.prisma.$transaction(
      grades.map((dto) =>
        this.prisma.grade.create({
          data: {
            studentId: dto.studentId,
            courseSubjectId: dto.subjectId,
            periodId: dto.periodId,
            gradedById: dto.teacherId,
            score: dto.value ?? 0,
            weight: dto.weight ?? 1,
            description: dto.comment || '',
            name: dto.name || 'Calificación',
            type: dto.type || 'EXAM',
          },
        }),
      ),
    );
  }

  async findByStudentAndPeriod(studentId: string, periodId: string) {
    const grades = await this.prisma.grade.findMany({
      where: { studentId, periodId },
      orderBy: { createdAt: 'desc' },
      include: {
        courseSubject: { include: { subject: { select: { id: true, name: true } }, course: true } },
        gradedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const summary = {
      total: grades.length,
      average: grades.length > 0 ? Number((grades.reduce((sum, g) => sum + Number(g.score), 0) / grades.length).toFixed(2)) : 0,
      bySubject: {} as Record<string, { subjectName: string; grades: typeof grades; average: number }>,
    };

    for (const g of grades) {
      const subjId = g.courseSubject.subjectId;
      if (!summary.bySubject[subjId]) {
        summary.bySubject[subjId] = { subjectName: g.courseSubject.subject.name, grades: [], average: 0 };
      }
      summary.bySubject[subjId].grades.push(g);
    }

    for (const key of Object.keys(summary.bySubject)) {
      const entry = summary.bySubject[key];
      entry.average = entry.grades.length > 0
        ? Number((entry.grades.reduce((s, g) => s + Number(g.score), 0) / entry.grades.length).toFixed(2))
        : 0;
    }

    return { grades, summary };
  }

  async getHistory(studentId: string) {
    const grades = await this.prisma.grade.findMany({
      where: { studentId },
      orderBy: [{ period: { ordinal: 'asc' } }, { createdAt: 'desc' }],
      include: {
        period: { select: { id: true, name: true, ordinal: true } },
        courseSubject: { include: { subject: { select: { id: true, name: true } }, course: true } },
        gradedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const byPeriod: Record<string, { periodName: string; ordinal: number; grades: typeof grades; average: number }> = {};
    for (const g of grades) {
      const pid = g.periodId;
      if (!byPeriod[pid]) {
        byPeriod[pid] = { periodName: g.period.name, ordinal: g.period.ordinal, grades: [], average: 0 };
      }
      byPeriod[pid].grades.push(g);
    }

    for (const key of Object.keys(byPeriod)) {
      const entry = byPeriod[key];
      entry.average = entry.grades.length > 0
        ? Number((entry.grades.reduce((s, g) => s + Number(g.score), 0) / entry.grades.length).toFixed(2))
        : 0;
    }

    const periods = Object.values(byPeriod).sort((a, b) => a.ordinal - b.ordinal);
    const overallAverage = grades.length > 0
      ? Number((grades.reduce((s, g) => s + Number(g.score), 0) / grades.length).toFixed(2))
      : 0;

    return { grades, byPeriod: periods, overallAverage };
  }

  async exportGrades(query: { studentId?: string; courseId?: string; subjectId?: string; periodId?: string; teacherId?: string }) {
    const where: Prisma.GradeWhereInput = {};
    if (query.studentId) where.studentId = query.studentId;
    if (query.periodId) where.periodId = query.periodId;
    if (query.teacherId) where.gradedById = query.teacherId;
    if (query.courseId || query.subjectId) {
      where.courseSubject = {};
      if (query.courseId) where.courseSubject.courseId = query.courseId;
      if (query.subjectId) where.courseSubject.subjectId = query.subjectId;
    }

    const grades = await this.prisma.grade.findMany({
      where,
      include: {
        student: { select: { firstName: true, lastName: true, studentCode: true } },
        courseSubject: { include: { course: true, subject: { select: { name: true } } } },
        period: { select: { name: true } },
        gradedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ student: { lastName: 'asc' } }, { student: { firstName: 'asc' } }],
    });

    const headers = ['Estudiante', 'Código', 'Curso', 'Asignatura', 'Periodo', 'Calificación', 'Ponderación', 'Tipo', 'Calificado por', 'Fecha'];
    const rows = grades.map((g) => [
      `${g.student.firstName} ${g.student.lastName}`,
      g.student.studentCode,
      g.courseSubject.course.name,
      g.courseSubject.subject.name,
      g.period.name,
      String(Number(g.score)),
      String(Number(g.weight)),
      g.type,
      `${g.gradedBy.firstName} ${g.gradedBy.lastName}`,
      g.createdAt.toISOString().split('T')[0],
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return csvContent;
  }
}
