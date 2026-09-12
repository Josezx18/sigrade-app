import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AiAssistPlanningAiDto, GradingAssistDto, PredictRiskDto } from './dto/ai.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleType } from '@sigrade/shared-prisma';

@ApiTags('IA')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('planning/generate')
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Generar planificación con IA' })
  async generatePlanning(@Body() dto: AiAssistPlanningAiDto) {
    return this.aiService.generatePlanning(dto.prompt);
  }

  @Post('grading/assist')
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Asistir en corrección con IA' })
  async assistGrading(@Body() dto: GradingAssistDto) {
    return this.aiService.assistGrading(dto);
  }

  @Post('predict/risk')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.DISTRICT_DIRECTOR, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COUNSELOR, RoleType.PSYCHOLOGIST)
  @ApiOperation({ summary: 'Predecir riesgo de estudiante' })
  async predictRisk(@Body() dto: PredictRiskDto) {
    return this.aiService.predictRisk(dto);
  }
}
