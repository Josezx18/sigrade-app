import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleType } from '@sigrade/shared-prisma';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  DashboardResponseDto,
  NationalDashboardDto,
  RegionalDashboardDto,
  DistrictDashboardDto,
  SchoolDashboardDto,
  TeacherDashboardDto,
  StudentProgressDto,
  PredictiveAnalyticsDto,
  ExportRequestDto,
  ExportResponseDto,
  ReportStatusDto,
} from './dto/analytics.dto';

interface AuthenticatedUser {
  id: string;
  tenantId: string;
  roles: { type: string }[];
}

@ApiTags('Analítica y Dashboards')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // ==================== MAIN DASHBOARD ====================

  @Get('dashboard')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.MINERD_ANALYST,
    RoleType.REGIONAL_DIRECTOR,
    RoleType.DISTRICT_DIRECTOR,
    RoleType.SCHOOL_DIRECTOR,
    RoleType.VICE_DIRECTOR,
    RoleType.COORDINATOR,
  )
  @ApiOperation({ summary: 'Obtener dashboard analítico según nivel jerárquico' })
  @ApiResponse({ status: 200, type: DashboardResponseDto })
  async getDashboard(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DashboardResponseDto> {
    return this.analyticsService.getDashboard(tenantId, user.roles?.map((r: { type: string }) => r.type) || []);
  }

  @Get('dashboard/national')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST)
  @ApiOperation({ summary: 'Dashboard nacional (MINERD)' })
  @ApiResponse({ status: 200, type: NationalDashboardDto })
  async getNationalDashboard(
    @CurrentTenant() tenantId: string,
  ): Promise<NationalDashboardDto> {
    return this.analyticsService.getNationalDashboard(tenantId);
  }

  @Get('dashboard/regional')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.REGIONAL_TECHNICIAN)
  @ApiOperation({ summary: 'Dashboard regional' })
  @ApiResponse({ status: 200, type: RegionalDashboardDto })
  async getRegionalDashboard(
    @CurrentTenant() tenantId: string,
  ): Promise<RegionalDashboardDto> {
    return this.analyticsService.getRegionalDashboard(tenantId);
  }

  @Get('dashboard/district')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.DISTRICT_DIRECTOR, RoleType.DISTRICT_TECHNICIAN)
  @ApiOperation({ summary: 'Dashboard distrital' })
  @ApiResponse({ status: 200, type: DistrictDashboardDto })
  async getDistrictDashboard(
    @CurrentTenant() tenantId: string,
  ): Promise<DistrictDashboardDto> {
    return this.analyticsService.getDistrictDashboard(tenantId);
  }

  @Get('dashboard/school')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.DISTRICT_DIRECTOR, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR)
  @ApiOperation({ summary: 'Dashboard de centro educativo' })
  @ApiResponse({ status: 200, type: SchoolDashboardDto })
  async getSchoolDashboard(
    @CurrentTenant() tenantId: string,
  ): Promise<SchoolDashboardDto> {
    return this.analyticsService.getSchoolDashboard(tenantId);
  }

  @Get('dashboard/teacher/:teacherId')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.MINERD_ANALYST,
    RoleType.REGIONAL_DIRECTOR,
    RoleType.DISTRICT_DIRECTOR,
    RoleType.SCHOOL_DIRECTOR,
    RoleType.VICE_DIRECTOR,
    RoleType.COORDINATOR,
    RoleType.TEACHER,
  )
  @ApiOperation({ summary: 'Dashboard de docente' })
  @ApiResponse({ status: 200, type: TeacherDashboardDto })
  @ApiParam({ name: 'teacherId', type: 'string', format: 'uuid' })
  async getTeacherDashboard(
    @Param('teacherId', ParseUUIDPipe) teacherId: string,
    @CurrentTenant() tenantId: string,
  ): Promise<TeacherDashboardDto> {
    return this.analyticsService.getTeacherDashboard(teacherId, tenantId);
  }

  // ==================== KPIs & METRICS ====================

  @Get('kpis')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.MINERD_ANALYST,
    RoleType.REGIONAL_DIRECTOR,
    RoleType.DISTRICT_DIRECTOR,
    RoleType.SCHOOL_DIRECTOR,
    RoleType.VICE_DIRECTOR,
    RoleType.COORDINATOR,
  )
  @ApiOperation({ summary: 'Obtener KPIs principales' })
  async getKpis(@CurrentTenant() tenantId: string) {
    const dashboard = await this.analyticsService.getDashboard(tenantId);
    return dashboard.kpis;
  }

  @Get('grade-distribution')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.MINERD_ANALYST,
    RoleType.REGIONAL_DIRECTOR,
    RoleType.DISTRICT_DIRECTOR,
    RoleType.SCHOOL_DIRECTOR,
    RoleType.VICE_DIRECTOR,
    RoleType.COORDINATOR,
    RoleType.TEACHER,
  )
  @ApiOperation({ summary: 'Distribución de calificaciones' })
  async getGradeDistribution(@CurrentTenant() tenantId: string) {
    const dashboard = await this.analyticsService.getDashboard(tenantId);
    return dashboard.gradeDistribution;
  }

  @Get('attendance-trends')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.MINERD_ANALYST,
    RoleType.REGIONAL_DIRECTOR,
    RoleType.DISTRICT_DIRECTOR,
    RoleType.SCHOOL_DIRECTOR,
    RoleType.VICE_DIRECTOR,
    RoleType.COORDINATOR,
    RoleType.TEACHER,
  )
  @ApiOperation({ summary: 'Tendencias de asistencia (últimos 30 días)' })
  async getAttendanceTrends(@CurrentTenant() tenantId: string) {
    const dashboard = await this.analyticsService.getDashboard(tenantId);
    return dashboard.attendanceTrends;
  }

  @Get('subject-performance')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.MINERD_ANALYST,
    RoleType.REGIONAL_DIRECTOR,
    RoleType.DISTRICT_DIRECTOR,
    RoleType.SCHOOL_DIRECTOR,
    RoleType.VICE_DIRECTOR,
    RoleType.COORDINATOR,
    RoleType.TEACHER,
  )
  @ApiOperation({ summary: 'Rendimiento por asignatura' })
  async getSubjectPerformance(@CurrentTenant() tenantId: string) {
    const dashboard = await this.analyticsService.getDashboard(tenantId);
    return dashboard.subjectPerformance;
  }

  @Get('teacher-performance')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.MINERD_ANALYST,
    RoleType.REGIONAL_DIRECTOR,
    RoleType.DISTRICT_DIRECTOR,
    RoleType.SCHOOL_DIRECTOR,
    RoleType.VICE_DIRECTOR,
    RoleType.COORDINATOR,
  )
  @ApiOperation({ summary: 'Ranking de desempeño docente' })
  async getTeacherPerformance(@CurrentTenant() tenantId: string) {
    const dashboard = await this.analyticsService.getDashboard(tenantId);
    return dashboard.topTeachers;
  }

  // ==================== STUDENT ANALYTICS ====================

