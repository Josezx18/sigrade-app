import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@sigrade/shared-prisma';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private prisma: PrismaService) {}

  getData(): { message: string } {
    return { message: 'Hello API' };
  }

  async getHealth() {
    const checks: Record<string, string> = {};

    // Database check
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = 'ok';
    } catch {
      checks.database = 'error';
      this.logger.error('Database health check failed');
    }

    const allOk = Object.values(checks).every((s) => s === 'ok');

    return {
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
    };
  }
}
