import { IsEnum, IsOptional, IsString, IsUUID, IsArray, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RiskType, RiskSeverity, AlertStatus, CounselingType, CaseStatus } from '@prisma/client';

export class RiskAlertQueryDto {
  @ApiPropertyOptional({ enum: RiskType })
  @IsOptional()
  @IsEnum(RiskType)
  type?: RiskType;

  @ApiPropertyOptional({ enum: RiskSeverity })
  @IsOptional()
  @IsEnum(RiskSeverity)
  severity?: RiskSeverity;

  @ApiPropertyOptional({ enum: AlertStatus })
  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class CreateRiskAlertDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty({ enum: RiskType })
  @IsEnum(RiskType)
  type: RiskType;

  @ApiProperty({ enum: RiskSeverity })
  @IsEnum(RiskSeverity)
  severity: RiskSeverity;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  indicators?: unknown[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}

export class UpdateRiskAlertDto {
  @ApiPropertyOptional({ enum: RiskSeverity })
  @IsOptional()
  @IsEnum(RiskSeverity)
  severity?: RiskSeverity;

  @ApiPropertyOptional({ enum: AlertStatus })
  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}

export class CounselingCaseQueryDto {
  @ApiPropertyOptional({ enum: CounselingType })
  @IsOptional()
  @IsEnum(CounselingType)
  type?: CounselingType;

  @ApiPropertyOptional({ enum: CaseStatus })
  @IsOptional()
  @IsEnum(CaseStatus)
  status?: CaseStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  counselorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class CreateCounselingCaseDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty()
  @IsUUID()
  counselorId: string;

  @ApiProperty({ enum: CounselingType })
  @IsEnum(CounselingType)
  type: CounselingType;
}

export class UpdateCounselingCaseDto {
  @ApiPropertyOptional({ enum: CaseStatus })
  @IsOptional()
  @IsEnum(CaseStatus)
  status?: CaseStatus;

  @ApiPropertyOptional({ enum: CounselingType })
  @IsOptional()
  @IsEnum(CounselingType)
  type?: CounselingType;
}

export class CreateCounselingNoteDto {
  @ApiProperty()
  @IsUUID()
  caseId: string;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}

export class CreateInterventionDto {
  @ApiProperty()
  @IsUUID()
  caseId: string;

  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsString()
  startDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty()
  @IsUUID()
  responsibleId: string;
}

export class UpdateInterventionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  outcome?: string;
}
