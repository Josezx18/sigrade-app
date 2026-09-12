import { api as axiosInstance } from '../lib/api';
import { PaginatedResponse } from '../lib/types';

export interface RiskAlert {
  id: string;
  studentId: string;
  type: string;
  severity: string;
  status: string;
  title: string;
  description?: string;
  assignedToId?: string;
  createdById: string;
  createdAt: string;
  resolvedAt?: string;
  student?: { firstName: string; lastName: string };
  assignedTo?: { firstName: string; lastName: string };
}

export interface CreateRiskAlertDTO {
  studentId: string;
  type: string;
  severity: string;
  title: string;
  description?: string;
  assignedToId?: string;
}

export interface UpdateRiskAlertDTO {
  severity?: string;
  status?: string;
  description?: string;
  assignedToId?: string;
}

export interface RiskAlertFilters {
  type?: string;
  severity?: string;
  status?: string;
  studentId?: string;
  assignedToId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface CounselingCase {
  id: string;
  studentId: string;
  counselorId: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  student?: { firstName: string; lastName: string; studentCode?: string };
  counselor?: { firstName: string; lastName: string };
}

export interface CreateCounselingCaseDTO {
  studentId: string;
  counselorId: string;
  type: string;
}

export interface UpdateCounselingCaseDTO {
  status?: string;
  type?: string;
}

export interface CounselingCaseFilters {
  type?: string;
  status?: string;
  studentId?: string;
  counselorId?: string;
  page?: number;
  limit?: number;
}

export interface CounselingNote {
  id: string;
  caseId: string;
  authorId: string;
  content: string;
  isPrivate: boolean;
  createdAt: string;
}

export interface Intervention {
  id: string;
  caseId: string;
  type: string;
  description: string;
  startDate: string;
  endDate?: string;
  outcome?: string;
  responsibleId: string;
  createdAt: string;
}

export interface RiskDashboard {
  totalAlerts: number;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  recentAlerts: number;
}

export interface CounselingStats {
  totalCases: number;
  casesByStatus: Record<string, number>;
  casesByType: Record<string, number>;
  totalInterventions: number;
  criticalCases: number;
}


export const counselingApi = {
  // Risk Alerts
  listRiskAlerts: async (filters: RiskAlertFilters = {}): Promise<PaginatedResponse<RiskAlert>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.append(key, String(value));
    });
    const response = await axiosInstance.get<PaginatedResponse<RiskAlert>>('/counseling/risk-alerts', { params });
    return response.data;
  },

  getRiskAlert: async (id: string): Promise<RiskAlert> => {
    const response = await axiosInstance.get<RiskAlert>(`/counseling/risk-alerts/${id}`);
    return response.data;
  },

  createRiskAlert: async (data: CreateRiskAlertDTO): Promise<RiskAlert> => {
    const response = await axiosInstance.post<RiskAlert>('/counseling/risk-alerts', data);
    return response.data;
  },

  updateRiskAlert: async (id: string, data: UpdateRiskAlertDTO): Promise<RiskAlert> => {
    const response = await axiosInstance.put<RiskAlert>(`/counseling/risk-alerts/${id}`, data);
    return response.data;
  },

  deleteRiskAlert: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/counseling/risk-alerts/${id}`);
  },

  getRiskDashboard: async (): Promise<RiskDashboard> => {
    const response = await axiosInstance.get<RiskDashboard>('/counseling/risk-alerts/dashboard');
    return response.data;
  },

  // Counseling Cases
  listCases: async (filters: CounselingCaseFilters = {}): Promise<PaginatedResponse<CounselingCase>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.append(key, String(value));
    });
    const response = await axiosInstance.get<PaginatedResponse<CounselingCase>>('/counseling/cases', { params });
    return response.data;
  },

  getCase: async (id: string): Promise<CounselingCase> => {
    const response = await axiosInstance.get<CounselingCase>(`/counseling/cases/${id}`);
    return response.data;
  },

  createCase: async (data: CreateCounselingCaseDTO): Promise<CounselingCase> => {
    const response = await axiosInstance.post<CounselingCase>('/counseling/cases', data);
    return response.data;
  },

  updateCase: async (id: string, data: UpdateCounselingCaseDTO): Promise<CounselingCase> => {
    const response = await axiosInstance.put<CounselingCase>(`/counseling/cases/${id}`, data);
    return response.data;
  },

  deleteCase: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/counseling/cases/${id}`);
  },

  // Notes
  getNotes: async (caseId: string): Promise<CounselingNote[]> => {
    const response = await axiosInstance.get<CounselingNote[]>(`/counseling/cases/${caseId}/notes`);
    return response.data;
  },

  createNote: async (caseId: string, content: string, isPrivate = false): Promise<CounselingNote> => {
    const response = await axiosInstance.post<CounselingNote>(`/counseling/cases/${caseId}/notes`, { content, isPrivate });
    return response.data;
  },

  // Interventions
  getInterventions: async (caseId: string): Promise<Intervention[]> => {
    const response = await axiosInstance.get<Intervention[]>(`/counseling/cases/${caseId}/interventions`);
    return response.data;
  },

  // Stats
  getStats: async (): Promise<CounselingStats> => {
    const response = await axiosInstance.get<CounselingStats>('/counseling/stats');
    return response.data;
  },
};
