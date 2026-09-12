import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@sigrade/shared-prisma';
import { Prisma } from '@prisma/client';
import { CreateEvidenceDto, UpdateEvidenceDto, GradeEvidenceDto } from './dto/evidence.dto';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

@Injectable()
export class EvidencesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { activityId?: string; studentId?: string; page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 25;
    const skip = (page - 1) * limit;

    const where: Prisma.EvidenceWhereInput = {};
    if (query.activityId) where.activityId = query.activityId;
    if (query.studentId) where.studentId = query.studentId;

    const [data, total] = await Promise.all([
      this.prisma.evidence.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          activity: { select: { id: true, name: true } },
          student: { select: { id: true, firstName: true, lastName: true } },
          gradedBy: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
        },
      }),
      this.prisma.evidence.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const entity = await this.prisma.evidence.findUnique({
      where: { id },
      include: {
        activity: { select: { id: true, name: true, maxScore: true } },
        student: { select: { id: true, firstName: true, lastName: true } },
        gradedBy: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
      },
    });
    if (!entity) throw new NotFoundException('Evidencia no encontrada');
    return entity;
  }

  async create(dto: CreateEvidenceDto) {
    if (dto.fileSize > MAX_FILE_SIZE) {
      throw new BadRequestException('El archivo excede el tamaño máximo de 10MB');
    }
    if (!ALLOWED_MIME_TYPES.includes(dto.mimeType)) {
      throw new BadRequestException('Tipo de archivo no permitido. Use PDF o imágenes (jpg, png, gif, webp)');
    }

    const activity = await this.prisma.activity.findUnique({ where: { id: dto.activityId } });
    if (!activity) throw new NotFoundException('Actividad no encontrada');

    return this.prisma.evidence.create({ data: dto });
  }

  async update(id: string, dto: UpdateEvidenceDto) {
    await this.findById(id);
    return this.prisma.evidence.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.evidence.delete({ where: { id } });
  }

  async grade(id: string, dto: GradeEvidenceDto) {
    const entity = await this.findById(id);
    if (entity.isGraded) {
      throw new BadRequestException('La evidencia ya ha sido calificada');
    }

    return this.prisma.evidence.update({
      where: { id },
      data: {
        score: dto.score,
        feedback: dto.feedback,
        gradedById: dto.gradedById,
        isGraded: true,
        gradedAt: new Date(),
      },
    });
  }
}
