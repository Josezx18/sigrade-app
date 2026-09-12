import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { StudentsService } from '../../src/modules/students/students.service';
import { PrismaService } from '@sigrade/shared-prisma';

const mockPrisma = {
  student: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
};

const mockStudent = {
  id: 'student-1',
  userId: 'user-1',
  studentCode: 'STU-001',
  firstName: 'Juan',
  lastName: 'Pérez',
  birthDate: new Date('2010-05-15'),
  gender: 'M',
  address: 'Calle 123',
  phone: '8091234567',
  emergencyContact: { nombre: 'María Pérez', telefono: '8099876543' },
  medicalInfo: null,
  tenantId: 'tenant-1',
  user: { id: 'user-1', email: 'juan@example.com', firstName: 'Juan', lastName: 'Pérez', dni: '001-1234567-8' },
  enrollments: [
    {
      id: 'enr-1',
      status: 'ACTIVE',
      enrolledAt: new Date('2024-09-01'),
      course: { id: 'course-1', name: '1ro A', gradeLevel: { id: 'grade-1', name: '1ro' } },
      schoolYear: { id: 'sy-1', name: '2024-2025' },
    },
  ],
};

describe('StudentsService', () => {
  let service: StudentsService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated students with filters', async () => {
      prisma.student.findMany.mockResolvedValue([mockStudent]);
      prisma.student.count.mockResolvedValue(1);

      const result = await service.findAll({ gradeId: 'grade-1' });

      expect(prisma.student.findMany).toHaveBeenCalled();
      expect(prisma.student.count).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should return students without filters', async () => {
      prisma.student.findMany.mockResolvedValue([mockStudent]);
      prisma.student.count.mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return a student by id', async () => {
      prisma.student.findUnique.mockResolvedValue(mockStudent);

      const result = await service.findById('student-1');

      expect(prisma.student.findUnique).toHaveBeenCalledWith({
        where: { id: 'student-1' },
        include: expect.objectContaining({
          user: expect.any(Object),
          enrollments: expect.any(Object),
        }),
      });
      expect(result.id).toBe('student-1');
    });

    it('should throw NotFoundException when student not found', async () => {
      prisma.student.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a student', async () => {
      const createData = {
        firstName: 'Ana',
        lastName: 'López',
        studentCode: 'EST-002',
        birthDate: '2011-03-20',
        gender: 'F' as const,
        address: 'Calle 123',
        tenantId: 'tenant-1',
      };
      const createdStudent = { id: 'student-2', ...createData, birthDate: new Date('2011-03-20'), studentCode: expect.stringContaining('EST-'), phone: '', emergencyContact: {} };
      prisma.student.create.mockResolvedValue(createdStudent);

      const result = await service.create(createData);

      expect(prisma.student.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          firstName: 'Ana',
          lastName: 'López',
          gender: 'F',
          tenantId: 'tenant-1',
        }),
      });
      expect(result.id).toBe('student-2');
    });
  });

  describe('update', () => {
    it('should update a student', async () => {
      prisma.student.findUnique.mockResolvedValue(mockStudent);
      const updatedStudent = { ...mockStudent, firstName: 'Juan Carlos' };
      prisma.student.update.mockResolvedValue(updatedStudent);

      const result = await service.update('student-1', { firstName: 'Juan Carlos' });

      expect(prisma.student.findUnique).toHaveBeenCalledWith({ where: { id: 'student-1' } });
      expect(prisma.student.update).toHaveBeenCalledWith({
        where: { id: 'student-1' },
        data: { firstName: 'Juan Carlos' },
      });
      expect(result.firstName).toBe('Juan Carlos');
    });

    it('should throw NotFoundException when student not found', async () => {
      prisma.student.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent', { firstName: 'Test' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a student', async () => {
      prisma.student.delete.mockResolvedValue(mockStudent);

      const result = await service.delete('student-1');

      expect(prisma.student.delete).toHaveBeenCalledWith({ where: { id: 'student-1' } });
      expect(result).toEqual(mockStudent);
    });
  });
});
