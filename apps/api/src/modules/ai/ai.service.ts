import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly provider: string;

  constructor() {
    const provider = process.env.AI_PROVIDER || 'nvidia';
    this.provider = provider;

    if (provider === 'openai' && process.env.OPENAI_API_KEY) {
      this.baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
      this.apiKey = process.env.OPENAI_API_KEY;
      this.model = process.env.OPENAI_MODEL || 'gpt-4o';
    } else {
      this.baseUrl = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
      this.apiKey = process.env.NVIDIA_API_KEY || '';
      this.model = process.env.NVIDIA_MODEL || 'meta/llama-4-maverick';
    }
  }

  private get enabled(): boolean {
    return !!this.apiKey;
  }

  private async chat(systemPrompt: string, userPrompt: string, temperature = 0.7, maxTokens = 2048): Promise<string | null> {
    if (!this.enabled) return null;

    try {
      const { data } = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature,
          max_tokens: maxTokens,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );
      return data.choices?.[0]?.message?.content?.trim() || null;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } }; message?: string };
      this.logger.error(`NVIDIA API error: ${err.response?.data?.error?.message || err.message}`);
      return null;
    }
  }

  private extractJson(text: string): Record<string, unknown> | null {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
    const jsonStr = match?.[1] || match?.[0] || text;
    try {
      const parsed = JSON.parse(jsonStr);
      return typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }

  async generatePlanning(prompt: string): Promise<Record<string, unknown>> {
    const systemPrompt = `Eres un experto en planificación educativa del Ministerio de Educación de República Dominicana (MINERD).
Genera una planificación de unidad en formato JSON con esta estructura exacta:
{
  "unitTitle": "string",
  "unitNumber": number,
  "competencies": ["string"],
  "objectives": ["string"],
  "content": "string (texto detallado)",
  "methodology": "string",
  "resources": ["string"],
  "assessment": "string",
  "totalSessions": number,
  "sessions": [
    {
      "sessionNumber": number,
      "date": "string (YYYY-MM-DD)",
      "topic": "string",
      "activities": "string",
      "homework": "string"
    }
  ]
}
Responde ÚNICAMENTE con el JSON, sin explicaciones adicionales.`;

    const response = await this.chat(systemPrompt, prompt, 0.5, 4096);
    if (!response) return this.stubPlanning(prompt);

    const json = this.extractJson(response);
    if (json) return json;

    return {
      unitTitle: 'Unidad generada por IA',
      unitNumber: 1,
      competencies: ['Competencia generada por IA'],
      objectives: ['Objetivo generado por IA'],
      content: response,
      methodology: 'Metodología basada en sugerencias de IA',
      resources: ['Recurso generado por IA'],
      assessment: 'Evaluación generada por IA',
      totalSessions: 4,
      sessions: [],
      aiGenerated: true,
      aiPrompt: prompt,
    };
  }

  async assistGrading(params: { rubric: string; studentResponse: string; maxScore: number }): Promise<Record<string, unknown>> {
    const systemPrompt = `Eres un asistente de calificación educativa.
Evalúa la respuesta del estudiante usando la rúbrica proporcionada y devuelve un JSON con:
{
  "score": number (0-${params.maxScore}),
  "percentage": number (0-100),
  "feedback": "string (comentario detallado en español)",
  "strengths": ["string"],
  "weaknesses": ["string"]
}
Responde ÚNICAMENTE con el JSON.`;

    const userPrompt = `Rúbrica: ${params.rubric}\n\nRespuesta del estudiante: ${params.studentResponse}\n\nPuntaje máximo: ${params.maxScore}`;

    const response = await this.chat(systemPrompt, userPrompt, 0.3, 2048);
    if (!response) {
      return {
        score: 0,
        percentage: 0,
        feedback: 'No se pudo conectar con el servicio de IA. Configure NVIDIA_API_KEY en .env',
        strengths: [],
        weaknesses: [],
      };
    }

    const json = this.extractJson(response);
    if (json) return json;

    return {
      score: Math.round(params.maxScore * 0.7),
      percentage: 70,
      feedback: response,
      strengths: ['Respondió al intento'],
      weaknesses: ['No se pudo analizar completamente'],
    };
  }

  async predictRisk(studentData: { studentId?: string; attendance?: number; grades?: number[]; previousRisks?: string[] }): Promise<Record<string, unknown>> {
    const systemPrompt = `Eres un analista predictivo educativo.
Basado en los datos del estudiante, evalúa el riesgo académico y devuelve un JSON con:
{
  "riskScore": number (0-1),
  "riskLevel": "bajo" | "medio" | "alto",
  "factors": ["string (factor de riesgo detallado)"],
  "recommendations": ["string (recomendación)"]
}
Responde ÚNICAMENTE con el JSON.`;

    const userPrompt = `Datos del estudiante:\n${JSON.stringify(studentData, null, 2)}`;

    const response = await this.chat(systemPrompt, userPrompt, 0.4, 2048);
    if (!response) {
      return {
        riskScore: 0.3,
        riskLevel: 'bajo',
        factors: ['No se pudo conectar con el servicio de IA. Configure NVIDIA_API_KEY en .env'],
        recommendations: ['Configure la API de NVIDIA para obtener predicciones reales'],
      };
    }

    const json = this.extractJson(response);
    if (json) return json;

    return {
      riskScore: 0.3,
      riskLevel: 'bajo',
      factors: ['Análisis basado en respuesta textual de IA'],
      recommendations: ['Monitorear progreso del estudiante'],
    };
  }

  private stubPlanning(prompt: string): Record<string, unknown> {
    return {
      unitNumber: 1,
      unitTitle: 'Unidad Generada por IA (stub)',
      competencies: ['Competencia específica 1', 'Competencia específica 2'],
      objectives: ['Objetivo de aprendizaje 1', 'Objetivo de aprendizaje 2'],
      content: 'Contenido generado por IA basado en el currículo MINERD. Configure NVIDIA_API_KEY en .env para obtener respuestas reales.',
      methodology: 'Aprendizaje basado en proyectos, trabajo colaborativo, gamificación',
      resources: ['Plataforma educativa', 'Materiales manipulativos', 'Recursos digitales'],
      assessment: 'Rúbricas de evaluación, autoevaluación, coevaluación',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      aiGenerated: true,
      aiPrompt: prompt,
      fallback: true,
      note: 'Configure NVIDIA_API_KEY en el archivo .env para activar la generación con IA real.',
    };
  }
}
