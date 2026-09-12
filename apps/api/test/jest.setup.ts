import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app/app.module';
import { PrismaService } from '@sigrade/shared-prisma';

declare global {
  var testApp: INestApplication;
  var prisma: PrismaService;
}

beforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  global.testApp = moduleFixture.createNestApplication();
  global.prisma = moduleFixture.get<PrismaService>(PrismaService);
  
  await global.testApp.init();
});

afterAll(async () => {
  await global.testApp.close();
});