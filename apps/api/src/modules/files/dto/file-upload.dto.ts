import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class FileUploadDto {
  @ApiPropertyOptional({ description: 'ID de la calificación asociada' })
  @IsOptional()
  @IsUUID()
  gradeId?: string;

  @ApiPropertyOptional({ description: 'ID de la sesión asociada' })
  @IsOptional()
  @IsUUID()
  sessionId?: string;
}