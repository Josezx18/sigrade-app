import { Test, TestingModule } from '@nestjs/testing';
import { StudentsController } from '../../src/modules/students/students.controller';
import { StudentsService } from '../../src/modules/students/students.service';
import { CreateStudentDto, UpdateStudentDto, StudentQueryDto } from '../../src/modules/students/dto/student.dto';

describe('StudentsController', () => {
  let controller: StudentsController;
  let service: jest.Mocked<StudentsService>;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    bulkDelete: jest.fn(),
    exportCSV: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentsController],
      providers: [{ provide: StudentsService, useValue: mockService }],
    }).compile();

    controller = module.get<StudentsController>(StudentsController);
    service = module.get(StudentsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should pass CreateStudentDto to service', async () => {
      const dto: CreateStudentDto = {
        firstName: 'Juan',
        lastName: 'Pérez',
        studentCode: 'EST-001',
        birthDate: '2010-05-15',
        gender: 'M' as never,
        tenantId: 'tenant-1',
      };
      service.create.mockResolvedValue({ id: 'student-1' } as never);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: 'student-1' });
    });
  });

  describe('findAll', () => {
    it('should pass StudentQueryDto to service', async () => {
      const query: StudentQueryDto = { page: 1, limit: 20, search: 'Juan' };
      const expected = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      service.findAll.mockResolvedValue(expected as never);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expected);
    });
  });

  describe('findById', () => {
    it('should pass id to service', async () => {
      service.findById.mockResolvedValue({ id: 'student-1' } as never);

      const result = await controller.findById('student-1');

      expect(service.findById).toHaveBeenCalledWith('student-1');
    });
  });

  describe('update', () => {
    it('should pass UpdateStudentDto to service', async () => {
      const dto: UpdateStudentDto = { firstName: 'Ana' };
      service.update.mockResolvedValue({ id: 'student-1' } as never);

      const result = await controller.update('student-1', dto);

      expect(service.update).toHaveBeenCalledWith('student-1', dto);
      expect(result).toEqual({ id: 'student-1' });
    });
  });

  describe('patch', () => {
    it('should pass UpdateStudentDto to service', async () => {
      const dto: UpdateStudentDto = { lastName: 'López' };
      service.update.mockResolvedValue({ id: 'student-1' } as never);

      const result = await controller.patch('student-1', dto);

      expect(service.update).toHaveBeenCalledWith('student-1', dto);
    });
  });

  describe('delete', () => {
    it('should pass id to service', async () => {
      service.delete.mockResolvedValue({ id: 'student-1' } as never);

      const result = await controller.delete('student-1');

      expect(service.delete).toHaveBeenCalledWith('student-1');
    });
  });

  describe('bulkDelete', () => {
    it('should pass ids to service', async () => {
      service.bulkDelete.mockResolvedValue({ deleted: 2 } as never);

      const result = await controller.bulkDelete({ ids: ['s1', 's2'] });

      expect(service.bulkDelete).toHaveBeenCalledWith(['s1', 's2']);
      expect(result).toEqual({ deleted: 2 });
    });
  });
});
