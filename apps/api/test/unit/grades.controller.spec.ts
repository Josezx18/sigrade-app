import { Test, TestingModule } from '@nestjs/testing';
import { GradesController } from '../../src/modules/grades/grades.controller';
import { GradesService } from '../../src/modules/grades/grades.service';
import { CreateGradeDto, UpdateGradeDto, GradeQueryDto } from '../../src/modules/grades/dto/grade.dto';

describe('GradesController', () => {
  let controller: GradesController;
  let service: jest.Mocked<GradesService>;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    bulkCreate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GradesController],
      providers: [{ provide: GradesService, useValue: mockService }],
    }).compile();

    controller = module.get<GradesController>(GradesController);
    service = module.get(GradesService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should pass CreateGradeDto to service', async () => {
      const dto: CreateGradeDto = {
        studentId: 's-1',
        subjectId: 'subj-1',
        periodId: 'p-1',
        teacherId: 't-1',
        value: 90,
      };
      service.create.mockResolvedValue({ id: 'g-1' } as never);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: 'g-1' });
    });
  });

  describe('findAll', () => {
    it('should pass GradeQueryDto to service', async () => {
      const query: GradeQueryDto = { page: 1, limit: 25, studentId: 's-1' };
      const expected = { data: [], total: 0, page: 1, limit: 25, totalPages: 0 };
      service.findAll.mockResolvedValue(expected as never);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expected);
    });
  });

  describe('findById', () => {
    it('should pass id to service', async () => {
      service.findById.mockResolvedValue({ id: 'g-1' } as never);

      await controller.findById('g-1');

      expect(service.findById).toHaveBeenCalledWith('g-1');
    });
  });

  describe('update', () => {
    it('should pass UpdateGradeDto to service', async () => {
      const dto: UpdateGradeDto = { value: 95 };
      service.update.mockResolvedValue({ id: 'g-1' } as never);

      await controller.update('g-1', dto);

      expect(service.update).toHaveBeenCalledWith('g-1', dto);
    });
  });

  describe('patch', () => {
    it('should pass UpdateGradeDto to service', async () => {
      const dto: UpdateGradeDto = { comment: 'Great' };
      service.update.mockResolvedValue({ id: 'g-1' } as never);

      await controller.patch('g-1', dto);

      expect(service.update).toHaveBeenCalledWith('g-1', dto);
    });
  });

  describe('delete', () => {
    it('should pass id to service', async () => {
      service.delete.mockResolvedValue({ id: 'g-1' } as never);

      await controller.delete('g-1');

      expect(service.delete).toHaveBeenCalledWith('g-1');
    });
  });

  describe('bulkCreate', () => {
    it('should pass array of CreateGradeDto to service', async () => {
      const dtos: CreateGradeDto[] = [
        { studentId: 's-1', subjectId: 'subj-1', periodId: 'p-1', teacherId: 't-1', value: 85 },
      ];
      service.bulkCreate.mockResolvedValue([{ id: 'g-1' }] as never);

      await controller.bulkCreate(dtos);

      expect(service.bulkCreate).toHaveBeenCalledWith(dtos);
    });
  });
});
