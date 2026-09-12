import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, NotificationQueryDto } from './dto/notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { RoleType } from '@prisma/client';

@ApiTags('Notificaciones')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles(RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR, RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Crear notificación' })
  async create(
    @Body() dto: CreateNotificationDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.notificationsService.create(dto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar notificaciones del usuario actual' })
  async findAll(
    @Query() query: NotificationQueryDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.findAll(query, tenantId, userId);
  }

  @Get('unread/count')
  @ApiOperation({ summary: 'Obtener cantidad de notificaciones no leídas' })
  async getUnreadCount(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.getUnreadCount(tenantId, userId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
  async markAllAsRead(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.markAllAsRead(tenantId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener notificación por ID' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.findById(id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar notificación como leída' })
  async markAsRead(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar notificación' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.delete(id);
  }
}
