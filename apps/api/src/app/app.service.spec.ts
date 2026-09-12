import { Test } from '@nestjs/testing';
import { AppService } from './app.service';
import { PrismaService } from '@sigrade/shared-prisma';

describe('AppService', () => {
  let service: AppService;

  beforeAll(async () => {
    const mockPrisma = { $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]) };
    const app = await Test.createTestingModule({
      providers: [
        AppService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = app.get<AppService>(AppService);
  });

  describe('getData', () => {
    it('should return "Hello API"', () => {
      expect(service.getData()).toEqual({ message: 'Hello API' });
    });
  });
});
