import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@sigrade/shared-prisma';
import { TenantType } from '@prisma/client';
import { CreateTenantDto, UpdateTenantDto, TenantResponseDto, TenantTreeDto } from './dto/tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(createTenantDto: CreateTenantDto): Promise<TenantResponseDto> {
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { code: createTenantDto.code },
    });

    if (existingTenant) {
      throw new BadRequestException(`El código de tenant '${createTenantDto.code}' ya existe`);
    }

    if (createTenantDto.parentId) {
      const parent = await this.prisma.tenant.findUnique({
        where: { id: createTenantDto.parentId },
      });

      if (!parent) {
        throw new NotFoundException(`Tenant padre con ID '${createTenantDto.parentId}' no encontrado`);
      }

    }

    const tenant = await this.prisma.tenant.create({
      data: {
        code: createTenantDto.code,
        name: createTenantDto.name,
        type: createTenantDto.type,
        parentId: createTenantDto.parentId,
        settings: (createTenantDto.settings || {}) as never,
      },
    });

    return this.mapToResponse(tenant);
  }

  async findAll(): Promise<TenantResponseDto[]> {
    const tenants = await this.prisma.tenant.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return tenants.map(this.mapToResponse);
  }

  async findTree(): Promise<TenantTreeDto[]> {
    const tenants = await this.prisma.tenant.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            children: {
              include: {
                children: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return tenants.map(this.mapToTree);
  }

  async findById(id: string): Promise<TenantResponseDto> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: { parent: true },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant con ID '${id}' no encontrado`);
    }

    return this.mapToResponse(tenant);
  }

  async findByCode(code: string): Promise<TenantResponseDto> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { code },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant con código '${code}' no encontrado`);
    }

    return this.mapToResponse(tenant);
  }

  async findChildren(parentId: string): Promise<TenantResponseDto[]> {
    const children = await this.prisma.tenant.findMany({
      where: { parentId },
      orderBy: { createdAt: 'asc' },
    });

    return children.map(this.mapToResponse);
  }

  async findByType(type: string): Promise<TenantResponseDto[]> {
    const tenants = await this.prisma.tenant.findMany({
      where: { type: type as TenantType },
      orderBy: { createdAt: 'asc' },
    });

    return tenants.map(this.mapToResponse);
  }

  async update(id: string, updateTenantDto: UpdateTenantDto): Promise<TenantResponseDto> {
    await this.findById(id);

    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: {
        name: updateTenantDto.name,
        settings: updateTenantDto.settings as never,
      },
    });

    return this.mapToResponse(tenant);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);

    const children = await this.prisma.tenant.count({
      where: { parentId: id },
    });

    if (children > 0) {
      throw new BadRequestException('No se puede eliminar un tenant que tiene hijos');
    }

    const hasData = await this.checkHasAssociatedData(id);
    if (hasData) {
      throw new BadRequestException('No se puede eliminar un tenant que tiene datos asociados');
    }

    await this.prisma.tenant.delete({
      where: { id },
    });
  }

  async getHierarchyPath(id: string): Promise<TenantResponseDto[]> {
    const path: TenantResponseDto[] = [];
    let currentId: string | null = id;

    while (currentId) {
      const tenant: { id: string; code: string; name: string; type: TenantType; parentId: string | null; settings: unknown; createdAt: Date; updatedAt: Date } | null = await this.prisma.tenant.findUnique({
        where: { id: currentId },
        select: { id: true, code: true, name: true, type: true, parentId: true, settings: true, createdAt: true, updatedAt: true },
      });

      if (!tenant) {
        break;
      }

      path.unshift(this.mapToResponse(tenant));
      currentId = tenant.parentId;
    }

    if (path.length === 0) {
      throw new NotFoundException(`Tenant con ID '${id}' no encontrado`);
    }

    return path;
  }

  private async checkHasAssociatedData(tenantId: string): Promise<boolean> {
    const counts = await Promise.all([
      this.prisma.user.count({ where: { tenantId } }),
      this.prisma.schoolYear.count({ where: { tenantId } }),
      this.prisma.gradeLevel.count({ where: { tenantId } }),
      this.prisma.subject.count({ where: { tenantId } }),
      this.prisma.course.count({ where: { tenantId } }),
      this.prisma.teacher.count({ where: { tenantId } }),
      this.prisma.student.count({ where: { tenantId } }),
    ]);

    return counts.some((count) => count > 0);
  }

  private mapToResponse(tenant: { id: string; code: string; name: string; type: TenantType; parentId: string | null; settings: unknown; createdAt: Date; updatedAt: Date }): TenantResponseDto {
    return {
      id: tenant.id,
      code: tenant.code,
      name: tenant.name,
      type: tenant.type,
      parentId: tenant.parentId,
      settings: tenant.settings as Record<string, unknown>,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  }

  private mapToTree(tenant: { id: string; code: string; name: string; type: TenantType; parentId: string | null; settings: unknown; createdAt: Date; updatedAt: Date; children?: unknown[] }): TenantTreeDto {
    return {
      ...this.mapToResponse(tenant),
      children: (tenant.children as Array<Parameters<typeof this.mapToTree>[0]> | undefined)?.map((c) => this.mapToTree(c)) || [],
    };
  }
}