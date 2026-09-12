import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PeriodsService } from './periods.service';
import { CreatePeriodDto, UpdatePeriodDto, PeriodQueryDto } from './dto/period.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleType } from '@prisma/client';

@ApiTags('Periodos Académicos')
@ApiBearerAuth()
@Controller('periods')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PeriodsController {
  constructor(private readonly periodsService: PeriodsService) {}

  @Get()
  @Roles(RoleType.SCHOOL_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Listar periodos académicos (paginado, filtros)' })
  async findAll(@Query() query: PeriodQueryDto) {
    return this.periodsService.findAll(query);
  }

  @Get('active')
  @Roles(RoleType.SCHOOL_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Obtener periodo académico activo' })
  async findActive() {
    return this.periodsService.findActive();
  }

  @Get(':id')
  @Roles(RoleType.SCHOOL_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Obtener periodo académico por ID' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.periodsService.findById(id);
  }

  @Post()
  @Roles(RoleType.SCHOOL_DIRECTOR, RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Crear periodo académico' })
  async create(@Body() dto: CreatePeriodDto) {
    return this.periodsService.create(dto);
  }

  @Put(':id')
  @Roles(RoleType.SCHOOL_DIRECTOR, RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Actualizar periodo académico' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePeriodDto) {
    return this.periodsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(RoleType.SCHOOL_DIRECTOR, RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Eliminar periodo académico' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.periodsService.delete(id);
  }
}
