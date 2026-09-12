import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RoleType } from '@sigrade/shared-prisma';
import { CreateAttendanceDto, UpdateAttendanceDto, BulkCreateAttendanceDto, QrAttendanceDto, JustificationDto, MonthlyReportQueryDto, AttendanceQueryDto } from './dto/attendance.dto';

@ApiTags('Asistencia')
@ApiBearerAuth()
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.DISTRICT_DIRECTOR, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Obtener asistencias con filtros y paginación' })
  async findAll(@Query() query: AttendanceQueryDto) {
    return this.attendanceService.findAll(query);
  }

  @Get('statistics')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.DISTRICT_DIRECTOR, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Obtener estadísticas de asistencia' })
  async getStatistics(@Query() query: AttendanceQueryDto) {
    return this.attendanceService.getStatistics(query);
  }

  @Get('monthly-report')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.DISTRICT_DIRECTOR, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Generar reporte mensual de asistencia' })
  async generateMonthlyReport(@Query() query: MonthlyReportQueryDto) {
    return this.attendanceService.generateMonthlyReport(query);
  }

  @Get('student-summary')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.DISTRICT_DIRECTOR, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER, RoleType.STUDENT, RoleType.PARENT)
  @ApiOperation({ summary: 'Obtener resumen de asistencia de un estudiante' })
  async getStudentSummary(
    @Query('studentId') studentId: string,
    @Query('courseSubjectId') courseSubjectId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.attendanceService.getStudentAttendanceSummary(studentId, courseSubjectId, new Date(startDate), new Date(endDate));
  }

  @Get(':id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.DISTRICT_DIRECTOR, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Obtener un registro de asistencia por ID' })
  async findById(@Param('id') id: string) {
    return this.attendanceService.findById(id);
  }

  @Post()
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Registrar asistencia individual' })
  async create(@Body() dto: CreateAttendanceDto, @CurrentUser('id') userId: string) {
    return this.attendanceService.create(dto, userId);
  }

  @Post('bulk')
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Registrar asistencia masiva por lista/fecha' })
  async bulkCreate(@Body() dto: BulkCreateAttendanceDto, @CurrentUser('id') userId: string) {
    return this.attendanceService.bulkCreate(dto, userId);
  }

  @Post('qr-checkin')
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER, RoleType.STUDENT)
  @ApiOperation({ summary: 'Registrar asistencia por código QR' })
  async qrCheckIn(@Body() dto: QrAttendanceDto, @CurrentUser('id') userId: string) {
    return this.attendanceService.qrCheckIn(dto, userId);
  }

  @Post('justify')
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER, RoleType.PARENT, RoleType.STUDENT)
  @ApiOperation({ summary: 'Enviar justificativo de inasistencia' })
  async submitJustification(@Body() dto: JustificationDto, @CurrentUser('id') userId: string) {
    return this.attendanceService.submitJustification(dto, userId);
  }

  @Patch(':id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Actualizar registro de asistencia' })
  async update(@Param('id') id: string, @Body() dto: UpdateAttendanceDto) {
    return this.attendanceService.update(id, dto);
  }

  @Delete(':id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR)
  @ApiOperation({ summary: 'Eliminar registro de asistencia' })
  async delete(@Param('id') id: string) {
    return this.attendanceService.delete(id);
  }
}