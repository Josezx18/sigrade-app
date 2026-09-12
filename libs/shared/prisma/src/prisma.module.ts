import { Module, Global } from '@nestjs/common';
import { PrismaService, OwnerPrismaService, createTenantProxy } from './prisma.service';

@Global()
@Module({
  providers: [
    {
      provide: PrismaService,
      useFactory: () => createTenantProxy(new PrismaService()),
    },
    OwnerPrismaService,
  ],
  exports: [PrismaService, OwnerPrismaService],
})
export class PrismaModule {}
