import { IsEnum, IsOptional, IsString, IsUUID, IsDate, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditAction } from '@sigrade/shared-prisma';

export class CreateAuditLogDto {
  @ApiProperty()
  @IsUUID()
  tenantId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty()
  @IsString()
  action: string;

  @ApiProperty()
  @IsString()
  entityType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  oldData?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  newData?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class AuditLogFiltersDto {
  @ApiPropertyOptional({ enum: AuditAction })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateFrom?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateTo?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500)
  limit?: number = 50;

  @ApiPropertyOptional({ enum: ['createdAt', 'action', 'entityType'], default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class AuditLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  tenant?: {
    id: string;
    code: string;
    name: string;
    type: string;
  };

  @ApiPropertyOptional()
  userId?: string;

  @ApiPropertyOptional()
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    dni: string;
  };

  @ApiProperty({ enum: AuditAction })
  action: AuditAction;

  @ApiProperty()
  entityType: string;

  @ApiProperty()
  entityId: string;

  @ApiPropertyOptional()
  oldData?: Record<string, unknown>;

  @ApiPropertyOptional()
  newData?: Record<string, unknown>;

  @ApiPropertyOptional()
  ipAddress?: string;

  @ApiPropertyOptional()
  userAgent?: string;

  @ApiProperty()
  createdAt: Date;
}

export class AuditStatsDto {
  @ApiProperty()
  totalLogs: number;

  @ApiProperty({ type: [Object] })
  logsByAction: { action: AuditAction; count: number }[];

  @ApiProperty({ type: [Object] })
  logsByEntityType: { entityType: string; count: number }[];

  @ApiProperty({ type: [Object] })
  logsByUser: { userId: string; userName: string; count: number }[];

  @ApiProperty({ type: [Object] })
  logsByTenant: { tenantId: string; tenantName: string; count: number }[];

  @ApiProperty({ type: [Object] })
  logsByDate: { date: Date; count: number }[];

  @ApiProperty({ type: [Object] })
  topEntitiesModified: { entityType: string; entityId: string; count: number }[];

  @ApiProperty({ type: [Object] })
  recentCriticalActions: AuditLogResponseDto[];
}

export class ExportAuditRequestDto {
  @ApiProperty({ enum: ['PDF', 'EXCEL', 'CSV'] })
  @IsEnum(['PDF', 'EXCEL', 'CSV'])
  format: 'PDF' | 'EXCEL' | 'CSV';

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ enum: AuditAction })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateFrom?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateTo?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeDataChanges?: boolean = true;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;
}

export class ExportAuditResponseDto {
  @ApiProperty()
  exportId: string;

  @ApiProperty()
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

  @ApiPropertyOptional()
  downloadUrl?: string;

  @ApiPropertyOptional()
  expiresAt?: Date;

  @ApiProperty()
  createdAt: Date;
}

export class ExportAuditStatusDto {
  @ApiProperty()
  exportId: string;

  @ApiProperty()
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

  @ApiProperty()
  progress: number;

  @ApiPropertyOptional()
  downloadUrl?: string;

  @ApiPropertyOptional()
  error?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  completedAt?: Date;
}

export class EntityHistoryDto {
  @ApiProperty()
  entityType: string;

  @ApiProperty()
  entityId: string;

  @ApiProperty({ type: [AuditLogResponseDto] })
  history: AuditLogResponseDto[];

  @ApiProperty()
  totalChanges: number;

  @ApiProperty()
  firstChange: Date;

  @ApiProperty()
  lastChange: Date;

  @ApiProperty({ type: [Object] })
  usersInvolved: { userId: string; userName: string; changesCount: number }[];
}

export class AuditIntegrityCheckDto {
  @ApiProperty()
  isValid: boolean;

  @ApiProperty()
  checkedAt: Date;

  @ApiProperty()
  totalLogsChecked: number;

  @ApiProperty({ type: [Object] })
  issues: {
    type: 'MISSING_HASH' | 'HASH_MISMATCH' | 'SEQUENCE_GAP' | 'ORPHAN_LOG';
    logId: string;
    details: string;
  }[];

  @ApiProperty()
  lastVerifiedLogId?: string;
}

export class UserActivityReportDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  userName: string;

  @ApiProperty()
  userEmail: string;

  @ApiProperty()
  period: { from: Date; to: Date };

  @ApiProperty()
  totalActions: number;

  @ApiProperty({ type: [Object] })
  actionsBreakdown: { action: AuditAction; count: number }[];

  @ApiProperty({ type: [Object] })
  entitiesAccessed: { entityType: string; count: number }[];

  @ApiProperty({ type: [Object] })
  dailyActivity: { date: Date; count: number }[];

  @ApiProperty({ type: [Object] })
  mostActiveHours: { hour: number; count: number }[];

  @ApiProperty({ type: [AuditLogResponseDto] })
  recentActions: AuditLogResponseDto[];
}

export class SecurityAuditDto {
  @ApiProperty()
  period: { from: Date; to: Date };

  @ApiProperty({ type: [Object] })
  failedLogins: { userId?: string; email?: string; ipAddress: string; count: number; lastAttempt: Date }[];

  @ApiProperty({ type: [Object] })
  suspiciousActivity: {
    type: 'MULTIPLE_FAILED_LOGINS' | 'UNUSUAL_HOURS' | 'MULTIPLE_IPS' | 'MASS_EXPORT' | 'PRIVILEGE_ESCALATION';
    userId: string;
    userName: string;
    details: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    timestamp: Date;
  }[];

  @ApiProperty({ type: [Object] })
  permissionChanges: {
    userId: string;
    userName: string;
    changedBy: string;
    oldRoles: string[];
    newRoles: string[];
    timestamp: Date;
  }[];

  @ApiProperty({ type: [Object] })
  dataExports: {
    userId: string;
    userName: string;
    exportType: string;
    recordsCount: number;
    timestamp: Date;
  }[];
}