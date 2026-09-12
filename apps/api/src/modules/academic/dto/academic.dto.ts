import { IsEnum, IsOptional, IsString, IsUUID, IsBoolean, IsNumber, Min, Max, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EducationLevel, SubjectArea } from '@prisma/client';

export class CreateSchoolYearDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSchoolYearDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateAcademicPeriodDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Max(6)
  ordinal: number;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;
}

export class CreateGradeLevelDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  ordinal: number;

  @ApiProperty({ enum: EducationLevel })
  @IsEnum(EducationLevel)
  educationLevel: EducationLevel;
}

export class CreateSubjectDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: EducationLevel })
  @IsEnum(EducationLevel)
  educationLevel: EducationLevel;

  @ApiProperty({ enum: SubjectArea })
  @IsEnum(SubjectArea)
  area: SubjectArea;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiresLab?: boolean;
}

export class CreateCourseDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsUUID()
  gradeLevelId: string;

  @ApiProperty()
  @IsUUID()
  schoolYearId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  tutorId?: string;
}

export class UpdateCourseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  tutorId?: string;
}

export class CreateScheduleDto {
  @ApiProperty()
  @IsUUID()
  courseId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  courseSubjectId?: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Max(7)
  dayOfWeek: number;

  @ApiProperty()
  @IsString()
  startTime: string;

  @ApiProperty()
  @IsString()
  endTime: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  classroom?: string;
}

export class AssignSubjectToCourseDto {
  @ApiProperty()
  @IsUUID()
  courseId: string;

  @ApiProperty()
  @IsUUID()
  subjectId: string;

  @ApiProperty()
  @IsUUID()
  teacherId: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  hoursWeekly: number;
}

export class UpdateAcademicPeriodDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(6)
  ordinal?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UpdateGradeLevelDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  ordinal?: number;

  @ApiPropertyOptional({ enum: EducationLevel })
  @IsOptional()
  @IsEnum(EducationLevel)
  educationLevel?: EducationLevel;
}

export class UpdateSubjectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: EducationLevel })
  @IsOptional()
  @IsEnum(EducationLevel)
  educationLevel?: EducationLevel;

  @ApiPropertyOptional({ enum: SubjectArea })
  @IsOptional()
  @IsEnum(SubjectArea)
  area?: SubjectArea;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiresLab?: boolean;
}

export class AcademicFiltersDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  schoolYearId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  gradeLevelId?: string;

  @ApiPropertyOptional({ enum: EducationLevel })
  @IsOptional()
  @IsEnum(EducationLevel)
  educationLevel?: EducationLevel;
}
