import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@sigrade/shared-prisma';
import { Prisma } from '@prisma/client';
import { CreateEventDto, UpdateEventDto, EventQueryDto } from './dto/event.dto';

@Injectable()
export class SchoolEventsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateEventDto, tenantId: string, userId: string) {
    return this.prisma.schoolEvent.create({
      data: {
        title: dto.title,
        type: dto.type,
        date: new Date(dto.date),
        time: dto.time,
        description: dto.description,
        courseId: dto.courseId,
        tenantId,
        createdById: userId,
      },
    });
  }

  async findAll(query: EventQueryDto, tenantId: string) {
    const page = query.page || 1;
    const limit = query.limit || 25;
    const skip = (page - 1) * limit;

    const where: Prisma.SchoolEventWhereInput = { tenantId };

    if (query.type) where.type = query.type;
    if (query.courseId) where.courseId = query.courseId;
    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.schoolEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'asc' },
        include: {
          course: { select: { id: true, name: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.schoolEvent.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const entity = await this.prisma.schoolEvent.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!entity) throw new NotFoundException('Evento no encontrado');
    return entity;
  }

  async update(id: string, dto: UpdateEventDto) {
    await this.findById(id);
    const data: Prisma.SchoolEventUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.date !== undefined) data.date = new Date(dto.date);
    if (dto.time !== undefined) data.time = dto.time;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.courseId !== undefined) data.course = { connect: { id: dto.courseId } };
    return this.prisma.schoolEvent.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.schoolEvent.delete({ where: { id } });
  }
}
