import { Controller, Post, Body, Res, StreamableFile, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleType } from '@sigrade/shared-prisma';
import { ExportService } from './export.service';
import { ExportDto } from './dto/export.dto';

@ApiTags('Exportar')
@ApiBearerAuth()
@Controller('export')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('csv')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.DISTRICT_DIRECTOR, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Exportar a CSV' })
  exportCsv(@Body() body: ExportDto, @Res({ passthrough: true }) res: Response): StreamableFile {
    const { data, filename } = body;
    const result = this.exportService.toCsv(data, filename);
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${result.filename}"`,
    });
    return result.stream;
  }

  @Post('xlsx')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.DISTRICT_DIRECTOR, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Exportar a Excel (XLSX)' })
  async exportXlsx(@Body() body: ExportDto, @Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    const { data, filename } = body;
    const result = await this.exportService.toXlsx(data, filename);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${result.filename}"`,
    });
    return result.stream;
  }

  @Post('pdf')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.DISTRICT_DIRECTOR, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.COORDINATOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Exportar a PDF' })
  async exportPdf(@Body() body: ExportDto, @Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    const { data, filename } = body;
    const result = await this.exportService.toPdf(data, filename);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${result.filename}"`,
    });
    return result.stream;
  }
}
