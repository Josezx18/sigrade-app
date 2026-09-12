import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@sigrade/shared-prisma';
import { Prisma } from '@prisma/client';
import { CreatePeriodDto, UpdatePeriodDto, PeriodQueryDto } from './dto/period.dto';

@Injectable()
export class PeriodsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PeriodQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 25;
    const skip = (page - 1) * limit;

    const where: Prisma.AcademicPeriodWhereInput = {};
    if (query.schoolYearId) where.schoolYearId = query.schoolYearId;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    const [data, total] = await Promise.all([
      this.prisma.academicPeriod.findMany({
        where,
        skip,
        take: limit,
        orderBy: { order: 'asc' },
        include: { schoolYear: { select: { id: true, name: true } } },
      }),
      this.prisma.academicPeriod.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const entity = await this.prisma.academicPeriod.findUnique({
      where: { id },
      include: { schoolYear: { select: { id: true, name: true } } },
    });
    if (!entity) throw new NotFoundException('Periodo académico no encontrado');
    return entity;
  }

  async findActive() {
    const entity = await this.prisma.academicPeriod.findFirst({
      where: { isActive: true },
      include: { schoolYear: { select: { id: true, name: true } } },
    });
    if (!entity) throw new NotFoundException('No hay un periodo académico activo');
    return entity;
  }

  async create(dto: CreatePeriodDto) {
    return this.prisma.academicPeriod.create({ data: dto });
  }

  async update(id: string, dto: UpdatePeriodDto) {
    await this.findById(id);
    return this.prisma.academicPeriod.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.academicPeriod.delete({ where: { id } });
  }
}
