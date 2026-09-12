import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TeachersService } from '../../src/modules/teachers/teachers.service';
import { PrismaService } from '@sigrade/shared-prisma';

const mockPrisma = {
  teacher: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  teacherAssignment: {
    findMany: jest.fn(),
  },
};

const rawTeacher = {
  id: 'teacher-1',
  userId: 'user-1',
  employeeCode: 'DOC-001',
  degree: 'Licenciado',
  specialization: 'Matematicas',
  hireDate: new Date('2020-01-15'),
  contractType: 'NOMBRADO',
  tenantId: 'tenant-1',
  user: { id: 'user-1', email: 'teacher@test.com', firstName: 'Juan', lastName: 'Perez', dni: '40212345678', phone: '809-555-1234', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  assignments: [],
};

describe('TeachersService', () => {
  let service: TeachersService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TeachersService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<TeachersService>(TeachersService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated teachers', async () => {
      prisma.teacher.findMany.mockResolvedValue([rawTeacher]);
      prisma.teacher.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total', 1);
      expect(result.data[0]).toHaveProperty('id', 'teacher-1');
      expect(result.data[0]).toHaveProperty('firstName', 'Juan');
    });

    it('should apply search filter', async () => {
      prisma.teacher.findMany.mockResolvedValue([]);
      prisma.teacher.count.mockResolvedValue(0);

      await service.findAll({ search: 'Juan' });

      expect(prisma.teacher.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return teacher when found', async () => {
      prisma.teacher.findUnique.mockResolvedValue(rawTeacher);

      const result = await service.findById('teacher-1');

      expect(result).toHaveProperty('id', 'teacher-1');
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.teacher.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a teacher', async () => {
      prisma.teacher.create.mockResolvedValue(rawTeacher);

      const result = await service.create({ userId: 'user-1', employeeCode: 'DOC-001', hireDate: '2020-01-15', contractType: 'NOMBRADO' as any, tenantId: 'tenant-1' });

      expect(prisma.teacher.create).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'teacher-1');
    });
  });

  describe('update', () => {
    it('should update a teacher', async () => {
      prisma.teacher.update.mockResolvedValue({ ...rawTeacher, degree: 'Updated' });

      const result = await service.update('teacher-1', { degree: 'Updated' });

      expect(prisma.teacher.update).toHaveBeenCalledWith({ where: { id: 'teacher-1' }, data: { degree: 'Updated' } });
      expect(result.degree).toBe('Updated');
    });
  });

  describe('delete', () => {
    it('should delete a teacher', async () => {
      prisma.teacher.delete.mockResolvedValue(rawTeacher);

      const result = await service.delete('teacher-1');

      expect(prisma.teacher.delete).toHaveBeenCalledWith({ where: { id: 'teacher-1' } });
      expect(result.id).toBe('teacher-1');
    });
  });

  describe('getAssignments', () => {
    it('should return assignments', async () => {
      prisma.teacher.findUnique.mockResolvedValue(rawTeacher);
      prisma.teacherAssignment.findMany.mockResolvedValue([
        { courseId: 'c-1', course: { name: '1ro A', gradeLevel: { name: '1er Grado' } }, subjectId: 's-1', subject: { name: 'Matematicas' } },
      ]);

      const result = await service.getAssignments('teacher-1');

      expect(result).toHaveLength(1);
      expect(result[0].courseName).toBe('1ro A');
      expect(result[0].subjectName).toBe('Matematicas');
    });

    it('should throw NotFoundException when teacher not found', async () => {
      prisma.teacher.findUnique.mockResolvedValue(null);

      await expect(service.getAssignments('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
