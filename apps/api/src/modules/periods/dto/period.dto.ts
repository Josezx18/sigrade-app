import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsBoolean, IsInt, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePeriodDto {
  @ApiProperty({ example: 'Primer Trimestre' })
  @IsString()
  name: string;

  @ApiProperty({ example: '2024-T1' })
  @IsString()
  code: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  ordinal: number;

  @ApiProperty()
  @IsUUID()
  schoolYearId: string;

  @ApiProperty({ example: '2024-08-15T00:00:00Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-12-20T00:00:00Z' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  order?: number;
}

export class UpdatePeriodDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  schoolYearId?: string;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  order?: number;
}

export class PeriodQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  schoolYearId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

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
