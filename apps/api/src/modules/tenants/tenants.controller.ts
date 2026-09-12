import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto, TenantResponseDto, TenantTreeDto } from './dto/tenant.dto';
import { TenantType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleType } from '@sigrade/shared-prisma';

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @Roles(RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Crear un nuevo tenant' })
  @ApiResponse({ status: 201, description: 'Tenant creado exitosamente', type: TenantResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos o código duplicado' })
  async create(@Body() createTenantDto: CreateTenantDto): Promise<TenantResponseDto> {
    return this.tenantsService.create(createTenantDto);
  }

  @Get('tree')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST)
  @ApiOperation({ summary: 'Obtener el árbol completo de tenants (jerarquía MINERD)' })
  @ApiResponse({ status: 200, description: 'Árbol de tenants', type: [TenantTreeDto] })
  async getTree(): Promise<TenantTreeDto[]> {
    return this.tenantsService.findTree();
  }

  @Get('type/:type')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST)
  @ApiOperation({ summary: 'Obtener tenants por tipo' })
  @ApiResponse({ status: 200, description: 'Lista de tenants', type: [TenantResponseDto] })
  async findByType(@Param('type') type: TenantType): Promise<TenantResponseDto[]> {
    return this.tenantsService.findByType(type);
  }

  @Get(':id/hierarchy')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.DISTRICT_DIRECTOR, RoleType.SCHOOL_DIRECTOR)
  @ApiOperation({ summary: 'Obtener la ruta jerárquica de un tenant' })
  @ApiResponse({ status: 200, description: 'Ruta jerárquica', type: [TenantResponseDto] })
  async getHierarchy(@Param('id', ParseUUIDPipe) id: string): Promise<TenantResponseDto[]> {
    return this.tenantsService.getHierarchyPath(id);
  }

  @Get()
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST)
  @ApiOperation({ summary: 'Obtener todos los tenants' })
  @ApiQuery({ name: 'type', required: false, enum: TenantType })
  @ApiResponse({ status: 200, description: 'Lista de tenants', type: [TenantResponseDto] })
  async findAll(@Query('type') type?: TenantType): Promise<TenantResponseDto[]> {
    if (type) {
      return this.tenantsService.findByType(type);
    }
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.DISTRICT_DIRECTOR, RoleType.SCHOOL_DIRECTOR)
  @ApiOperation({ summary: 'Obtener un tenant por ID' })
  @ApiResponse({ status: 200, description: 'Tenant encontrado', type: TenantResponseDto })
  @ApiResponse({ status: 404, description: 'Tenant no encontrado' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<TenantResponseDto> {
    return this.tenantsService.findById(id);
  }

  @Get('code/:code')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST)
  @ApiOperation({ summary: 'Obtener un tenant por código' })
  @ApiResponse({ status: 200, description: 'Tenant encontrado', type: TenantResponseDto })
  @ApiResponse({ status: 404, description: 'Tenant no encontrado' })
  async findByCode(@Param('code') code: string): Promise<TenantResponseDto> {
    return this.tenantsService.findByCode(code);
  }

  @Get(':id/children')
  @Roles(RoleType.SUPER_ADMIN, RoleType.MINERD_ANALYST, RoleType.REGIONAL_DIRECTOR, RoleType.DISTRICT_DIRECTOR, RoleType.SCHOOL_DIRECTOR)
  @ApiOperation({ summary: 'Obtener hijos de un tenant' })
  @ApiResponse({ status: 200, description: 'Lista de tenants hijos', type: [TenantResponseDto] })
  async findChildren(@Param('id', ParseUUIDPipe) id: string): Promise<TenantResponseDto[]> {
    return this.tenantsService.findChildren(id);
  }

  @Put(':id')
  @Roles(RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Actualizar un tenant' })
  @ApiResponse({ status: 200, description: 'Tenant actualizado', type: TenantResponseDto })
  @ApiResponse({ status: 404, description: 'Tenant no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Delete(':id')
  @Roles(RoleType.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un tenant' })
  @ApiResponse({ status: 204, description: 'Tenant eliminado' })
  @ApiResponse({ status: 400, description: 'No se puede eliminar (tiene hijos o datos asociados)' })
  @ApiResponse({ status: 404, description: 'Tenant no encontrado' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.tenantsService.delete(id);
  }
}