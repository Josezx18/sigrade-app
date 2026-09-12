import { api as axiosInstance } from '../lib/api';
import { PaginatedResponse } from '../lib/types';

export interface Planning {
  id: string;
  teacherId: string;
  courseSubjectId: string;
  periodId: string;
  title: string;
  description?: string;
  objectives?: string;
  methodology?: string;
  resources?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  totalSessions?: number;
  teacher?: { id: string; user: { firstName: string; lastName: string } };
  courseSubject?: { id: string; course: { name: string; gradeLevel: { name: string } }; subject: { name: string } };
  period?: { id: string; name: string; schoolYear: { name: string } };
  sessions?: PlanningSession[];
  createdAt: string;
  updatedAt: string;
}

export interface PlanningSession {
  id: string;
  planningId: string;
  sessionNumber: number;
  date: string;
  startTime: string;
  endTime: string;
  topic: string;
  activities?: string;
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED';
  observation?: string;
  evidence?: { id: string; file: { url: string; name: string } }[];
}

export interface PlanningCreateDTO {
  teacherId: string;
  courseSubjectId: string;
  periodId: string;
  title: string;
  description?: string;
  objectives?: string;
  methodology?: string;
  resources?: string;
  totalSessions?: number;
}

export interface PlanningFilters {
  teacherId?: string;
  courseSubjectId?: string;
  periodId?: string;
  status?: string;
  page?: number;
  limit?: number;
}


export const planningApi = {
  list: async (filters: PlanningFilters = {}): Promise<PaginatedResponse<Planning>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.append(key, String(value));
    });
    const response = await axiosInstance.get<PaginatedResponse<Planning>>('/planning', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Planning> => {
    const response = await axiosInstance.get<Planning>(`/planning/${id}`);
    return response.data;
  },

  create: async (data: PlanningCreateDTO): Promise<Planning> => {
    const response = await axiosInstance.post<Planning>('/planning', data);
    return response.data;
  },

  update: async (id: string, data: Partial<PlanningCreateDTO>): Promise<Planning> => {
    const response = await axiosInstance.put<Planning>(`/planning/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/planning/${id}`);
  },

  submitForApproval: async (id: string): Promise<Planning> => {
    const response = await axiosInstance.put<Planning>(`/planning/${id}/submit`);
    return response.data;
  },

  approve: async (id: string): Promise<Planning> => {
    const response = await axiosInstance.put<Planning>(`/planning/${id}/approve`);
    return response.data;
  },

  reject: async (id: string): Promise<Planning> => {
    const response = await axiosInstance.put<Planning>(`/planning/${id}/reject`);
    return response.data;
  },
};