@Get('students/at-risk')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.MINERD_ANALYST,
    RoleType.REGIONAL_DIRECTOR,
    RoleType.DISTRICT_DIRECTOR,
    RoleType.SCHOOL_DIRECTOR,
    RoleType.VICE_DIRECTOR,
    RoleType.COORDINATOR,
    RoleType.COUNSELOR,
    RoleType.PSYCHOLOGIST,
  )
  @ApiOperation({ summary: 'Estudiantes en riesgo' })
  @ApiResponse({ status: 200, type: [StudentProgressDto] })
  async getStudentsAtRisk(@CurrentTenant() tenantId: string) {
    return this.analyticsService.getStudentsAtRisk(tenantId);
  }

  @Get('students/:studentId/progress')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.MINERD_ANALYST,
    RoleType.REGIONAL_DIRECTOR,
    RoleType.DISTRICT_DIRECTOR,
    RoleType.SCHOOL_DIRECTOR,
    RoleType.VICE_DIRECTOR,
    RoleType.COORDINATOR,
    RoleType.TEACHER,
    RoleType.COUNSELOR,
    RoleType.PSYCHOLOGIST,
    RoleType.STUDENT,
    RoleType.PARENT,
  )
  @ApiOperation({ summary: 'Progreso académico de un estudiante' })
  @ApiResponse({ status: 200, type: StudentProgressDto })
  @ApiParam({ name: 'studentId', type: 'string', format: 'uuid' })
  async getStudentProgress(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentTenant() tenantId: string,
  ): Promise<StudentProgressDto> {
    const studentsAtRisk = await this.analyticsService.getStudentsAtRisk(tenantId);
    const student = studentsAtRisk.find(s => s.studentId === studentId);
    if (student) return student;

    // Fallback: compute on demand
    const prisma = this.analyticsService.getPrisma();
    const grades = await prisma.grade.findMany({ where: { studentId } });
    const attendances = await prisma.attendance.findMany({ where: { studentId } });
    const studentData = await prisma.student.findUnique({ where: { id: studentId } });
    if (!studentData) throw new NotFoundException('Estudiante no encontrado');
    return this.analyticsService.mapToStudentProgress(studentData, grades, attendances);
  }

  // ==================== PREDICTIVE ANALYTICS ====================

  @Get('predictive/dropout/:studentId')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.MINERD_ANALYST,
    RoleType.SCHOOL_DIRECTOR,
    RoleType.VICE_DIRECTOR,
    RoleType.COUNSELOR,
    RoleType.PSYCHOLOGIST,
  )
  @ApiOperation({ summary: 'Predicción de deserción escolar' })
  @ApiResponse({ status: 200, type: PredictiveAnalyticsDto })
  @ApiParam({ name: 'studentId', type: 'string', format: 'uuid' })
  async getDropoutPrediction(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentTenant() tenantId: string,
  ): Promise<PredictiveAnalyticsDto> {
    return this.analyticsService.getPredictiveAnalytics(studentId, tenantId);
  }

  @Get('predictive/bulk')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.SCHOOL_DIRECTOR, RoleType.COUNSELOR, RoleType.PSYCHOLOGIST)
  @ApiOperation({ summary: 'Predicciones de deserción en lote' })
  @ApiQuery({ name: 'tenantId', required: false, type: 'string', format: 'uuid' })
  async getBulkPredictions(
    @CurrentTenant() tenantId: string,
    @Query('tenantId') targetTenantId?: string,
  ) {
    const targetId = targetTenantId || tenantId;
    const prisma = this.analyticsService.getPrisma();
    const students = await prisma.student.findMany({
      where: { tenantId: targetId, enrollments: { some: { status: 'ACTIVE' } } },
    });
    
    const predictions = await Promise.all(
      students.map((s: { id: string }) => this.analyticsService.getPredictiveAnalytics(s.id, targetId))
    );
    
    return predictions.filter(p => p.riskLevel !== 'LOW').sort((a, b) => b.dropoutProbability - a.dropoutProbability);
  }

  // ==================== EXPORT FUNCTIONALITY ====================

  @Post('export')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.MINERD_ANALYST,
    RoleType.REGIONAL_DIRECTOR,
    RoleType.DISTRICT_DIRECTOR,
    RoleType.SCHOOL_DIRECTOR,
    RoleType.VICE_DIRECTOR,
    RoleType.COORDINATOR,
  )
  @ApiOperation({ summary: 'Generar reporte para exportación (PDF/Excel/CSV)' })
  @ApiResponse({ status: 202, type: ExportResponseDto })
  async exportReport(
    @Body() dto: ExportRequestDto,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenantId: string,
  ): Promise<ExportResponseDto> {
    return this.analyticsService.exportReport(dto, user.id, tenantId);
  }

  @Get('export/:reportId/status')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.MINERD_ANALYST,
    RoleType.REGIONAL_DIRECTOR,
    RoleType.DISTRICT_DIRECTOR,
    RoleType.SCHOOL_DIRECTOR,
    RoleType.VICE_DIRECTOR,
    RoleType.COORDINATOR,
  )
  @ApiOperation({ summary: 'Verificar estado de reporte de exportación' })
  @ApiResponse({ status: 200, type: ReportStatusDto })
  @ApiParam({ name: 'reportId', type: 'string' })
  async getExportStatus(@Param('reportId') reportId: string): Promise<ReportStatusDto> {
    return this.analyticsService.getReportStatus(reportId);
  }

  @Get('export/:reportId/download')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.MINERD_ANALYST,
    RoleType.REGIONAL_DIRECTOR,
    RoleType.DISTRICT_DIRECTOR,
    RoleType.SCHOOL_DIRECTOR,
    RoleType.VICE_DIRECTOR,
    RoleType.COORDINATOR,
  )
  @ApiOperation({ summary: 'Descargar reporte generado' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @HttpCode(HttpStatus.OK)
  async downloadReport(@Param('reportId') reportId: string) {
    const status = await this.analyticsService.getReportStatus(reportId);
    if (status.status !== 'COMPLETED' || !status.downloadUrl) {
      throw new Error('Reporte no disponible para descarga');
    }
    // In real implementation, this would stream the file
    return { downloadUrl: status.downloadUrl, message: 'Use the download URL to retrieve the file' };
  }

  // ==================== COMPARISON & RANKINGS ====================

  @Get('comparison/schools')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.DISTRICT_DIRECTOR)
  @ApiOperation({ summary: 'Comparativa de centros educativos' })
  @ApiQuery({ name: 'districtId', required: false, type: 'string', format: 'uuid' })
  async compareSchools(
    @CurrentTenant() tenantId: string,
    @Query('districtId') districtId?: string,
  ) {
    const targetTenantId = districtId || tenantId;
    const dashboard = await this.analyticsService.getDistrictDashboard(targetTenantId);
    return dashboard.schoolComparison;
  }

  @Get('comparison/teachers')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR)
  @ApiOperation({ summary: 'Comparativa de docentes' })
  async compareTeachers(@CurrentTenant() tenantId: string) {
    return this.analyticsService.getTeacherPerformance(tenantId);
  }

  @Get('ranking/districts')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR)
  @ApiOperation({ summary: 'Ranking de distritos' })
  @ApiQuery({ name: 'regionalId', required: false, type: 'string', format: 'uuid' })
  async getDistrictRanking(
    @CurrentTenant() tenantId: string,
    @Query('regionalId') regionalId?: string,
  ) {
    const targetId = regionalId || tenantId;
    return this.analyticsService.getDistrictRanking(targetId);
  }

  @Get('ranking/schools')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.DISTRICT_DIRECTOR)
  @ApiOperation({ summary: 'Ranking de centros educativos' })
  @ApiQuery({ name: 'districtId', required: false, type: 'string', format: 'uuid' })
  async getSchoolRanking(
    @CurrentTenant() tenantId: string,
    @Query('districtId') districtId?: string,
  ) {
    const targetId = districtId || tenantId;
    return this.analyticsService.getSchoolRanking(targetId);
  }

  // ==================== ALERTS SUMMARY ====================

  @Get('alerts/summary')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.MINERD_ANALYST,
    RoleType.REGIONAL_DIRECTOR,
    RoleType.DISTRICT_DIRECTOR,
    RoleType.SCHOOL_DIRECTOR,
    RoleType.VICE_DIRECTOR,
    RoleType.COORDINATOR,
    RoleType.COUNSELOR,
    RoleType.PSYCHOLOGIST,
  )
  @ApiOperation({ summary: 'Resumen de alertas de riesgo' })
  async getAlertsSummary(@CurrentTenant() tenantId: string) {
    const dashboard = await this.analyticsService.getDashboard(tenantId);
    return dashboard.alertsSummary;
  }

  // ==================== RECENT ACTIVITY ====================

  @Get('activity/recent')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.MINERD_ANALYST,
    RoleType.REGIONAL_DIRECTOR,
    RoleType.DISTRICT_DIRECTOR,
    RoleType.SCHOOL_DIRECTOR,
    RoleType.VICE_DIRECTOR,
    RoleType.COORDINATOR,
  )
  @ApiOperation({ summary: 'Actividad reciente del sistema' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  async getRecentActivity(
    @CurrentTenant() tenantId: string,
    @Query('limit') limit?: number,
  ) {
    const dashboard = await this.analyticsService.getDashboard(tenantId);
    return dashboard.recentActivity.slice(0, limit || 20);
  }
}