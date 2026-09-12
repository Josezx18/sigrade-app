import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@sigrade/shared-prisma';
import { Prisma } from '@prisma/client';
import { CreateNotificationDto, NotificationQueryDto } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateNotificationDto, tenantId: string) {
    return this.prisma.notification.create({
      data: {
        tenantId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        userId: dto.userId ?? null,
        link: dto.link ?? null,
      },
    });
  }

  async findAll(query: NotificationQueryDto, tenantId: string, userId?: string) {
    const page = query.page || 1;
    const limit = query.limit || 25;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = { tenantId };

    if (userId) {
      where.OR = [{ userId }, { userId: null }];
    }

    if (query.read !== undefined) {
      where.read = query.read;
    }

    if (query.type) {
      where.type = query.type;
    }

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findMyNotifications(query: NotificationQueryDto, tenantId: string, userId: string) {
    const page = query.page || 1;
    const limit = query.limit || 25;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      tenantId,
      userId,
    };

    if (query.read !== undefined) {
      where.read = query.read;
    }

    if (query.type) {
      where.type = query.type;
    }

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const entity = await this.prisma.notification.findUnique({ where: { id } });
    if (!entity) throw new NotFoundException('Notificación no encontrada');
    return entity;
  }

  async markAsRead(id: string) {
    await this.findById(id);
    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllAsRead(tenantId: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { tenantId, userId, read: false },
      data: { read: true },
    });
    return { message: 'Todas las notificaciones han sido marcadas como leídas' };
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.notification.delete({ where: { id } });
  }

  async getUnreadCount(tenantId: string, userId: string) {
    const count = await this.prisma.notification.count({
      where: { tenantId, userId, read: false },
    });
    return { count };
  }
}
