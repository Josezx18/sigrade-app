import { IsOptional, IsString, IsUUID, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AiAssistPlanningAiDto {
  @ApiProperty()
  @IsString()
  prompt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  gradeLevelId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tenantId?: string;
}

export class GradingAssistDto {
  @ApiProperty()
  @IsString()
  rubric: string;

  @ApiProperty()
  @IsString()
  studentResponse: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxScore: number;
}

export class PredictRiskDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty()
  @IsUUID()
  periodId: string;
}
