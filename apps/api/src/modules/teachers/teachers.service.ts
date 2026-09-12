import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@sigrade/shared-prisma';
import { Prisma } from '@prisma/client';
import { CreateTeacherDto, UpdateTeacherDto } from './dto/teacher.dto';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    contractType?: string;
    specialization?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 25;
    const skip = (page - 1) * limit;

    const where: Prisma.TeacherWhereInput = {};
    if (query.search) {
      where.OR = [
        { user: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { user: { lastName: { contains: query.search, mode: 'insensitive' } } },
        { employeeCode: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.isActive !== undefined) where.user = { isActive: query.isActive };
    if (query.contractType) where.contractType = query.contractType as Prisma.EnumContractTypeFilter;
    if (query.specialization) where.specialization = { contains: query.specialization, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      this.prisma.teacher.findMany({
        where,
        skip,
        take: limit,
        orderBy: { hireDate: 'desc' },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, dni: true, phone: true, isActive: true, createdAt: true, updatedAt: true } },
          assignments: { include: { subject: true, course: true } },
        },
      }),
      this.prisma.teacher.count({ where }),
    ]);

    return {
      data: data.map((t) => ({
        id: t.id,
        userId: t.userId || '',
        employeeCode: t.employeeCode,
        firstName: t.user?.firstName || '',
        lastName: t.user?.lastName || '',
        email: t.user?.email || '',
        phone: t.user?.phone || '',
        dni: t.user?.dni || '',
        degree: t.degree,
        specialization: t.specialization,
        hireDate: t.hireDate.toISOString(),
        contractType: t.contractType,
        isActive: t.user?.isActive ?? true,
        subjects: t.assignments.map((a) => ({ id: a.subject.id, name: a.subject.name })),
        createdAt: t.user?.createdAt.toISOString() || '',
        updatedAt: t.user?.updatedAt.toISOString() || '',
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const t = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, dni: true } },
        assignments: { include: { subject: true, course: true } },
      },
    });
    if (!t) throw new NotFoundException('Docente no encontrado');
    return t;
  }

  async getAssignments(id: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id } });
    if (!teacher) throw new NotFoundException('Docente no encontrado');

    const assignments = await this.prisma.teacherAssignment.findMany({
      where: { teacherId: id },
      include: {
        subject: true,
        course: { include: { gradeLevel: true } },
      },
    });

    return assignments.map((a) => ({
      courseId: a.courseId,
      courseName: a.course.name,
      gradeName: a.course.gradeLevel?.name || '',
      subjectId: a.subjectId,
      subjectName: a.subject.name,
    }));
  }

  async create(dto: CreateTeacherDto, tenantId?: string) {
    const data: Prisma.TeacherCreateInput = {
      user: { connect: { id: dto.userId } },
      employeeCode: dto.employeeCode,
      degree: dto.degree,
      specialization: dto.specialization,
      hireDate: new Date(dto.hireDate),
      contractType: dto.contractType,
      tenant: { connect: { id: dto.tenantId || tenantId || '' } },
    };
    return this.prisma.teacher.create({ data });
  }

  async update(id: string, dto: UpdateTeacherDto) {
    const data: Prisma.TeacherUpdateInput = {};
    if (dto.userId) data.user = { connect: { id: dto.userId } };
    if (dto.employeeCode) data.employeeCode = dto.employeeCode;
    if (dto.degree !== undefined) data.degree = dto.degree;
    if (dto.specialization !== undefined) data.specialization = dto.specialization;
    if (dto.hireDate) data.hireDate = new Date(dto.hireDate);
    if (dto.contractType) data.contractType = dto.contractType;
    if (dto.tenantId) data.tenant = { connect: { id: dto.tenantId } };
    if (data.tenant === undefined) {
      const existing = await this.prisma.teacher.findUnique({ where: { id }, select: { tenantId: true } });
      if (existing) data.tenant = { connect: { id: existing.tenantId } };
    }
    return this.prisma.teacher.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.teacher.delete({ where: { id } });
  }
}
