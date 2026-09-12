import { IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExportDto {
  @ApiProperty({ description: 'Datos a exportar como arreglo de objetos' })
  @IsArray()
  data: Record<string, unknown>[];

  @ApiPropertyOptional({ description: 'Nombre del archivo de exportación' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  filename?: string;
}
