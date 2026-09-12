import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private client: Minio.Client;
  private readonly buckets: string[];

  constructor(private configService: ConfigService) {
    const rawEndpoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost');
    const portStr = this.configService.get<string>('MINIO_PORT', '9000');
    const [endPoint, parsedPort] = rawEndpoint.includes(':')
      ? [rawEndpoint.split(':')[0], rawEndpoint.split(':')[1]]
      : [rawEndpoint, portStr];

    this.client = new Minio.Client({
      endPoint,
      port: Number(parsedPort),
      useSSL: this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.configService.getOrThrow<string>('MINIO_ACCESS_KEY'),
      secretKey: this.configService.getOrThrow<string>('MINIO_SECRET_KEY'),
    });

    this.buckets = [
      this.configService.get<string>('MINIO_BUCKET_EVIDENCES', 'sigrade-evidences'),
      this.configService.get<string>('MINIO_BUCKET_DOCUMENTS', 'sigrade-documents'),
      this.configService.get<string>('MINIO_BUCKET_AVATARS', 'sigrade-avatars'),
    ];
  }

  async onModuleInit() {
    for (const bucket of this.buckets) {
      try {
        const exists = await this.client.bucketExists(bucket);
        if (!exists) {
          await this.client.makeBucket(bucket);
          this.logger.log(`Bucket "${bucket}" created`);
        }
      } catch (error) {
        this.logger.warn(`Could not initialize bucket "${bucket}": ${(error as Error).message}`);
      }
    }
  }

  async uploadFile(
    bucket: string,
    objectKey: string,
    file: Buffer,
    mimeType: string,
  ): Promise<string> {
    await this.client.putObject(bucket, objectKey, file, file.length, {
      'Content-Type': mimeType,
    });
    return objectKey;
  }

  async getPresignedUrl(
    bucket: string,
    objectKey: string,
    expirySeconds = 3600,
  ): Promise<string> {
    return this.client.presignedGetObject(bucket, objectKey, expirySeconds);
  }

  async getPresignedUploadUrl(
    bucket: string,
    objectKey: string,
    expirySeconds = 3600,
  ): Promise<string> {
    return this.client.presignedPutObject(bucket, objectKey, expirySeconds);
  }

  async deleteFile(bucket: string, objectKey: string): Promise<void> {
    await this.client.removeObject(bucket, objectKey);
  }

  async listFiles(
    bucket: string,
    prefix = '',
  ): Promise<{ name: string; size: number; lastModified: Date }[]> {
    const objects: { name: string; size: number; lastModified: Date }[] = [];
    const stream = this.client.listObjects(bucket, prefix, true);

    return new Promise((resolve, reject) => {
      stream.on('data', (obj) => {
        if (obj.name) {
          objects.push({
            name: obj.name,
            size: obj.size ?? 0,
            lastModified: obj.lastModified ?? new Date(),
          });
        }
      });
      stream.on('error', reject);
      stream.on('end', () => resolve(objects));
    });
  }

  getBucketKey(tenantId: string, entityType: string, entityId: string, fileName: string): string {
    return `${tenantId}/${entityType}/${entityId}/${Date.now()}_${fileName}`;
  }
}
