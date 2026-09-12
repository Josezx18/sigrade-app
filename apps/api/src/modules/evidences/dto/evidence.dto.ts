import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsNumber, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEvidenceDto {
  @ApiProperty()
  @IsUUID()
  activityId: string;

  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty({ example: 'tarea-final.pdf' })
  @IsString()
  fileName: string;

  @ApiProperty({ example: 204800 })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  fileSize: number;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  mimeType: string;

  @ApiProperty({ example: 'https://storage.example.com/evidences/file.pdf' })
  @IsString()
  url: string;

  @ApiPropertyOptional({ example: 'Tarea final del módulo 3' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateEvidenceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  fileSize?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class GradeEvidenceDto {
  @ApiProperty({ example: 85 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  score: number;

  @ApiPropertyOptional({ example: 'Buen trabajo, revisar los pasos 3 y 4' })
  @IsOptional()
  @IsString()
  feedback?: string;

  @ApiProperty()
  @IsUUID()
  gradedById: string;
}
