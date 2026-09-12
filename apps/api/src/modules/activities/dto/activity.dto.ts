import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsEnum, IsNumber, IsBoolean, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { GradeType } from '@prisma/client';

export class CreateActivityDto {
  @ApiProperty({ example: 'Examen Parcial 1' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Examen de matemáticas sobre álgebra' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: GradeType, default: GradeType.HOMEWORK })
  @IsOptional()
  @IsEnum(GradeType)
  type?: GradeType;

  @ApiPropertyOptional({ default: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxScore?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  weight?: number;

  @ApiProperty()
  @IsUUID()
  courseSubjectId: string;

  @ApiProperty()
  @IsUUID()
  periodId: string;

  @ApiProperty()
  @IsUUID()
  teacherId: string;

  @ApiPropertyOptional({ example: '2024-10-15T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ example: 'Resuelve los ejercicios 1-10 del libro' })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateActivityDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(GradeType)
  type?: GradeType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  courseSubjectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  periodId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class ActivityQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  courseSubjectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  periodId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @ApiPropertyOptional({ enum: GradeType })
  @IsOptional()
  @IsEnum(GradeType)
  type?: GradeType;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 25 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 25;
}
