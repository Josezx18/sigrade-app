import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@sigrade/shared-prisma';
import { Prisma } from '@prisma/client';
import { CreateStudentDto, UpdateStudentDto } from './dto/student.dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    gradeId?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = query.page || 1;
    const limit = query.limit || 25;
    const skip = (page - 1) * limit;
    const sortBy = (query.sortBy && ['firstName', 'lastName', 'studentCode', 'birthDate', 'gender'].includes(query.sortBy)) ? query.sortBy : 'studentCode';
    const sortOrder = query.sortOrder || 'asc';

    const where: Prisma.StudentWhereInput = {};

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { studentCode: { contains: query.search, mode: 'insensitive' } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
        { user: { dni: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    if (query.gradeId) {
      where.enrollments = { some: { course: { gradeLevelId: query.gradeId } } };
    }

    if (query.status) {
      where.enrollments = {
        ...(where.enrollments as Prisma.StudentCourseListRelationFilter || {}),
        some: {
          ...((where.enrollments as Prisma.StudentCourseListRelationFilter)?.some as Prisma.StudentCourseWhereInput || {}),
          status: query.status as Prisma.EnumEnrollmentStatusFilter,
        },
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, dni: true } },
          enrollments: {
            include: {
              course: { include: { gradeLevel: true } },
              schoolYear: true,
            },
            orderBy: { enrolledAt: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      data: data.map((student) => ({
        id: student.id,
        studentCode: student.studentCode,
        firstName: student.firstName,
        lastName: student.lastName,
        dni: student.user?.dni || '',
        email: student.user?.email || '',
        phone: student.phone || '',
        birthDate: student.birthDate.toISOString(),
        gender: student.gender,
        address: student.address || '',
        gradeId: student.enrollments[0]?.course?.gradeLevelId || '',
        gradeName: student.enrollments[0]?.course?.gradeLevel?.name || '',
        section: student.enrollments[0]?.course?.name || '',
        enrollmentDate: student.enrollments[0]?.enrolledAt.toISOString() || '',
        status: student.enrollments[0]?.status || 'INACTIVE',
        parentName: (student.emergencyContact as Record<string, unknown>)?.nombre as string || '',
        parentPhone: (student.emergencyContact as Record<string, unknown>)?.telefono as string || '',
        parentEmail: (student.emergencyContact as Record<string, unknown>)?.email as string || '',
        createdAt: student.enrollments[0]?.enrolledAt?.toISOString?.() || new Date().toISOString(),
        updatedAt: student.enrollments[0]?.enrolledAt?.toISOString?.() || new Date().toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, dni: true } },
        enrollments: {
          include: { course: { include: { gradeLevel: true } }, schoolYear: true },
          orderBy: { enrolledAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!student) throw new NotFoundException('Estudiante no encontrado');
    return student;
  }

  async create(dto: CreateStudentDto) {
    const student = await this.prisma.student.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        studentCode: dto.studentCode || `EST-${Date.now()}`,
        birthDate: new Date(dto.birthDate),
        gender: dto.gender,
        address: dto.address || '',
        phone: dto.phone || '',
        emergencyContact: dto.parentName ? { nombre: dto.parentName, telefono: dto.parentPhone, email: dto.parentEmail } : {},
        tenantId: dto.tenantId,
      },
    });
    return student;
  }

  async update(id: string, dto: UpdateStudentDto) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundException('Estudiante no encontrado');

    const updateData: Prisma.StudentUpdateInput = {};
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.birthDate !== undefined) updateData.birthDate = new Date(dto.birthDate);
    if (dto.gender !== undefined) updateData.gender = dto.gender;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.parentName !== undefined || dto.parentPhone !== undefined || dto.parentEmail !== undefined) {
      updateData.emergencyContact = {
        nombre: dto.parentName || '',
        telefono: dto.parentPhone || '',
        email: dto.parentEmail || '',
      };
    }

    return this.prisma.student.update({ where: { id }, data: updateData });
  }

  async delete(id: string) {
    return this.prisma.student.delete({ where: { id } });
  }

  async bulkDelete(ids: string[]) {
    await this.prisma.student.deleteMany({ where: { id: { in: ids } } });
    return { deleted: ids.length };
  }

  async exportCSV(query: { search?: string; gradeId?: string; status?: string }) {
    const data = await this.findAll({ ...query, page: 1, limit: 10000 });
    const rows = data.data.map((s) =>
      [
        s.studentCode,
        s.firstName,
        s.lastName,
        s.dni,
        s.email,
        s.gradeName,
        s.status,
        s.enrollmentDate,
      ].join(',')
    );
    const header = 'Código,Nombre,Apellido,DNI,Email,Grado,Estado,Matrícula';
    return `${header}\n${rows.join('\n')}`;
  }
}
