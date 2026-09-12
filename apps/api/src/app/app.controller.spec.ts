import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from '@sigrade/shared-prisma';

describe('AppController', () => {
  let controller: AppController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, { provide: PrismaService, useValue: { $queryRaw: jest.fn() } }],
    }).compile();
    controller = module.get<AppController>(AppController);
  });

  describe('getData', () => {
    it('should return "Hello API"', () => {
      expect(controller.getData()).toEqual({ message: 'Hello API' });
    });
  });
});
