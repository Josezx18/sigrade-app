import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum, IsDateString, IsArray, ValidateNested, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '@prisma/client';

export class CreateAttendanceDto {
  @ApiProperty({ example: 'uuid-student' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ example: 'uuid-course-subject' })
  @IsOptional()
  @IsUUID()
  courseSubjectId?: string;

  @ApiPropertyOptional({ example: 'uuid-course' })
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional({ example: 'uuid-subject' })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiProperty({ example: '2024-09-15T08:00:00Z' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  @Type(() => Number)
  hour?: number;

  @ApiProperty({ enum: AttendanceStatus, example: AttendanceStatus.PRESENT })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiPropertyOptional({ example: '2024-09-15T08:05:00Z' })
  @IsOptional()
  @IsDateString()
  checkInTime?: string;

  @ApiPropertyOptional({ example: '2024-09-15T14:00:00Z' })
  @IsOptional()
  @IsDateString()
  checkOutTime?: string;

  @ApiPropertyOptional({ example: 'Cita médica' })
  @IsOptional()
  @IsString()
  justification?: string;
}

export class UpdateAttendanceDto {
  @ApiPropertyOptional({ enum: AttendanceStatus, example: AttendanceStatus.JUSTIFIED })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiPropertyOptional({ example: '2024-09-15T08:05:00Z' })
  @IsOptional()
  @IsDateString()
  checkInTime?: string;

  @ApiPropertyOptional({ example: '2024-09-15T14:00:00Z' })
  @IsOptional()
  @IsDateString()
  checkOutTime?: string;

  @ApiPropertyOptional({ example: 'Justificativo médico adjunto' })
  @IsOptional()
  @IsString()
  justification?: string;
}

export class BulkAttendanceItemDto {
  @ApiProperty({ example: 'uuid-student' })
  @IsUUID()
  studentId: string;

  @ApiPropertyOptional({ example: 'uuid-course' })
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional({ example: 'uuid-subject' })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiProperty({ enum: AttendanceStatus, example: AttendanceStatus.PRESENT })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  @Type(() => Number)
  hour?: number;

  @ApiPropertyOptional({ example: '2024-09-15T08:05:00Z' })
  @IsOptional()
  @IsDateString()
  checkInTime?: string;

  @ApiPropertyOptional({ example: '2024-09-15T14:00:00Z' })
  @IsOptional()
  @IsDateString()
  checkOutTime?: string;

  @ApiPropertyOptional({ example: 'Cita médica' })
  @IsOptional()
  @IsString()
  justification?: string;
}

export class BulkCreateAttendanceDto {
  @ApiProperty({ example: 'uuid-course-subject' })
  @IsOptional()
  @IsUUID()
  courseSubjectId?: string;

  @ApiProperty({ example: 'uuid-course' })
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiProperty({ example: '2024-09-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ type: [BulkAttendanceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkAttendanceItemDto)
  attendances: BulkAttendanceItemDto[];
}

export class QrAttendanceDto {
  @ApiProperty({ example: 'uuid-course-subject' })
  @IsUUID()
  courseSubjectId: string;

  @ApiProperty({ example: 'uuid-student' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ example: '2024-09-15T08:00:00Z' })
  @IsDateString()
  timestamp: string;

  @ApiProperty({ example: 'qr-code-hash-123' })
  @IsString()
  @IsNotEmpty()
  qrCode: string;
}

export class JustificationDto {
  @ApiProperty({ example: 'uuid-attendance' })
  @IsUUID()
  attendanceId: string;

  @ApiProperty({ example: 'Enfermedad - certificado médico adjunto' })
  @IsString()
  @IsNotEmpty()
  justification: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @IsOptional()
  evidenceFile?: unknown;
}

export class MonthlyReportQueryDto {
  @ApiProperty({ example: 'uuid-course' })
  @IsUUID()
  courseId: string;

  @ApiProperty({ example: 2024 })
  @IsInt()
  @Min(2020)
  @Max(2030)
  @Type(() => Number)
  year: number;

  @ApiProperty({ example: 9 })
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month: number;

  @ApiPropertyOptional({ example: 'uuid-student' })
  @IsOptional()
  @IsUUID()
  studentId?: string;
}

export class AttendanceQueryDto {
  @ApiPropertyOptional({ example: 'uuid-student' })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ example: 'uuid-course-subject' })
  @IsOptional()
  @IsUUID()
  courseSubjectId?: string;

  @ApiPropertyOptional({ example: 'uuid-course' })
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional({ example: 'uuid-subject' })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional({ example: '2024-09-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-09-30' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: '2024-09-01' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2024-09-30' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ example: '2024-09-15' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ enum: AttendanceStatus, example: AttendanceStatus.PRESENT })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}

export class StudentAttendanceSummaryDto {
  @ApiProperty()
  studentId: string;

  @ApiProperty()
  studentCode: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  totalClasses: number;

  @ApiProperty()
  present: number;

  @ApiProperty()
  absent: number;

  @ApiProperty()
  late: number;

  @ApiProperty()
  justified: number;

  @ApiProperty()
  earlyLeave: number;

  @ApiProperty()
  attendanceRate: number;

  @ApiProperty()
  attendances: Array<{
    id: string;
    date: Date;
    status: AttendanceStatus;
    checkInTime?: Date;
    checkOutTime?: Date;
    justification?: string;
  }>;
}

export class MonthlyAttendanceReportDto {
  @ApiProperty()
  courseId: string;

  @ApiProperty()
  courseName: string;

  @ApiProperty()
  gradeLevel: string;

  @ApiProperty()
  year: number;

  @ApiProperty()
  month: number;

  @ApiProperty()
  totalSchoolDays: number;

  @ApiProperty()
  students: StudentAttendanceSummaryDto[];

  @ApiProperty()
  summary: {
    totalStudents: number;
    averageAttendanceRate: number;
    totalAbsences: number;
    totalJustified: number;
    criticalCases: Array<{ studentId: string; studentName: string; attendanceRate: number }>;
  };
}

export class AttendanceStatisticsDto {
  @ApiProperty()
  totalRecords: number;

  @ApiProperty()
  byStatus: Record<AttendanceStatus, number>;

  @ApiProperty()
  attendanceRate: number;

  @ApiProperty()
  byStudent: Array<{ studentId: string; studentName: string; rate: number }>;

  @ApiProperty()
  byDate: Array<{ date: string; present: number; absent: number; rate: number }>;
}