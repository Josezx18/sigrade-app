import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from '../../src/modules/files/files.controller';
import { FilesService } from '../../src/modules/files/files.service';
import { FileUploadDto } from '../../src/modules/files/dto/file-upload.dto';
import { FileQueryDto } from '../../src/modules/files/dto/file.dto';

describe('FilesController', () => {
  let controller: FilesController;
  let service: jest.Mocked<FilesService>;

  const mockFile = {
    buffer: Buffer.from('test'),
    originalname: 'test.pdf',
    mimetype: 'application/pdf',
    size: 4,
  };

  const mockService = {
    upload: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [{ provide: FilesService, useValue: mockService }],
    }).compile();

    controller = module.get<FilesController>(FilesController);
    service = module.get(FilesService);
    jest.clearAllMocks();
  });

  describe('upload', () => {
    it('should call service.upload with file, dto, userId and tenantId', async () => {
      const dto: FileUploadDto = { gradeId: 'grade-1' };
      const userId = 'user-1';
      const tenantId = 'tenant-1';
      const expectedResult = { id: 'file-1' };
      mockService.upload.mockResolvedValue(expectedResult);

      const result = await controller.upload(mockFile, dto, userId, tenantId);

      expect(mockService.upload).toHaveBeenCalledWith({
        fileBuffer: mockFile.buffer,
        originalName: mockFile.originalname,
        mimeType: mockFile.mimetype,
        size: mockFile.size,
        tenantId,
        uploadedById: userId,
        gradeId: dto.gradeId,
        sessionId: dto.sessionId,
      });
      expect(result).toEqual(expectedResult);
    });

    it('should throw BadRequestException when no file is provided', async () => {
      await expect(
        controller.upload(null as never, {} as FileUploadDto, 'user-1', 'tenant-1'),
      ).rejects.toThrow('Archivo requerido');
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with query', async () => {
      const query: FileQueryDto = { page: 1, limit: 20, gradeId: 'grade-1' };
      const expected = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      service.findAll.mockResolvedValue(expected as never);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expected);
    });

    it('should use default empty query when no params', async () => {
      service.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 } as never);

      await controller.findAll({});

      expect(service.findAll).toHaveBeenCalledWith({});
    });
  });

  describe('findById', () => {
    it('should call service.findById with id', async () => {
      service.findById.mockResolvedValue({ id: 'file-1' } as never);

      const result = await controller.findById('file-1');

      expect(service.findById).toHaveBeenCalledWith('file-1');
      expect(result).toEqual({ id: 'file-1' });
    });
  });

  describe('delete', () => {
    it('should call service.delete with id', async () => {
      service.delete.mockResolvedValue({ id: 'file-1' } as never);

      const result = await controller.delete('file-1');

      expect(service.delete).toHaveBeenCalledWith('file-1');
      expect(result).toEqual({ id: 'file-1' });
    });
  });
});
