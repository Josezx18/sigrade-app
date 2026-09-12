import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseUUIDPipe, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { AcademicService } from './academic.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleType } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  CreateSchoolYearDto,
  UpdateSchoolYearDto,
  CreateAcademicPeriodDto,
  UpdateAcademicPeriodDto,
  CreateGradeLevelDto,
  CreateSubjectDto,
  UpdateSubjectDto,
  CreateCourseDto,
  UpdateCourseDto,
  AssignSubjectToCourseDto,
  CreateScheduleDto,
} from './dto/academic.dto';

@ApiTags('Académico')
@ApiBearerAuth()
@Controller('academic')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  // ==================== SCHOOL YEARS ====================

  @Get('school-years')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.DISTRICT_DIRECTOR, RoleType.SCHOOL_DIRECTOR, RoleType.COORDINATOR)
  @ApiOperation({ summary: 'Listar años escolares' })
  async getSchoolYears(@CurrentTenant() tenantId: string) {
    return this.academicService.findSchoolYears(tenantId);
  }

  @Get('school-years/:id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.DISTRICT_DIRECTOR, RoleType.SCHOOL_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Obtener año escolar' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async getSchoolYearById(@Param('id', ParseUUIDPipe) id: string) {
    return this.academicService.findSchoolYearById(id);
  }

  @Post('school-years')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.DISTRICT_DIRECTOR, RoleType.SCHOOL_DIRECTOR)
  @ApiOperation({ summary: 'Crear año escolar' })
  async createSchoolYear(@Body() dto: CreateSchoolYearDto, @CurrentTenant() tenantId: string) {
    return this.academicService.createSchoolYear(tenantId, dto);
  }

  @Put('school-years/:id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.DISTRICT_DIRECTOR, RoleType.SCHOOL_DIRECTOR)
  @ApiOperation({ summary: 'Actualizar año escolar' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async updateSchoolYear(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSchoolYearDto) {
    return this.academicService.updateSchoolYear(id, dto);
  }

  @Delete('school-years/:id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST)
  @ApiOperation({ summary: 'Eliminar año escolar' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @HttpCode(HttpStatus.OK)
  async deleteSchoolYear(@Param('id', ParseUUIDPipe) id: string) {
    return this.academicService.deleteSchoolYear(id);
  }

  // ==================== PERIODS ====================

  @Get('school-years/:id/periods')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.DISTRICT_DIRECTOR, RoleType.SCHOOL_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Listar períodos de un año escolar' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async getPeriods(@Param('id', ParseUUIDPipe) id: string) {
    return this.academicService.findPeriods(id);
  }

  @Post('school-years/:id/periods')
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.COORDINATOR)
  @ApiOperation({ summary: 'Crear período en un año escolar' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async createPeriod(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateAcademicPeriodDto) {
    return this.academicService.createPeriod(id, dto);
  }

  @Put('periods/:id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.COORDINATOR)
  @ApiOperation({ summary: 'Actualizar período' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async updatePeriod(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAcademicPeriodDto) {
    return this.academicService.updatePeriod(id, dto);
  }

  @Delete('periods/:id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR)
  @ApiOperation({ summary: 'Eliminar período' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @HttpCode(HttpStatus.OK)
  async deletePeriod(@Param('id', ParseUUIDPipe) id: string) {
    return this.academicService.deletePeriod(id);
  }

  // ==================== GRADE LEVELS ====================

  @Get('grade-levels')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.DISTRICT_DIRECTOR, RoleType.SCHOOL_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Listar niveles de grado' })
  async getGradeLevels(@CurrentTenant() tenantId: string) {
    return this.academicService.findGradeLevels(tenantId);
  }

  @Post('grade-levels')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST)
  @ApiOperation({ summary: 'Crear nivel de grado' })
  async createGradeLevel(@Body() dto: CreateGradeLevelDto, @CurrentTenant() tenantId: string) {
    return this.academicService.createGradeLevel(tenantId, dto);
  }

  @Delete('grade-levels/:id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST)
  @ApiOperation({ summary: 'Eliminar nivel de grado' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @HttpCode(HttpStatus.OK)
  async deleteGradeLevel(@Param('id', ParseUUIDPipe) id: string) {
    return this.academicService.deleteGradeLevel(id);
  }

  // ==================== SUBJECTS ====================

  @Get('subjects')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.DISTRICT_DIRECTOR, RoleType.SCHOOL_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Listar asignaturas' })
  async getSubjects(@Query('educationLevel') educationLevel: string | undefined, @CurrentTenant() tenantId: string) {
    return this.academicService.findSubjects(tenantId, { educationLevel });
  }

  @Get('subjects/:id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.DISTRICT_DIRECTOR, RoleType.SCHOOL_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Obtener asignatura' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async getSubjectById(@Param('id', ParseUUIDPipe) id: string) {
    return this.academicService.findSubjectById(id);
  }

  @Post('subjects')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST)
  @ApiOperation({ summary: 'Crear asignatura' })
  async createSubject(@Body() dto: CreateSubjectDto, @CurrentTenant() tenantId: string) {
    return this.academicService.createSubject(tenantId, dto);
  }

  @Put('subjects/:id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST)
  @ApiOperation({ summary: 'Actualizar asignatura' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async updateSubject(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSubjectDto) {
    return this.academicService.updateSubject(id, dto);
  }

  @Delete('subjects/:id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST)
  @ApiOperation({ summary: 'Eliminar asignatura' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @HttpCode(HttpStatus.OK)
  async deleteSubject(@Param('id', ParseUUIDPipe) id: string) {
    return this.academicService.deleteSubject(id);
  }

  // ==================== COURSES ====================

  @Get('courses')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.DISTRICT_DIRECTOR, RoleType.SCHOOL_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Listar cursos' })
  async getCourses(@Query('schoolYearId') schoolYearId: string | undefined, @Query('gradeLevelId') gradeLevelId: string | undefined, @CurrentTenant() tenantId: string) {
    return this.academicService.findCourses(tenantId, { schoolYearId, gradeLevelId });
  }

  @Get('courses/:id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.DISTRICT_DIRECTOR, RoleType.SCHOOL_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Obtener curso' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async getCourseById(@Param('id', ParseUUIDPipe) id: string) {
    return this.academicService.findCourseById(id);
  }

  @Post('courses')
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.COORDINATOR)
  @ApiOperation({ summary: 'Crear curso' })
  async createCourse(@Body() dto: CreateCourseDto, @CurrentTenant() tenantId: string) {
    return this.academicService.createCourse(tenantId, dto);
  }

  @Put('courses/:id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.COORDINATOR)
  @ApiOperation({ summary: 'Actualizar curso' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async updateCourse(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCourseDto) {
    return this.academicService.updateCourse(id, dto);
  }

  @Delete('courses/:id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST)
  @ApiOperation({ summary: 'Eliminar curso' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @HttpCode(HttpStatus.OK)
  async deleteCourse(@Param('id', ParseUUIDPipe) id: string) {
    return this.academicService.deleteCourse(id);
  }

  // ==================== SUBJECT ASSIGNMENTS ====================

  @Post('course-subjects')
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.COORDINATOR)
  @ApiOperation({ summary: 'Asignar asignatura a curso' })
  async assignSubject(@Body() dto: AssignSubjectToCourseDto) {
    return this.academicService.assignSubjectToCourse(dto);
  }

  @Delete('course-subjects/:id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.COORDINATOR)
  @ApiOperation({ summary: 'Remover asignatura de curso' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @HttpCode(HttpStatus.OK)
  async removeSubject(@Param('id', ParseUUIDPipe) id: string) {
    return this.academicService.removeSubjectFromCourse(id);
  }

  // ==================== SCHEDULES ====================

  @Get('courses/:id/schedules')
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Listar horarios de un curso' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async getSchedules(@Param('id', ParseUUIDPipe) id: string) {
    return this.academicService.findSchedules(id);
  }

  @Post('schedules')
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.COORDINATOR)
  @ApiOperation({ summary: 'Crear horario' })
  async createSchedule(@Body() dto: CreateScheduleDto) {
    return this.academicService.createSchedule(dto);
  }

  @Delete('schedules/:id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.COORDINATOR)
  @ApiOperation({ summary: 'Eliminar horario' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @HttpCode(HttpStatus.OK)
  async deleteSchedule(@Param('id', ParseUUIDPipe) id: string) {
    return this.academicService.deleteSchedule(id);
  }
}
