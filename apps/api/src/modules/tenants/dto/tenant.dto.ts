import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID, IsBoolean } from 'class-validator';
import { TenantType } from '@prisma/client';

export class CreateTenantDto {
  @ApiProperty({ example: 'DIST-01-01' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Distrito 01-01' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: TenantType, example: TenantType.DISTRICT })
  @IsEnum(TenantType)
  type: TenantType;

  @ApiPropertyOptional({ example: '11111111-1111-1111-1111-111111111101' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ example: { description: 'Distrito educativo' } })
  @IsOptional()
  settings?: Record<string, unknown>;
}

export class UpdateTenantDto {
  @ApiPropertyOptional({ example: 'Distrito 01-01 Actualizado' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: { description: 'Distrito educativo actualizado' } })
  @IsOptional()
  settings?: Record<string, unknown>;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class TenantResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: TenantType })
  type: TenantType;

  @ApiProperty()
  parentId: string | null;

  @ApiProperty()
  settings: Record<string, unknown>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class TenantTreeDto extends TenantResponseDto {
  @ApiProperty({ type: () => [TenantTreeDto] })
  children: TenantTreeDto[];
}