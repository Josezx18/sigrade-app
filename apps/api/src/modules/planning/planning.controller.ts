import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PlanningService } from './planning.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RoleType } from '@prisma/client';
import { CreatePlanningDto, UpdatePlanningDto, CreatePlanningSessionDto, UpdatePlanningSessionDto, ExecuteSessionDto, AiAssistPlanningDto, PlanningQueryDto, PlanningSessionQueryDto } from './dto/planning.dto';

@ApiTags('Planificación')
@ApiBearerAuth()
@Controller('planning')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  // ==================== FIXED-PATH ROUTES (before :id) ====================

  @Get()
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.DISTRICT_DIRECTOR, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Obtener planificaciones con filtros y paginación' })
  async findAll(@Query() query: PlanningQueryDto) {
    return this.planningService.findAll(query);
  }

  @Get('statistics')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.DISTRICT_DIRECTOR, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Obtener estadísticas de planificaciones' })
  async getStatistics(@Query('teacherId') teacherId?: string, @Query('periodId') periodId?: string) {
    return this.planningService.getPlanningStats(teacherId, periodId);
  }

  @Post('ai-assist')
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'IA Assist para generación de planificación (stub)' })
  async aiAssistPlanning(@Body() dto: AiAssistPlanningDto) {
    return this.planningService.aiAssistPlanning(dto);
  }

  // ==================== SESSION ROUTES (before :id to avoid shadowing) ====================

  @Get('sessions/:sessionId')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.DISTRICT_DIRECTOR, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Obtener una sesión por ID' })
  async getSessionById(@Param('sessionId') sessionId: string) {
    return this.planningService.getSessionById(sessionId);
  }

  @Post('sessions')
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Crear una sesión de planificación' })
  async createSession(@Body() dto: CreatePlanningSessionDto) {
    return this.planningService.createSession(dto);
  }

  @Put('sessions/:sessionId')
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Actualizar una sesión de planificación' })
  async updateSession(@Param('sessionId') sessionId: string, @Body() dto: UpdatePlanningSessionDto) {
    return this.planningService.updateSession(sessionId, dto);
  }

  @Post('sessions/execute')
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Marcar sesión como ejecutada' })
  async executeSession(@Body() dto: ExecuteSessionDto) {
    return this.planningService.executeSession(dto);
  }

  @Delete('sessions/:sessionId')
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una sesión de planificación' })
  async deleteSession(@Param('sessionId') sessionId: string): Promise<void> {
    await this.planningService.deleteSession(sessionId);
  }

  @Post('sessions/:sessionId/evidence')
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Agregar evidencia a una sesión' })
  async addEvidenceToSession(@Param('sessionId') sessionId: string, @Body('fileId') fileId: string, @CurrentUser('id') userId: string) {
    return this.planningService.addEvidenceToSession(sessionId, fileId, userId);
  }

  // ==================== PLANNING :id ROUTES (catch-all dynamic, after fixed paths) ====================

  @Get(':id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.DISTRICT_DIRECTOR, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Obtener una planificación por ID con sesiones' })
  async findById(@Param('id') id: string) {
    return this.planningService.findById(id);
  }

  @Get(':id/sessions')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.DISTRICT_DIRECTOR, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Obtener sesiones de una planificación' })
  async getSessions(@Param('id') planningId: string, @Query() query: PlanningSessionQueryDto) {
    return this.planningService.getSessions({ ...query, planningId });
  }

  @Post()
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Crear una planificación' })
  async create(@Body() dto: CreatePlanningDto) {
    return this.planningService.create(dto);
  }

  @Put(':id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Actualizar una planificación' })
  async update(@Param('id') id: string, @Body() dto: UpdatePlanningDto) {
    return this.planningService.update(id, dto);
  }

  @Put(':id/submit')
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Enviar planificación para aprobación' })
  async submitForApproval(@Param('id') id: string) {
    return this.planningService.submitForApproval(id);
  }

  @Put(':id/approve')
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR)
  @ApiOperation({ summary: 'Aprobar planificación' })
  async approve(@Param('id') id: string) {
    return this.planningService.approveOrReject(id, 'APPROVED');
  }

  @Put(':id/reject')
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR)
  @ApiOperation({ summary: 'Rechazar planificación' })
  async reject(@Param('id') id: string) {
    return this.planningService.approveOrReject(id, 'REJECTED');
  }

  @Delete(':id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una planificación' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.planningService.delete(id);
  }
}