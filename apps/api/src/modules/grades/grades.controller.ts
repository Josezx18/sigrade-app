import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, ParseUUIDPipe, UseGuards, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GradesService } from './grades.service';
import { CreateGradeDto, UpdateGradeDto, GradeQueryDto } from './dto/grade.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleType } from '@prisma/client';
import { Response } from 'express';

@ApiTags('Calificaciones')
@ApiBearerAuth()
@Controller('grades')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post()
  @Roles(RoleType.TEACHER, RoleType.COORDINATOR, RoleType.SCHOOL_DIRECTOR)
  @ApiOperation({ summary: 'Crear calificación' })
  async create(@Body() dto: CreateGradeDto) {
    return this.gradesService.create(dto);
  }

  @Post('bulk')
  @Roles(RoleType.TEACHER, RoleType.COORDINATOR)
  @ApiOperation({ summary: 'Crear calificaciones masivas' })
  @HttpCode(HttpStatus.OK)
  async bulkCreate(@Body() grades: CreateGradeDto[]) {
    return this.gradesService.bulkCreate(grades);
  }

  @Get()
  @Roles(RoleType.TEACHER, RoleType.COORDINATOR, RoleType.SCHOOL_DIRECTOR)
  @ApiOperation({ summary: 'Listar calificaciones (paginado, filtros)' })
  async findAll(@Query() query: GradeQueryDto) {
    return this.gradesService.findAll(query);
  }

  @Get('export')
  @Roles(RoleType.TEACHER, RoleType.COORDINATOR, RoleType.SCHOOL_DIRECTOR)
  @ApiOperation({ summary: 'Exportar calificaciones (CSV)' })
  async export(@Query() query: GradeQueryDto, @Res() res: Response) {
    const csv = await this.gradesService.exportGrades(query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="calificaciones.csv"');
    res.send(csv);
  }

  @Get('student/:studentId/period/:periodId')
  @Roles(RoleType.TEACHER, RoleType.COORDINATOR, RoleType.SCHOOL_DIRECTOR, RoleType.STUDENT, RoleType.PARENT)
  @ApiOperation({ summary: 'Obtener calificaciones por estudiante y periodo' })
  async findByStudentAndPeriod(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Param('periodId', ParseUUIDPipe) periodId: string,
  ) {
    return this.gradesService.findByStudentAndPeriod(studentId, periodId);
  }

  @Get('history/:studentId')
  @Roles(RoleType.TEACHER, RoleType.COORDINATOR, RoleType.SCHOOL_DIRECTOR, RoleType.STUDENT, RoleType.PARENT)
  @ApiOperation({ summary: 'Obtener historial de calificaciones de un estudiante' })
  async getHistory(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.gradesService.getHistory(studentId);
  }

  @Get(':id')
  @Roles(RoleType.TEACHER, RoleType.COORDINATOR, RoleType.SCHOOL_DIRECTOR)
  @ApiOperation({ summary: 'Obtener calificación por ID' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.gradesService.findById(id);
  }

  @Put(':id')
  @Roles(RoleType.TEACHER, RoleType.COORDINATOR, RoleType.SCHOOL_DIRECTOR)
  @ApiOperation({ summary: 'Actualizar calificación (PUT)' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateGradeDto) {
    return this.gradesService.update(id, dto);
  }

  @Patch(':id')
  @Roles(RoleType.TEACHER, RoleType.COORDINATOR, RoleType.SCHOOL_DIRECTOR)
  @ApiOperation({ summary: 'Actualizar calificación (PATCH)' })
  async patch(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateGradeDto) {
    return this.gradesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(RoleType.TEACHER, RoleType.COORDINATOR, RoleType.SCHOOL_DIRECTOR)
  @ApiOperation({ summary: 'Eliminar calificación' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.gradesService.delete(id);
  }
}
