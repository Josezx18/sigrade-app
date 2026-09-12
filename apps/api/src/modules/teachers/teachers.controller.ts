import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto, UpdateTeacherDto, TeacherQueryDto } from './dto/teacher.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleType } from '@prisma/client';

@ApiTags('Docentes')
@ApiBearerAuth()
@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Post()
  @Roles(RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR)
  @ApiOperation({ summary: 'Crear docente' })
  async create(@Body() dto: CreateTeacherDto) {
    return this.teachersService.create(dto);
  }

  @Get()
  @Roles(RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR)
  @ApiOperation({ summary: 'Listar docentes (paginado, filtros)' })
  async findAll(@Query() query: TeacherQueryDto) {
    return this.teachersService.findAll(query);
  }

  @Get(':id')
  @Roles(RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR)
  @ApiOperation({ summary: 'Obtener docente por ID' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.teachersService.findById(id);
  }

  @Get(':id/assignments')
  @Roles(RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR)
  @ApiOperation({ summary: 'Obtener asignaciones del docente' })
  async getAssignments(@Param('id', ParseUUIDPipe) id: string) {
    return this.teachersService.getAssignments(id);
  }

  @Put(':id')
  @Roles(RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR)
  @ApiOperation({ summary: 'Actualizar docente (PUT)' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTeacherDto) {
    return this.teachersService.update(id, dto);
  }

  @Patch(':id')
  @Roles(RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR)
  @ApiOperation({ summary: 'Actualizar docente (PATCH)' })
  async patch(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTeacherDto) {
    return this.teachersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR)
  @ApiOperation({ summary: 'Eliminar docente' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.teachersService.delete(id);
  }
}
