import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@sigrade/shared-prisma';
import { Prisma, GradeType } from '@prisma/client';
import { CreateActivityDto, UpdateActivityDto, ActivityQueryDto } from './dto/activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: ActivityQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 25;
    const skip = (page - 1) * limit;

    const where: Prisma.ActivityWhereInput = {};
    if (query.courseSubjectId) where.courseSubjectId = query.courseSubjectId;
    if (query.periodId) where.periodId = query.periodId;
    if (query.teacherId) where.teacherId = query.teacherId;
    if (query.type) where.type = query.type as GradeType;

    const [data, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          courseSubject: { include: { subject: { select: { id: true, name: true } }, course: true } },
          teacher: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
          period: { select: { id: true, name: true } },
          _count: { select: { grades: true, evidences: true } },
        },
      }),
      this.prisma.activity.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const entity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        courseSubject: { include: { subject: { select: { id: true, name: true } }, course: true } },
        teacher: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
        period: { select: { id: true, name: true } },
        grades: {
          include: {
            student: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        _count: { select: { evidences: true } },
      },
    });
    if (!entity) throw new NotFoundException('Actividad no encontrada');
    return entity;
  }

  async create(dto: CreateActivityDto) {
    return this.prisma.activity.create({ data: dto });
  }

  async update(id: string, dto: UpdateActivityDto) {
    await this.findById(id);
    return this.prisma.activity.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.activity.delete({ where: { id } });
  }

  async togglePublish(id: string) {
    const entity = await this.findById(id);
    return this.prisma.activity.update({
      where: { id },
      data: { isPublished: !entity.isPublished },
    });
  }
}
