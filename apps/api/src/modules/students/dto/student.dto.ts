import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsEnum, IsDateString, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { Gender } from '@prisma/client';

export class CreateStudentDto {
  @ApiProperty({ example: 'Juan' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: '2024-STU-001' })
  @IsString()
  studentCode: string;

  @ApiProperty({ example: '2010-05-15' })
  @IsDateString()
  birthDate: string;

  @ApiProperty({ enum: Gender, example: Gender.M })
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional({ example: '809-555-0100' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Calle Principal #123' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Juan Pérez' })
  @IsOptional()
  @IsString()
  parentName?: string;

  @ApiPropertyOptional({ example: '809-555-0100' })
  @IsOptional()
  @IsString()
  parentPhone?: string;

  @ApiPropertyOptional({ example: 'juan@example.com' })
  @IsOptional()
  @IsString()
  parentEmail?: string;

  @ApiProperty({ example: 'uuid-tenant' })
  @IsUUID()
  tenantId: string;
}

export class UpdateStudentDto {
  @ApiPropertyOptional({ example: 'Juan' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Pérez' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: '2024-STU-001' })
  @IsOptional()
  @IsString()
  studentCode?: string;

  @ApiPropertyOptional({ example: '2010-05-15' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ enum: Gender, example: Gender.M })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: '809-555-0100' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Calle Principal #123' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Juan Pérez' })
  @IsOptional()
  @IsString()
  parentName?: string;

  @ApiPropertyOptional({ example: '809-555-0100' })
  @IsOptional()
  @IsString()
  parentPhone?: string;

  @ApiPropertyOptional({ example: 'juan@example.com' })
  @IsOptional()
  @IsString()
  parentEmail?: string;

  @ApiPropertyOptional({ example: 'uuid-tenant' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}

export class StudentQueryDto {
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

  @ApiPropertyOptional({ example: 'uuid-grade' })
  @IsOptional()
  @IsUUID()
  gradeId?: string;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'studentCode' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ example: 'asc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ enum: Gender, example: Gender.M })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
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

export class GradeBriefDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class StudentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  studentCode: string;

  @ApiProperty()
  birthDate: Date;

  @ApiProperty({ enum: Gender })
  gender: Gender;

  @ApiProperty()
  enrollmentDate: Date;

  @ApiProperty()
  gradeId: string;

  @ApiPropertyOptional()
  section?: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  parentName?: string;

  @ApiPropertyOptional()
  parentPhone?: string;

  @ApiPropertyOptional()
  parentEmail?: string;

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

  @ApiProperty({ type: () => GradeBriefDto })
  grade: GradeBriefDto;
}
