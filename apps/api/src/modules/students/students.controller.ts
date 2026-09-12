import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, ParseUUIDPipe, UseGuards, Res, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto, StudentQueryDto } from './dto/student.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleType } from '@prisma/client';

@ApiTags('Estudiantes')
@ApiBearerAuth()
@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles(RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR)
  @ApiOperation({ summary: 'Crear estudiante' })
  async create(@Body() dto: CreateStudentDto) {
    return this.studentsService.create(dto);
  }

  @Get()
  @Roles(RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Listar estudiantes (paginado, filtros, búsqueda)' })
  async findAll(@Query() query: StudentQueryDto) {
    return this.studentsService.findAll(query);
  }

  @Get('export')
  @Roles(RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR)
  @ApiOperation({ summary: 'Exportar estudiantes a CSV' })
  async exportCSV(
    @Query('search') search?: string,
    @Query('gradeId') gradeId?: string,
    @Query('status') status?: string,
    @Res() res?: Response,
  ) {
    const csv = await this.studentsService.exportCSV({ search, gradeId, status });
    if (res) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=estudiantes-${new Date().toISOString().split('T')[0]}.csv`);
      return res.send(csv);
    }
    return csv;
  }

  @Post('bulk-delete')
  @Roles(RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR)
  @ApiOperation({ summary: 'Eliminación masiva de estudiantes' })
  @HttpCode(HttpStatus.OK)
  async bulkDelete(@Body() body: { ids: string[] }) {
    return this.studentsService.bulkDelete(body.ids);
  }

  @Get(':id')
  @Roles(RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Obtener estudiante por ID' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.findById(id);
  }

  @Put(':id')
  @Roles(RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR)
  @ApiOperation({ summary: 'Actualizar estudiante (PUT)' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStudentDto) {
    return this.studentsService.update(id, dto);
  }

  @Patch(':id')
  @Roles(RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR)
  @ApiOperation({ summary: 'Actualizar estudiante (PATCH)' })
  async patch(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStudentDto) {
    return this.studentsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR)
  @ApiOperation({ summary: 'Eliminar estudiante' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.delete(id);
  }
}
