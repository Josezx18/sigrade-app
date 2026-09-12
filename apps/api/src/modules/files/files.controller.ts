import {
  Controller, Get, Post, Delete,
  Body, Param, Query, ParseUUIDPipe, UseGuards,
  UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
interface UploadedMulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { FileQueryDto } from './dto/file.dto';
import { FileUploadDto } from './dto/file-upload.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleType } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Archivos')
@ApiBearerAuth()
@Controller('files')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Subir archivo' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: UploadedMulterFile,
    @Body() dto: FileUploadDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    if (!file) throw new BadRequestException('Archivo requerido');
    return this.filesService.upload({
      fileBuffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      tenantId,
      uploadedById: userId,
      gradeId: dto.gradeId,
      sessionId: dto.sessionId,
    });
  }

  @Post('stream')
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Subir archivo (para clientes que no usan FormData)' })
  async createFromBody(@Body() input: {
    fileName: string;
    mimeType: string;
    fileBuffer: { type: string; data: number[] };
    tenantId: string;
    uploadedById: string;
    gradeId?: string;
    sessionId?: string;
  }) {
    const fileBuffer = Buffer.from(input.fileBuffer.data);
    return this.filesService.createFromBuffer({
      fileBuffer,
      originalName: input.fileName,
      mimeType: input.mimeType,
      size: fileBuffer.length,
      tenantId: input.tenantId,
      uploadedById: input.uploadedById,
      gradeId: input.gradeId,
      sessionId: input.sessionId,
    });
  }

  @Get()
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Listar archivos' })
  async findAll(@Query() query: FileQueryDto) {
    return this.filesService.findAll(query);
  }

  @Get(':id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR, RoleType.TEACHER)
  @ApiOperation({ summary: 'Obtener archivo' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.filesService.findById(id);
  }

  @Delete(':id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.SCHOOL_DIRECTOR, RoleType.VICE_DIRECTOR)
  @ApiOperation({ summary: 'Eliminar archivo' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.filesService.delete(id);
  }
}