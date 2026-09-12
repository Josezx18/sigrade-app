import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from '../../src/modules/ai/ai.service';

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiService],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  describe('generatePlanning', () => {
    it('should return stub planning when no API key', async () => {
      const result = await service.generatePlanning('Crear planificación de fracciones');

      expect(result).toBeDefined();
      expect(result.unitTitle).toContain('Generada por IA');
      expect(result.aiGenerated).toBe(true);
      expect(result.fallback).toBe(true);
    });

    it('should handle empty prompt', async () => {
      const result = await service.generatePlanning('');

      expect(result).toBeDefined();
      expect(result.aiPrompt).toBe('');
    });
  });

  describe('assistGrading', () => {
    it('should return fallback grading when no API key', async () => {
      const result = await service.assistGrading({
        rubric: 'Rúbrica de matemáticas',
        studentResponse: 'Respuesta del estudiante',
        maxScore: 100,
      });

      expect(result).toBeDefined();
      expect(result.score).toBe(0);
      expect(result.percentage).toBe(0);
      expect(result.feedback).toContain('No se pudo conectar');
    });
  });

  describe('predictRisk', () => {
    it('should return fallback risk prediction when no API key', async () => {
      const result = await service.predictRisk({
        studentId: 's-1',
        attendance: 0.8,
        grades: [85, 90],
      });

      expect(result).toBeDefined();
      expect(result.riskScore).toBe(0.3);
      expect(result.riskLevel).toBe('bajo');
      expect((result.factors as string[])[0]).toContain('No se pudo conectar');
    });

    it('should return consistent response structure', async () => {
      const result = await service.predictRisk({});

      expect(result).toHaveProperty('riskScore');
      expect(result).toHaveProperty('factors');
      expect(Array.isArray(result.factors as Array<unknown>)).toBe(true);
    });
  });
});
