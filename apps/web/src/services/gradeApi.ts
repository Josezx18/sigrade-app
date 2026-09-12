import { api as axiosInstance } from '../lib/api';
import { PaginatedResponse } from '../lib/types';

export interface Grade {
  id: string;
  studentId: string;
  studentName?: string;
  subjectId: string;
  subjectName?: string;
  teacherId: string;
  periodId: string;
  value: number;
  weight: number;
  comment?: string;
  evidenceUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GradeCreateDTO {
  studentId: string;
  subjectId: string;
  teacherId: string;
  periodId: string;
  value: number;
  weight?: number;
  comment?: string;
  evidenceUrl?: string;
}

export interface GradeFilters {
  studentId?: string;
  subjectId?: string;
  courseId?: string;
  periodId?: string;
  teacherId?: string;
  page?: number;
  limit?: number;
}


export const gradeApi = {
  list: async (filters: GradeFilters = {}): Promise<PaginatedResponse<Grade>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    const response = await axiosInstance.get<PaginatedResponse<Grade>>('/grades', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Grade> => {
    const response = await axiosInstance.get<Grade>(`/grades/${id}`);
    return response.data;
  },

  create: async (data: GradeCreateDTO): Promise<Grade> => {
    const response = await axiosInstance.post<Grade>('/grades', data);
    return response.data;
  },

  update: async (id: string, data: Partial<GradeCreateDTO>): Promise<Grade> => {
    const response = await axiosInstance.patch<Grade>(`/grades/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/grades/${id}`);
  },

  bulkCreate: async (grades: GradeCreateDTO[]): Promise<Grade[]> => {
    const response = await axiosInstance.post<Grade[]>('/grades/bulk', grades);
    return response.data;
  },
};
