import { Injectable } from '@nestjs/common';
import { PrismaService } from '@sigrade/shared-prisma';
import { Prisma } from '@prisma/client';
import { CreateAuditLogDto, AuditLogFiltersDto } from './dto/audit.dto';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(dto: CreateAuditLogDto) {
    const input: Prisma.AuditLogUncheckedCreateInput = {
      tenantId: dto.tenantId,
      userId: dto.userId,
      action: dto.action as Prisma.AuditLogUncheckedCreateInput['action'],
      entityType: dto.entityType,
      entityId: dto.entityId ?? '',
      oldData: (dto.oldData ?? undefined) as Prisma.InputJsonValue | undefined,
      newData: (dto.newData ?? undefined) as Prisma.InputJsonValue | undefined,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
    };
    return this.prisma.auditLog.create({ data: input });
  }

  async findAll(filters: AuditLogFiltersDto & {
    limit?: number;
  }) {
    const { tenantId, userId, action, entityType, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};
    if (tenantId) where.tenantId = tenantId;
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data: logs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
