import { Test, TestingModule } from '@nestjs/testing';
import { TeachersController } from '../../src/modules/teachers/teachers.controller';
import { TeachersService } from '../../src/modules/teachers/teachers.service';
import { CreateTeacherDto, UpdateTeacherDto, TeacherQueryDto } from '../../src/modules/teachers/dto/teacher.dto';

describe('TeachersController', () => {
  let controller: TeachersController;
  let service: jest.Mocked<TeachersService>;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getAssignments: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeachersController],
      providers: [{ provide: TeachersService, useValue: mockService }],
    }).compile();

    controller = module.get<TeachersController>(TeachersController);
    service = module.get(TeachersService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should pass CreateTeacherDto to service', async () => {
      const dto: CreateTeacherDto = {
        userId: 'user-1',
        employeeCode: 'TCH-001',
        hireDate: '2024-01-15',
        contractType: 'NOMBRADO' as never,
      };
      service.create.mockResolvedValue({ id: 'teacher-1' } as never);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: 'teacher-1' });
    });
  });

  describe('findAll', () => {
    it('should pass TeacherQueryDto to service', async () => {
      const query: TeacherQueryDto = { page: 1, limit: 20 };
      const expected = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      service.findAll.mockResolvedValue(expected as never);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expected);
    });
  });

  describe('findById', () => {
    it('should pass id to service', async () => {
      service.findById.mockResolvedValue({ id: 'teacher-1' } as never);

      await controller.findById('teacher-1');

      expect(service.findById).toHaveBeenCalledWith('teacher-1');
    });
  });

  describe('getAssignments', () => {
    it('should pass id to service', async () => {
      service.getAssignments.mockResolvedValue([] as never);

      await controller.getAssignments('teacher-1');

      expect(service.getAssignments).toHaveBeenCalledWith('teacher-1');
    });
  });

  describe('update', () => {
    it('should pass UpdateTeacherDto to service', async () => {
      const dto: UpdateTeacherDto = { degree: 'PhD' };
      service.update.mockResolvedValue({ id: 'teacher-1' } as never);

      const result = await controller.update('teacher-1', dto);

      expect(service.update).toHaveBeenCalledWith('teacher-1', dto);
    });
  });

  describe('patch', () => {
    it('should pass UpdateTeacherDto to service', async () => {
      const dto: UpdateTeacherDto = { specialization: 'Math' };
      service.update.mockResolvedValue({ id: 'teacher-1' } as never);

      await controller.patch('teacher-1', dto);

      expect(service.update).toHaveBeenCalledWith('teacher-1', dto);
    });
  });

  describe('delete', () => {
    it('should pass id to service', async () => {
      service.delete.mockResolvedValue({ id: 'teacher-1' } as never);

      await controller.delete('teacher-1');

      expect(service.delete).toHaveBeenCalledWith('teacher-1');
    });
  });
});
