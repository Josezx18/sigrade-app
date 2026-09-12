import { api as axiosInstance } from '../lib/api';
import { PaginatedResponse } from '../lib/types';

export interface Evidence {
  id: string;
  activityId: string;
  studentId: string;
  fileUrl?: string;
  description?: string;
  grade?: number;
  gradedBy?: string;
  gradedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEvidenceDTO {
  activityId: string;
  studentId: string;
  fileUrl?: string;
  description?: string;
}

export interface GradeEvidenceDTO {
  grade: number;
  gradedBy: string;
}

export interface EvidenceFilters {
  activityId?: string;
  studentId?: string;
  graded?: boolean;
  page?: number;
  limit?: number;
}


export const evidenceApi = {
  list: async (filters: EvidenceFilters = {}): Promise<PaginatedResponse<Evidence>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.append(key, String(value));
    });
    const response = await axiosInstance.get<PaginatedResponse<Evidence>>('/evidences', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Evidence> => {
    const response = await axiosInstance.get<Evidence>(`/evidences/${id}`);
    return response.data;
  },

  create: async (data: CreateEvidenceDTO): Promise<Evidence> => {
    const response = await axiosInstance.post<Evidence>('/evidences', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateEvidenceDTO>): Promise<Evidence> => {
    const response = await axiosInstance.put<Evidence>(`/evidences/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/evidences/${id}`);
  },

  grade: async (id: string, data: GradeEvidenceDTO): Promise<Evidence> => {
    const response = await axiosInstance.patch<Evidence>(`/evidences/${id}/grade`, data);
    return response.data;
  },
};
