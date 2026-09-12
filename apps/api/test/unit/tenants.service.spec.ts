import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TenantsService } from '../../src/modules/tenants/tenants.service';
import { PrismaService } from '@sigrade/shared-prisma';

const mockPrisma = {
  tenant: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  user: { count: jest.fn() },
  schoolYear: { count: jest.fn() },
  gradeLevel: { count: jest.fn() },
  subject: { count: jest.fn() },
  course: { count: jest.fn() },
  teacher: { count: jest.fn() },
  student: { count: jest.fn() },
};

describe('TenantsService', () => {
  let service: TenantsService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  const mockTenant = {
    id: 'tenant-1',
    code: 'DIST-01-01',
    name: 'Distrito 01-01',
    type: 'DISTRICT',
    parentId: null,
    settings: {},
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockTenantWithParent = {
    ...mockTenant,
    parentId: 'regional-1',
    parent: { id: 'regional-1', code: 'REG-01', name: 'Regional 01', type: 'REGIONAL', parentId: null, settings: {}, createdAt: new Date(), updatedAt: new Date() },
  };

  describe('findAll', () => {
    it('should return all tenants ordered by createdAt', async () => {
      prisma.tenant.findMany.mockResolvedValue([mockTenant]);

      const result = await service.findAll();

      expect(prisma.tenant.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toEqual([{
        id: 'tenant-1',
        code: 'DIST-01-01',
        name: 'Distrito 01-01',
        type: 'DISTRICT',
        parentId: null,
        settings: {},
        createdAt: mockTenant.createdAt,
        updatedAt: mockTenant.updatedAt,
      }]);
    });
  });

  describe('findById', () => {
    it('should return a tenant by id', async () => {
      prisma.tenant.findUnique.mockResolvedValue(mockTenantWithParent);

      const result = await service.findById('tenant-1');

      expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        include: { parent: true },
      });
      expect(result).toBeDefined();
      expect(result.id).toBe('tenant-1');
    });

    it('should throw NotFoundException when tenant not found', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a tenant', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);
      prisma.tenant.create.mockResolvedValue(mockTenant);

      const result = await service.create({
        code: 'DIST-01-01',
        name: 'Distrito 01-01',
        type: 'DISTRICT' as never,
      });

      expect(prisma.tenant.create).toHaveBeenCalledWith({
        data: {
          code: 'DIST-01-01',
          name: 'Distrito 01-01',
          type: 'DISTRICT',
          parentId: undefined,
          settings: {},
        },
      });
      expect(result).toBeDefined();
      expect(result.code).toBe('DIST-01-01');
    });

    it('should throw BadRequestException when code already exists', async () => {
      prisma.tenant.findUnique.mockResolvedValue(mockTenant);

      await expect(
        service.create({ code: 'DIST-01-01', name: 'Test', type: 'DISTRICT' as never }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when parent tenant not found', async () => {
      prisma.tenant.findUnique.mockResolvedValueOnce(null);
      prisma.tenant.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.create({ code: 'NEW-SCHOOL', name: 'New School', type: 'SCHOOL' as never, parentId: 'nonexistent' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a tenant', async () => {
      prisma.tenant.findUnique.mockResolvedValue(mockTenant);
      const updatedTenant = { ...mockTenant, name: 'Updated District' };
      prisma.tenant.update.mockResolvedValue(updatedTenant);

      const result = await service.update('tenant-1', { name: 'Updated District' });

      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: { name: 'Updated District', settings: undefined },
      });
      expect(result.name).toBe('Updated District');
    });

    it('should throw NotFoundException when tenant to update does not exist', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { name: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a tenant', async () => {
      prisma.tenant.findUnique.mockResolvedValue(mockTenant);
      prisma.tenant.count.mockResolvedValue(0);
      prisma.user.count.mockResolvedValue(0);
      prisma.schoolYear.count.mockResolvedValue(0);
      prisma.gradeLevel.count.mockResolvedValue(0);
      prisma.subject.count.mockResolvedValue(0);
      prisma.course.count.mockResolvedValue(0);
      prisma.teacher.count.mockResolvedValue(0);
      prisma.student.count.mockResolvedValue(0);
      prisma.tenant.delete.mockResolvedValue(mockTenant);

      await service.delete('tenant-1');

      expect(prisma.tenant.delete).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
      });
    });

    it('should throw NotFoundException when tenant to delete does not exist', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when tenant has children', async () => {
      prisma.tenant.findUnique.mockResolvedValue(mockTenant);
      prisma.tenant.count.mockResolvedValue(2);

      await expect(service.delete('tenant-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when tenant has associated data', async () => {
      prisma.tenant.findUnique.mockResolvedValue(mockTenant);
      prisma.tenant.count.mockResolvedValue(0);
      prisma.user.count.mockResolvedValue(1);

      await expect(service.delete('tenant-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
