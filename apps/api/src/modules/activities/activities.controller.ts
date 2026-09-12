import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto, UpdateActivityDto, ActivityQueryDto } from './dto/activity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleType } from '@prisma/client';

@ApiTags('Actividades')
@ApiBearerAuth()
@Controller('activities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  @Roles(RoleType.TEACHER, RoleType.COORDINATOR, RoleType.SCHOOL_DIRECTOR)
  @ApiOperation({ summary: 'Listar actividades (paginado, filtros)' })
  async findAll(@Query() query: ActivityQueryDto) {
    return this.activitiesService.findAll(query);
  }

  @Get(':id')
  @Roles(RoleType.TEACHER, RoleType.COORDINATOR, RoleType.SCHOOL_DIRECTOR)
  @ApiOperation({ summary: 'Obtener actividad por ID con calificaciones y conteo de evidencias' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.activitiesService.findById(id);
  }

  @Post()
  @Roles(RoleType.TEACHER, RoleType.COORDINATOR)
  @ApiOperation({ summary: 'Crear actividad' })
  async create(@Body() dto: CreateActivityDto) {
    return this.activitiesService.create(dto);
  }

  @Put(':id')
  @Roles(RoleType.TEACHER, RoleType.COORDINATOR)
  @ApiOperation({ summary: 'Actualizar actividad' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateActivityDto) {
    return this.activitiesService.update(id, dto);
  }

  @Patch(':id/publish')
  @Roles(RoleType.TEACHER, RoleType.COORDINATOR)
  @ApiOperation({ summary: 'Cambiar estado de publicación de la actividad' })
  async togglePublish(@Param('id', ParseUUIDPipe) id: string) {
    return this.activitiesService.togglePublish(id);
  }

  @Delete(':id')
  @Roles(RoleType.TEACHER, RoleType.COORDINATOR)
  @ApiOperation({ summary: 'Eliminar actividad' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.activitiesService.delete(id);
  }
}
