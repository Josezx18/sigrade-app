import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@sigrade/shared-prisma';
import { MinioService } from './minio.service';
import { FileQueryDto } from './dto/file.dto';

export interface FileUploadInput {
  fileBuffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
  tenantId: string;
  uploadedById: string;
  gradeId?: string;
  sessionId?: string;
}

@Injectable()
export class FilesService {
  private readonly evidenceBucket: string;

  constructor(
    private prisma: PrismaService,
    private minioService: MinioService,
    private configService: ConfigService,
  ) {
    this.evidenceBucket = this.configService.get<string>('MINIO_BUCKET_EVIDENCES', 'sigrade-evidences');
  }

  async findAll(query: FileQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.EvidenceFileWhereInput = {};
    if (query.gradeId) where.gradeId = query.gradeId;
    if (query.sessionId) where.sessionId = query.sessionId;

    const [data, total] = await Promise.all([
      this.prisma.evidenceFile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.evidenceFile.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const file = await this.prisma.evidenceFile.findUnique({ where: { id } });
    if (!file) throw new NotFoundException('Archivo no encontrado');
    return file;
  }

  async upload(input: FileUploadInput) {
    return this.createFromBuffer(input);
  }

  async createFromBuffer(input: FileUploadInput) {
    const prefix = input.gradeId ? 'grades' : 'sessions';
    const ref = input.gradeId || input.sessionId || 'general';
    const objectKey = this.minioService.getBucketKey(input.tenantId, prefix, ref, input.originalName);

    await this.minioService.uploadFile(this.evidenceBucket, objectKey, input.fileBuffer, input.mimeType);

    const signedUrl = await this.minioService.getPresignedUrl(this.evidenceBucket, objectKey, 86400);

    return this.prisma.evidenceFile.create({
      data: {
        fileName: input.originalName,
        originalName: input.originalName,
        mimeType: input.mimeType,
        size: input.size,
        bucket: this.evidenceBucket,
        objectKey,
        url: signedUrl,
        uploadedById: input.uploadedById,
        gradeId: input.gradeId ?? null,
        sessionId: input.sessionId ?? null,
      },
    });
  }

  async delete(id: string) {
    const file = await this.findById(id);
    try {
      await this.minioService.deleteFile(file.bucket, file.objectKey);
    } catch {
      // If the file doesn't exist in MinIO, still delete the DB record
    }
    return this.prisma.evidenceFile.delete({ where: { id } });
  }

  async getPresignedUrl(id: string): Promise<string> {
    const file = await this.findById(id);
    return this.minioService.getPresignedUrl(file.bucket, file.objectKey);
  }
}
