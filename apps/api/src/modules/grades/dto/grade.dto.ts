import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsNumber, IsArray, ValidateNested, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { GradeType } from '@prisma/client';

export class CreateGradeDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty()
  @IsUUID()
  subjectId: string;

  @ApiProperty()
  @IsUUID()
  periodId: string;

  @ApiProperty()
  @IsUUID()
  teacherId: string;

  @ApiProperty({ example: 85 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  value: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  weight?: number;

  @ApiPropertyOptional({ example: 'Buen desempeño' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: GradeType, default: GradeType.EXAM })
  @IsOptional()
  @IsEnum(GradeType)
  type?: GradeType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}

export class UpdateGradeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  periodId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  value?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}

export class BulkCreateGradeDto {
  @ApiProperty({ type: [CreateGradeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGradeDto)
  grades: CreateGradeDto[];
}

export class GradeQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 25;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  periodId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  teacherId?: string;
}
