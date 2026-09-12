import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SchoolEventsService } from './school-events.service';
import { CreateEventDto, UpdateEventDto, EventQueryDto } from './dto/event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { RoleType } from '@prisma/client';

@ApiTags('Calendario')
@ApiBearerAuth()
@Controller('school-events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchoolEventsController {
  constructor(private readonly schoolEventsService: SchoolEventsService) {}

  @Post()
  @Roles(RoleType.TEACHER, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR)
  @ApiOperation({ summary: 'Crear evento escolar' })
  async create(
    @Body() dto: CreateEventDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.schoolEventsService.create(dto, tenantId, userId);
  }

  @Get()
  @Roles(RoleType.TEACHER, RoleType.COORDINATOR, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.STUDENT)
  @ApiOperation({ summary: 'Listar eventos (paginado, filtros)' })
  async findAll(
    @Query() query: EventQueryDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.schoolEventsService.findAll(query, tenantId);
  }

  @Get(':id')
  @Roles(RoleType.TEACHER, RoleType.COORDINATOR, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.STUDENT)
  @ApiOperation({ summary: 'Obtener evento por ID' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.schoolEventsService.findById(id);
  }

  @Patch(':id')
  @Roles(RoleType.TEACHER, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR)
  @ApiOperation({ summary: 'Actualizar evento' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEventDto) {
    return this.schoolEventsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(RoleType.TEACHER, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR)
  @ApiOperation({ summary: 'Eliminar evento' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.schoolEventsService.delete(id);
  }
}
