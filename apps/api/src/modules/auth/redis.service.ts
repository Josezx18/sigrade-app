import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private enabled = true;

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
    this.client = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          this.logger.warn('Redis connection failed after 3 retries — running without cache');
          this.enabled = false;
          return null;
        }
        return Math.min(times * 200, 2000);
      },
    });

    this.client.on('error', (err) => {
      this.logger.warn(`Redis error: ${err.message} — running without cache`);
      this.enabled = false;
    });

    this.client.on('ready', () => {
      this.enabled = true;
      this.logger.log('Redis connected');
    });

    this.client.connect().catch((err) => {
      this.logger.warn(`Redis connection failed: ${err.message} — running without cache`);
      this.enabled = false;
    });
  }

  async onModuleDestroy() {
    if (this.client.status === 'ready') {
      await this.client.quit();
    }
  }

  async blacklistRefreshToken(token: string, expiresInSeconds: number): Promise<void> {
    if (!this.enabled) return;
    await this.client.set(`bl:${token}`, '1', 'EX', expiresInSeconds);
  }

  async isRefreshTokenBlacklisted(token: string): Promise<boolean> {
    if (!this.enabled) return false;
    const result = await this.client.get(`bl:${token}`);
    return result === '1';
  }

  async storeSession(userId: string, sessionId: string, ttlSeconds: number): Promise<void> {
    if (!this.enabled) return;
    await this.client.set(`session:${userId}:${sessionId}`, '1', 'EX', ttlSeconds);
  }

  async removeSession(userId: string, sessionId: string): Promise<void> {
    if (!this.enabled) return;
    await this.client.del(`session:${userId}:${sessionId}`);
  }

  async removeAllSessions(userId: string): Promise<void> {
    if (!this.enabled) return;
    const keys = await this.client.keys(`session:${userId}:*`);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.enabled) return null;
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.enabled) return;
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.enabled) return;
    await this.client.del(key);
  }
}
