import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../../src/app/app.controller';
import { AppService } from '../../src/app/app.service';
import { PrismaService } from '@sigrade/shared-prisma';

describe('AppController', () => {
  let controller: AppController;
  let service: AppService;

  const mockPrisma = { $queryRaw: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    service = module.get<AppService>(AppService);
    mockPrisma.$queryRaw.mockReset();
  });

  describe('getData', () => {
    it('should return hello message', () => {
      expect(controller.getData()).toEqual({ message: 'Hello API' });
    });
  });

  describe('health', () => {
    it('should return ok when DB is reachable', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);

      const result = await controller.health();

      expect(result.status).toBe('ok');
      expect(result.checks.database).toBe('ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
    });

    it('should return degraded when DB is unreachable', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('DB down'));

      const result = await controller.health();

      expect(result.status).toBe('degraded');
      expect(result.checks.database).toBe('error');
    });
  });
});
