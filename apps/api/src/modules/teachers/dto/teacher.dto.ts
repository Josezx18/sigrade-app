import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsEnum, IsDateString, IsInt, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ContractType } from '@prisma/client';

export class CreateTeacherDto {
  @ApiProperty({ example: 'uuid-user' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: '2024-TCH-001' })
  @IsString()
  employeeCode: string;

  @ApiPropertyOptional({ example: 'Licenciatura en Matemáticas' })
  @IsOptional()
  @IsString()
  degree?: string;

  @ApiPropertyOptional({ example: 'Matemática Educativa' })
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiProperty({ example: '2024-08-15' })
  @IsDateString()
  hireDate: string;

  @ApiProperty({ enum: ContractType, example: ContractType.NOMBRADO })
  @IsEnum(ContractType)
  contractType: ContractType;

  @ApiPropertyOptional({ example: 'uuid-tenant' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}

export class UpdateTeacherDto {
  @ApiPropertyOptional({ example: 'uuid-user' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ example: '2024-TCH-001' })
  @IsOptional()
  @IsString()
  employeeCode?: string;

  @ApiPropertyOptional({ example: 'Licenciatura en Matemáticas' })
  @IsOptional()
  @IsString()
  degree?: string;

  @ApiPropertyOptional({ example: 'Matemática Educativa' })
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiPropertyOptional({ example: '2024-08-15' })
  @IsOptional()
  @IsDateString()
  hireDate?: string;

  @ApiPropertyOptional({ enum: ContractType, example: ContractType.CONTRATADO })
  @IsOptional()
  @IsEnum(ContractType)
  contractType?: ContractType;

  @ApiPropertyOptional({ example: 'uuid-tenant' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}

export class TeacherQueryDto {
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

  @ApiPropertyOptional({ example: 'Juan' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ContractType, example: ContractType.NOMBRADO })
  @IsOptional()
  @IsEnum(ContractType)
  contractType?: ContractType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialization?: string;
}

export class UserBriefDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;
}

export class TeacherResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  employeeCode: string;

  @ApiPropertyOptional()
  degree?: string;

  @ApiPropertyOptional()
  specialization?: string;

  @ApiProperty()
  hireDate: Date;

  @ApiProperty({ enum: ContractType })
  contractType: ContractType;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: () => UserBriefDto })
  user: UserBriefDto;
}
