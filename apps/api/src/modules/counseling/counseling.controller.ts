import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import { CounselingService } from './counseling.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RoleType } from '@sigrade/shared-prisma';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  RiskAlertQueryDto,
  CreateRiskAlertDto,
  UpdateRiskAlertDto,
  CounselingCaseQueryDto,
  CreateCounselingCaseDto,
  UpdateCounselingCaseDto,
  CreateCounselingNoteDto,
  CreateInterventionDto,
} from './dto/counseling.dto';

interface AuthUser {
  id: string;
}

@ApiTags('Counseling - Orientación y Psicología')
@ApiBearerAuth()
@Controller('counseling')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CounselingController {
  constructor(private readonly counselingService: CounselingService) {}

  // ==================== RISK ALERTS ====================

  @Get('risk-alerts')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.MINERD_ANALYST,
    RoleType.REGIONAL_DIRECTOR,
    RoleType.DISTRICT_DIRECTOR,
    RoleType.SCHOOL_DIRECTOR,
    RoleType.VICE_DIRECTOR,
    RoleType.COUNSELOR,
    RoleType.PSYCHOLOGIST,
    RoleType.COORDINATOR,
  )
  @ApiOperation({ summary: 'Listar alertas de riesgo con filtros' })
  async getRiskAlerts(@Query() filters: RiskAlertQueryDto, @CurrentTenant() tenantId: string) {
    return this.counselingService.getRiskAlerts(filters, tenantId);
  }

  @Get('risk-alerts/dashboard')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.MINERD_ANALYST,
    RoleType.REGIONAL_DIRECTOR,
    RoleType.DISTRICT_DIRECTOR,
    RoleType.SCHOOL_DIRECTOR,
    RoleType.VICE_DIRECTOR,
    RoleType.COUNSELOR,
    RoleType.PSYCHOLOGIST,
  )
  @ApiOperation({ summary: 'Dashboard de alertas de riesgo' })
  async getRiskDashboard(@CurrentTenant() tenantId: string) {
    return this.counselingService.getRiskDashboard(tenantId);
  }

  @Post('risk-alerts')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.MINERD_ANALYST,
    RoleType.SCHOOL_DIRECTOR,
    RoleType.VICE_DIRECTOR,
    RoleType.COUNSELOR,
    RoleType.PSYCHOLOGIST,
  )
  @ApiOperation({ summary: 'Crear alerta de riesgo' })
  async createRiskAlert(@Body() dto: CreateRiskAlertDto, @CurrentTenant() tenantId: string) {
    return this.counselingService.createRiskAlert(dto, tenantId);
  }

  @Put('risk-alerts/:id')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.MINERD_ANALYST,
    RoleType.SCHOOL_DIRECTOR,
    RoleType.VICE_DIRECTOR,
    RoleType.COUNSELOR,
    RoleType.PSYCHOLOGIST,
  )
  @ApiOperation({ summary: 'Actualizar alerta de riesgo' })
  async updateRiskAlert(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRiskAlertDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.counselingService.updateRiskAlert(id, dto, tenantId);
  }

  @Get('risk-alerts/:id')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.MINERD_ANALYST,
    RoleType.REGIONAL_DIRECTOR,
    RoleType.DISTRICT_DIRECTOR,
    RoleType.SCHOOL_DIRECTOR,
    RoleType.VICE_DIRECTOR,
    RoleType.COUNSELOR,
    RoleType.PSYCHOLOGIST,
    RoleType.COORDINATOR,
  )
  @ApiOperation({ summary: 'Obtener alerta por ID' })
  async getRiskAlertById(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.counselingService.getRiskAlertById(id, tenantId);
  }

  @Delete('risk-alerts/:id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST)
  @ApiOperation({ summary: 'Eliminar alerta de riesgo' })
  @HttpCode(HttpStatus.OK)
  async deleteRiskAlert(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.counselingService.deleteRiskAlert(id, tenantId);
  }

  // ==================== CASES ====================

  @Get('cases')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.MINERD_ANALYST,
    RoleType.SCHOOL_DIRECTOR,
    RoleType.VICE_DIRECTOR,
    RoleType.COUNSELOR,
    RoleType.PSYCHOLOGIST,
    RoleType.COORDINATOR,
  )
  @ApiOperation({ summary: 'Listar casos de consejería' })
  async getCases(@Query() filters: CounselingCaseQueryDto, @CurrentTenant() tenantId: string) {
    return this.counselingService.getCases(filters, tenantId);
  }

  @Get('cases/:id')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.MINERD_ANALYST,
    RoleType.SCHOOL_DIRECTOR,
    RoleType.VICE_DIRECTOR,
    RoleType.COUNSELOR,
    RoleType.PSYCHOLOGIST,
  )
  @ApiOperation({ summary: 'Obtener caso por ID' })
  async getCaseById(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.counselingService.getCaseById(id, tenantId);
  }

  @Post('cases')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.COUNSELOR,
    RoleType.PSYCHOLOGIST,
  )
  @ApiOperation({ summary: 'Crear caso de consejería' })
  async createCase(@Body() dto: CreateCounselingCaseDto, @CurrentTenant() tenantId: string) {
    return this.counselingService.createCase(dto, tenantId);
  }

  @Put('cases/:id')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.COUNSELOR,
    RoleType.PSYCHOLOGIST,
  )
  @ApiOperation({ summary: 'Actualizar caso de consejería' })
  async updateCase(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCounselingCaseDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.counselingService.updateCase(id, dto, tenantId);
  }

  @Delete('cases/:id')
  @Roles(RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Eliminar caso de consejería' })
  @HttpCode(HttpStatus.OK)
  async deleteCase(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.counselingService.deleteCase(id, tenantId);
  }

  // ==================== NOTES ====================

  @Get('cases/:caseId/notes')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.COUNSELOR,
    RoleType.PSYCHOLOGIST,
  )
  @ApiOperation({ summary: 'Obtener notas de un caso' })
  async getNotes(@Param('caseId', ParseUUIDPipe) caseId: string, @CurrentTenant() tenantId: string) {
    return this.counselingService.getNotes(caseId, tenantId);
  }

  @Post('cases/:caseId/notes')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.COUNSELOR,
    RoleType.PSYCHOLOGIST,
  )
  @ApiOperation({ summary: 'Agregar nota a un caso' })
  async createNote(
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @Body() dto: CreateCounselingNoteDto,
    @CurrentUser() user: AuthUser,
    @CurrentTenant() tenantId: string,
  ) {
    return this.counselingService.createNote(
      { ...dto, caseId },
      user.id,
      tenantId,
    );
  }

  // ==================== INTERVENTIONS ====================

  @Get('cases/:caseId/interventions')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.COUNSELOR,
    RoleType.PSYCHOLOGIST,
  )
  @ApiOperation({ summary: 'Obtener intervenciones de un caso' })
  async getInterventions(@Param('caseId', ParseUUIDPipe) caseId: string, @CurrentTenant() tenantId: string) {
    return this.counselingService.getInterventions(caseId, tenantId);
  }

  @Post('cases/:caseId/interventions')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.COUNSELOR,
    RoleType.PSYCHOLOGIST,
  )
  @ApiOperation({ summary: 'Crear intervención para un caso' })
  async createIntervention(
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @Body() dto: CreateInterventionDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.counselingService.createIntervention(
      { ...dto, caseId },
      tenantId,
    );
  }

  // ==================== STATISTICS ====================

  @Get('stats')
  @Roles(
    RoleType.SUPER_ADMIN,
    RoleType.MINERD_ANALYST,
    RoleType.REGIONAL_DIRECTOR,
    RoleType.DISTRICT_DIRECTOR,
    RoleType.SCHOOL_DIRECTOR,
    RoleType.VICE_DIRECTOR,
    RoleType.COUNSELOR,
    RoleType.PSYCHOLOGIST,
  )
  @ApiOperation({ summary: 'Estadísticas de consejería' })
  async getStats(@CurrentTenant() tenantId: string) {
    return this.counselingService.getStats(tenantId);
  }
}