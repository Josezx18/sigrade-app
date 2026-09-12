import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from '../../src/modules/audit/audit.service';
import { PrismaService } from '@sigrade/shared-prisma';

const mockPrisma = {
  auditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

describe('AuditService', () => {
  let service: AuditService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should create an audit log entry', async () => {
      const logData = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        action: 'LOGIN',
        entityType: 'User',
        entityId: 'user-1',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      };
      const createdLog = { id: 'log-1', ...logData, oldData: undefined, newData: undefined };
      prisma.auditLog.create.mockResolvedValue(createdLog);

      const result = await service.log(logData);

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          userId: 'user-1',
          action: 'LOGIN',
          entityType: 'User',
          entityId: 'user-1',
          oldData: undefined,
          newData: undefined,
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
        },
      });
      expect(result).toEqual(createdLog);
    });

    it('should create audit log with old and new data', async () => {
      const logData = {
        tenantId: 'tenant-1',
        action: 'USER_UPDATE',
        entityType: 'User',
        entityId: 'user-1',
        oldData: { name: 'Old' },
        newData: { name: 'New' },
      };
      const createdLog = { id: 'log-2', ...logData };
      prisma.auditLog.create.mockResolvedValue(createdLog);

      const result = await service.log(logData);

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          oldData: { name: 'Old' },
          newData: { name: 'New' },
        }),
      });
      expect(result).toEqual(createdLog);
    });

    it('should handle optional fields', async () => {
      const logData = {
        tenantId: 'tenant-1',
        action: 'SYSTEM_EVENT',
        entityType: 'System',
      };
      const createdLog = { id: 'log-3', ...logData, entityId: '' };
      prisma.auditLog.create.mockResolvedValue(createdLog);

      const result = await service.log(logData);

      expect(result.id).toBe('log-3');
    });
  });

  describe('findAll', () => {
    it('should return paginated audit logs', async () => {
      const logs = [
        { id: 'log-1', tenantId: 'tenant-1', action: 'LOGIN', entityType: 'User', createdAt: new Date(), user: { id: 'u-1', firstName: 'Juan', lastName: 'Perez', email: 'juan@test.com' } },
      ];
      prisma.auditLog.findMany.mockResolvedValue(logs);
      prisma.auditLog.count.mockResolvedValue(1);

      const result = await service.findAll({ tenantId: 'tenant-1', page: 1, limit: 20 });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        skip: 0, take: 20,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      });
      expect(result).toEqual({ data: logs, total: 1, page: 1, limit: 20, totalPages: 1 });
    });

    it('should apply tenantId filter', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      await service.findAll({ tenantId: 'tenant-1' });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: 'tenant-1' } }),
      );
    });

    it('should apply action filter', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      await service.findAll({ tenantId: 'tenant-1', action: 'LOGIN' });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: 'tenant-1', action: 'LOGIN' } }),
      );
    });

    it('should apply userId and entityType filters', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      await service.findAll({ tenantId: 'tenant-1', userId: 'u-1', entityType: 'Planning' });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: 'tenant-1', userId: 'u-1', entityType: 'Planning' } }),
      );
    });

    it('should return empty data when no logs', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      const result = await service.findAll({ tenantId: 'empty-tenant' });

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });
});
