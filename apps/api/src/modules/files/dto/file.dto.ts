import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsInt, Min, Max, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFileDto {
  @ApiProperty({ example: 'documento.pdf' })
  @IsString()
  fileName: string;

  @ApiProperty({ example: 'documento.pdf' })
  @IsString()
  originalName: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  mimeType: string;

  @ApiProperty({ example: 1048576 })
  @IsInt()
  @Min(0)
  size: number;

  @ApiProperty()
  @IsUUID()
  tenantId: string;

  @ApiProperty()
  @IsUUID()
  uploadedById: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  gradeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  fileBuffer?: { type: string; data: number[] };
}

export class FileQueryDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  gradeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sessionId?: string;
}

export class FileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  bucket: string;

  @ApiProperty()
  objectKey: string;

  @ApiProperty()
  url?: string;

  @ApiProperty()
  uploadedById: string;

  @ApiPropertyOptional()
  gradeId?: string | null;

  @ApiPropertyOptional()
  sessionId?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
