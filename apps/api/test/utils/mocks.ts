import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { MinioService } from '../../src/modules/files/minio.service';

export const mockMinioService = {
  getBucketKey: jest.fn().mockReturnValue('mock/tenant/test.pdf'),
  uploadFile: jest.fn().mockResolvedValue('mock-key'),
  getPresignedUrl: jest.fn().mockResolvedValue('https://mock-minio/presigned-url'),
  getPresignedUploadUrl: jest.fn().mockResolvedValue('https://mock-minio/upload-url'),
  deleteFile: jest.fn().mockResolvedValue(undefined),
  listFiles: jest.fn().mockResolvedValue([]),
};

export function overrideMinio(moduleBuilder: TestingModuleBuilder): TestingModuleBuilder {
  return moduleBuilder.overrideProvider(MinioService).useValue(mockMinioService);
}

