import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EvidencesService } from './evidences.service';
import { CreateEvidenceDto, UpdateEvidenceDto, GradeEvidenceDto } from './dto/evidence.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleType } from '@prisma/client';

@ApiTags('Evidencias')
@ApiBearerAuth()
@Controller('evidences')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EvidencesController {
  constructor(private readonly evidencesService: EvidencesService) {}

  @Get()
  @Roles(RoleType.TEACHER, RoleType.COORDINATOR, RoleType.SCHOOL_DIRECTOR, RoleType.STUDENT)
  @ApiOperation({ summary: 'Listar evidencias por actividad o estudiante' })
  async findAll(
    @Query('activityId') activityId?: string,
    @Query('studentId') studentId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.evidencesService.findAll({ activityId, studentId, page, limit });
  }

  @Get(':id')
  @Roles(RoleType.TEACHER, RoleType.COORDINATOR, RoleType.SCHOOL_DIRECTOR, RoleType.STUDENT)
  @ApiOperation({ summary: 'Obtener evidencia por ID' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.evidencesService.findById(id);
  }

  @Post()
  @Roles(RoleType.TEACHER, RoleType.STUDENT)
  @ApiOperation({ summary: 'Subir evidencia' })
  async create(@Body() dto: CreateEvidenceDto) {
    return this.evidencesService.create(dto);
  }

  @Put(':id')
  @Roles(RoleType.TEACHER, RoleType.STUDENT)
  @ApiOperation({ summary: 'Actualizar evidencia' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEvidenceDto) {
    return this.evidencesService.update(id, dto);
  }

  @Patch(':id/grade')
  @Roles(RoleType.TEACHER)
  @ApiOperation({ summary: 'Calificar evidencia' })
  async grade(@Param('id', ParseUUIDPipe) id: string, @Body() dto: GradeEvidenceDto) {
    return this.evidencesService.grade(id, dto);
  }

  @Delete(':id')
  @Roles(RoleType.TEACHER, RoleType.STUDENT)
  @ApiOperation({ summary: 'Eliminar evidencia' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.evidencesService.delete(id);
  }
}
