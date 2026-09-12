import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum, IsDateString, IsArray, IsInt, Min, Max, IsBoolean, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { PlanningStatus } from '@prisma/client';

export class CreatePlanningDto {
  @ApiProperty({ example: 'uuid-teacher' })
  @IsUUID()
  teacherId: string;

  @ApiProperty({ example: 'uuid-course-subject' })
  @IsUUID()
  courseSubjectId: string;

  @ApiProperty({ example: 'uuid-period' })
  @IsUUID()
  periodId: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  unitNumber: number;

  @ApiProperty({ example: 'Unidad 1: Números Naturales' })
  @IsString()
  @IsNotEmpty()
  unitTitle: string;

  @ApiProperty({ type: [String], example: ['Competencia 1', 'Competencia 2'] })
  @IsArray()
  @IsString({ each: true })
  competencies: string[];

  @ApiProperty({ type: [String], example: ['Objetivo 1', 'Objetivo 2'] })
  @IsArray()
  @IsString({ each: true })
  objectives: string[];

  @ApiProperty({ example: 'Contenido de la unidad...' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: 'Metodología activa, trabajo colaborativo' })
  @IsString()
  @IsNotEmpty()
  methodology: string;

  @ApiProperty({ type: [String], example: ['Libro de texto', 'Pizarra digital'] })
  @IsArray()
  @IsString({ each: true })
  resources: string[];

  @ApiProperty({ example: 'Evaluación formativa y sumativa' })
  @IsString()
  @IsNotEmpty()
  assessment: string;

  @ApiProperty({ example: '2024-09-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-09-30' })
  @IsDateString()
  endDate: string;
}

export class UpdatePlanningDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  unitNumber?: number;

  @ApiPropertyOptional({ example: 'Unidad 1: Números Naturales Actualizada' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  unitTitle?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  competencies?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objectives?: string[];

  @ApiPropertyOptional({ example: 'Contenido actualizado...' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: 'Metodología actualizada' })
  @IsOptional()
  @IsString()
  methodology?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  resources?: string[];

  @ApiPropertyOptional({ example: 'Evaluación actualizada' })
  @IsOptional()
  @IsString()
  assessment?: string;

  @ApiPropertyOptional({ example: '2024-09-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-09-30' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: PlanningStatus, example: PlanningStatus.SUBMITTED })
  @IsOptional()
  @IsEnum(PlanningStatus)
  status?: PlanningStatus;
}

export class CreatePlanningSessionDto {
  @ApiProperty({ example: 'uuid-planning' })
  @IsUUID()
  planningId: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  sessionNumber: number;

  @ApiProperty({ example: '2024-09-02T08:00:00Z' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'Introducción a los números naturales' })
  @IsString()
  @IsNotEmpty()
  topic: string;

  @ApiProperty({ example: { inicio: 'Saludo y repaso', desarrollo: 'Actividad grupal', cierre: 'Resumen' } })
  @IsObject()
  activities: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'Ejercicios 1-5 página 12' })
  @IsOptional()
  @IsString()
  homework?: string;

  @ApiPropertyOptional({ type: [String], example: ['Fichas', 'Proyector'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  resources?: string[];
}

export class UpdatePlanningSessionDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  sessionNumber?: number;

  @ApiPropertyOptional({ example: '2024-09-02T08:00:00Z' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: 'Tema actualizado' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  topic?: string;

  @ApiPropertyOptional({ example: { inicio: 'Saludo y repaso', desarrollo: 'Actividad grupal', cierre: 'Resumen' } })
  @IsOptional()
  @IsObject()
  activities?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'Tarea actualizada' })
  @IsOptional()
  @IsString()
  homework?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  resources?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  executed?: boolean;

  @ApiPropertyOptional({ example: '2024-09-02T09:30:00Z' })
  @IsOptional()
  @IsDateString()
  executedAt?: string;

  @ApiPropertyOptional({ example: 'Sesión completada con éxito' })
  @IsOptional()
  @IsString()
  observations?: string;
}

export class ExecuteSessionDto {
  @ApiProperty({ example: 'uuid-session' })
  @IsUUID()
  sessionId: string;

  @ApiPropertyOptional({ example: '2024-09-02T09:30:00Z' })
  @IsOptional()
  @IsDateString()
  executedAt?: string;

  @ApiPropertyOptional({ example: 'Sesión ejecutada según planificación, alumnos participativos' })
  @IsOptional()
  @IsString()
  observations?: string;
}

export class AiAssistPlanningDto {
  @ApiProperty({ example: 'uuid-planning' })
  @IsUUID()
  planningId: string;

  @ApiProperty({ example: 'Generar planificación para unidad de fracciones según currículo MINERD' })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiPropertyOptional({ example: 'uuid-course-subject' })
  @IsOptional()
  @IsUUID()
  courseSubjectId?: string;

  @ApiPropertyOptional({ example: 'uuid-period' })
  @IsOptional()
  @IsUUID()
  periodId?: string;
}

export class PlanningQueryDto {
  @ApiPropertyOptional({ example: 'uuid-teacher' })
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @ApiPropertyOptional({ example: 'uuid-course-subject' })
  @IsOptional()
  @IsUUID()
  courseSubjectId?: string;

  @ApiPropertyOptional({ example: 'uuid-period' })
  @IsOptional()
  @IsUUID()
  periodId?: string;

  @ApiPropertyOptional({ enum: PlanningStatus, example: PlanningStatus.DRAFT })
  @IsOptional()
  @IsEnum(PlanningStatus)
  status?: PlanningStatus;

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

export class PlanningSessionQueryDto {
  @ApiPropertyOptional({ example: 'uuid-planning' })
  @IsOptional()
  @IsUUID()
  planningId?: string;

  @ApiPropertyOptional({ example: '2024-09-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-09-30' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  executed?: boolean;

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