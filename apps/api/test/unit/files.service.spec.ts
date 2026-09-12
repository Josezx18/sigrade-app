import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FilesService } from '../../src/modules/files/files.service';
import { MinioService } from '../../src/modules/files/minio.service';
import { PrismaService } from '@sigrade/shared-prisma';

const mockPrisma = {
  evidenceFile: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
};

const mockMinioService = {
  getBucketKey: jest.fn().mockReturnValue('tenant-1/grades/grade-1/123_test.pdf'),
  uploadFile: jest.fn(),
  getPresignedUrl: jest.fn().mockResolvedValue('https://minio/sigrade-evidences/presigned-url'),
  deleteFile: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    const map: Record<string, string> = {
      MINIO_BUCKET_EVIDENCES: 'sigrade-evidences',
    };
    return map[key];
  }),
};

describe('FilesService', () => {
  let service: FilesService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MinioService, useValue: mockMinioService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should list all files with pagination', async () => {
      const files = [
        { id: 'file-1', fileName: 'test.pdf', originalName: 'document.pdf', mimeType: 'application/pdf', size: 1024, bucket: 'uploads', objectKey: 'abc123' },
        { id: 'file-2', fileName: 'doc.txt', originalName: 'doc.txt', mimeType: 'text/plain', size: 512, bucket: 'uploads', objectKey: 'def456' },
      ];
      prisma.evidenceFile.findMany.mockResolvedValue(files);
      prisma.evidenceFile.count.mockResolvedValue(2);

      const result = await service.findAll({});

      expect(result).toEqual({ data: files, total: 2, page: 1, limit: 20, totalPages: 1 });
      expect(prisma.evidenceFile.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by sessionId', async () => {
      prisma.evidenceFile.findMany.mockResolvedValue([]);
      prisma.evidenceFile.count.mockResolvedValue(0);

      await service.findAll({ sessionId: 'sess-1' });

      expect(prisma.evidenceFile.findMany).toHaveBeenCalledWith({
        where: { sessionId: 'sess-1' },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no files', async () => {
      prisma.evidenceFile.findMany.mockResolvedValue([]);
      prisma.evidenceFile.count.mockResolvedValue(0);

      const result = await service.findAll({});

      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });
    });
  });

  describe('findById', () => {
    it('should return file when found', async () => {
      const file = { id: 'file-1', fileName: 'test.pdf', originalName: 'document.pdf', mimeType: 'application/pdf', size: 1024, bucket: 'uploads', objectKey: 'abc123' };
      prisma.evidenceFile.findUnique.mockResolvedValue(file);

      const result = await service.findById('file-1');

      expect(result).toEqual(file);
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.evidenceFile.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete file from DB and MinIO', async () => {
      prisma.evidenceFile.findUnique.mockResolvedValue({ id: 'file-1', bucket: 'sigrade-evidences', objectKey: 'key-1' });
      prisma.evidenceFile.delete.mockResolvedValue({ id: 'file-1' });

      const result = await service.delete('file-1');

      expect(mockMinioService.deleteFile).toHaveBeenCalledWith('sigrade-evidences', 'key-1');
      expect(prisma.evidenceFile.delete).toHaveBeenCalledWith({ where: { id: 'file-1' } });
      expect(result).toEqual({ id: 'file-1' });
    });

    it('should still delete DB record when MinIO file not found', async () => {
      prisma.evidenceFile.findUnique.mockResolvedValue({ id: 'file-1', bucket: 'sigrade-evidences', objectKey: 'key-1' });
      mockMinioService.deleteFile.mockRejectedValue(new Error('Not found'));
      prisma.evidenceFile.delete.mockResolvedValue({ id: 'file-1' });

      const result = await service.delete('file-1');

      expect(result).toEqual({ id: 'file-1' });
    });
  });

  describe('getPresignedUrl', () => {
    it('should return presigned URL for file', async () => {
      prisma.evidenceFile.findUnique.mockResolvedValue({ id: 'file-1', bucket: 'sigrade-evidences', objectKey: 'key-1' });

      const url = await service.getPresignedUrl('file-1');

      expect(mockMinioService.getPresignedUrl).toHaveBeenCalledWith('sigrade-evidences', 'key-1');
      expect(url).toBe('https://minio/sigrade-evidences/presigned-url');
    });
  });
});
