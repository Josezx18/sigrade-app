import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleType } from '@sigrade/shared-prisma';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuditLogFiltersDto, CreateAuditLogDto } from './dto/audit.dto';

@ApiTags('Auditoría y Trazabilidad')
@ApiBearerAuth()
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post('logs')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.DISTRICT_DIRECTOR, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Registrar log de auditoría' })
  @ApiResponse({ status: 201, description: 'Log creado' })
  async create(@Body() dto: CreateAuditLogDto) {
    return this.auditService.log(dto);
  }

  @Get('logs')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.DISTRICT_DIRECTOR, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR)
  @ApiOperation({ summary: 'Listar logs de auditoría' })
  @ApiResponse({ status: 200, description: 'Lista paginada de logs de auditoría' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'userId', required: false })
  async findAll(@Query() filters: AuditLogFiltersDto) {
    return this.auditService.findAll(filters);
  }
}