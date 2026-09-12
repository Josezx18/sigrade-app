import { Test, TestingModule } from '@nestjs/testing';
import { GradesService } from '../../src/modules/grades/grades.service';
import { PrismaService } from '@sigrade/shared-prisma';

const mockPrisma = {
  grade: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
};

const mockGrade = {
  id: 'grade-1',
  studentId: 'student-1',
  courseSubjectId: 'cs-1',
  periodId: 'period-1',
  type: 'EXAM',
  name: 'Examen Parcial 1',
  description: 'Evaluación de matemáticas',
  maxScore: 100,
  score: 85,
  weight: 1,
  gradedAt: new Date('2024-10-15'),
  gradedById: 'teacher-1',
  evidenceFiles: [],
  aiAssisted: false,
  aiAnalysis: null,
  createdAt: new Date('2024-10-15'),
  updatedAt: new Date('2024-10-15'),
  student: { id: 'student-1', firstName: 'Juan', lastName: 'Pérez' },
  courseSubject: {
    id: 'cs-1',
    subjectId: 'subj-1',
    courseId: 'course-1',
    subject: { id: 'subj-1', name: 'Matemáticas' },
    course: { id: 'course-1' },
  },
  gradedBy: { id: 'teacher-1', firstName: 'María', lastName: 'López' },
};

describe('GradesService', () => {
  let service: GradesService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<GradesService>(GradesService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated grades with filters', async () => {
      prisma.grade.findMany.mockResolvedValue([mockGrade]);
      prisma.grade.count.mockResolvedValue(1);

      const result = await service.findAll({ studentId: 'student-1', subjectId: 'subj-1' });

      expect(prisma.grade.findMany).toHaveBeenCalled();
      expect(prisma.grade.count).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should return all grades when no filters provided', async () => {
      prisma.grade.findMany.mockResolvedValue([mockGrade]);
      prisma.grade.count.mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return a grade by id', async () => {
      prisma.grade.findUnique.mockResolvedValue(mockGrade);

      const result = await service.findById('grade-1');

      expect(prisma.grade.findUnique).toHaveBeenCalledWith({
        where: { id: 'grade-1' },
        include: expect.objectContaining({
          student: expect.any(Object),
          courseSubject: expect.any(Object),
          gradedBy: expect.any(Object),
        }),
      });
      expect(result.id).toBe('grade-1');
    });

    it('should throw NotFoundException when grade not found', async () => {
      prisma.grade.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow('Calificación no encontrada');
    });
  });

  describe('create', () => {
    it('should create a grade', async () => {
      const gradeData = { studentId: 'student-1', subjectId: 'cs-1', periodId: 'period-1', teacherId: 'teacher-1', value: 85, comment: 'Buen trabajo' };
      const createdGrade = { id: 'grade-2', ...gradeData };

      prisma.grade.create.mockResolvedValue(createdGrade);

      const result = await service.create(gradeData);

      expect(prisma.grade.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          studentId: 'student-1',
          courseSubjectId: 'cs-1',
          periodId: 'period-1',
          gradedById: 'teacher-1',
          score: 85,
          description: 'Buen trabajo',
        }),
      });
      expect(result.id).toBe('grade-2');
    });
  });

  describe('update', () => {
    it('should update a grade', async () => {
      prisma.grade.findUnique.mockResolvedValue(mockGrade);
      const updatedGrade = { ...mockGrade, score: 90 };
      prisma.grade.update.mockResolvedValue(updatedGrade);

      const result = await service.update('grade-1', { value: 90 });

      expect(prisma.grade.findUnique).toHaveBeenCalledWith({ where: { id: 'grade-1' } });
      expect(prisma.grade.update).toHaveBeenCalledWith({
        where: { id: 'grade-1' },
        data: { score: 90 },
      });
      expect(result.score).toBe(90);
    });

    it('should throw NotFoundException when grade not found', async () => {
      prisma.grade.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent', { value: 90 })).rejects.toThrow('Calificación no encontrada');
    });
  });

  describe('delete', () => {
    it('should delete a grade', async () => {
      prisma.grade.findUnique.mockResolvedValue(mockGrade);
      prisma.grade.delete.mockResolvedValue(mockGrade);

      const result = await service.delete('grade-1');

      expect(prisma.grade.findUnique).toHaveBeenCalledWith({ where: { id: 'grade-1' } });
      expect(prisma.grade.delete).toHaveBeenCalledWith({ where: { id: 'grade-1' } });
      expect(result).toEqual(mockGrade);
    });

    it('should throw NotFoundException when grade not found', async () => {
      prisma.grade.findUnique.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow('Calificación no encontrada');
    });
  });
});