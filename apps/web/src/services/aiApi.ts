import { api as axiosInstance } from '../lib/api';

export interface AIPlanningResult {
  unitTitle: string;
  unitNumber?: number;
  competencies?: string[];
  objectives?: string[];
  content?: string;
  methodology?: string;
  resources?: string[];
  assessment?: string;
  totalSessions?: number;
  sessions?: {
    sessionNumber: number;
    topic: string;
    activities?: string;
    homework?: string;
  }[];
  aiGenerated?: boolean;
  aiPrompt?: string;
  fallback?: boolean;
  note?: string;
}

export interface AIGradeResult {
  score: number;
  percentage?: number;
  feedback: string;
  strengths?: string[];
  weaknesses?: string[];
}

export interface AIRiskResult {
  riskScore: number;
  riskLevel: string;
  factors?: string[];
  recommendations?: string[];
}

export interface GradeAssistRequest {
  rubric: string;
  studentResponse: string;
  maxScore: number;
}

export interface PredictRiskRequest {
  studentId: string;
  periodId: string;
}

export const aiApi = {
  generatePlanning: async (prompt: string): Promise<AIPlanningResult> => {
    const response = await axiosInstance.post<AIPlanningResult>('/ai/planning/generate', { prompt });
    return response.data;
  },

  gradeAssist: async (data: GradeAssistRequest): Promise<AIGradeResult> => {
    const response = await axiosInstance.post<AIGradeResult>('/ai/grading/assist', data);
    return response.data;
  },

  predictRisk: async (data: PredictRiskRequest): Promise<AIRiskResult> => {
    const response = await axiosInstance.post<AIRiskResult>('/ai/predict/risk', data);
    return response.data;
  },
};