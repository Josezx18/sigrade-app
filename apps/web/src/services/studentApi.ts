import { api as axiosInstance } from '../lib/api';
import { PaginatedResponse } from '../lib/types';

export interface Student {
  id: string;
  studentCode?: string;
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  phone?: string;
  birthDate: string;
  gender: 'M' | 'F';
  gradeId: string;
  gradeName?: string;
  section?: string;
  enrollmentDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'TRANSFERRED';
  address?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentCreateDTO {
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  phone?: string;
  birthDate: string;
  gender: 'M' | 'F';
  gradeId: string;
  section?: string;
  enrollmentDate: string;
  address?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
}

export type StudentUpdateDTO = Partial<StudentCreateDTO>

export interface StudentFilters {
  search?: string;
  gradeId?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}


export const studentApi = {
  list: async (filters: StudentFilters = {}): Promise<PaginatedResponse<Student>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    const response = await axiosInstance.get<PaginatedResponse<Student>>('/students', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Student> => {
    const response = await axiosInstance.get<Student>(`/students/${id}`);
    return response.data;
  },

  create: async (data: StudentCreateDTO): Promise<Student> => {
    const response = await axiosInstance.post<Student>('/students', data);
    return response.data;
  },

  update: async (id: string, data: StudentUpdateDTO): Promise<Student> => {
    const response = await axiosInstance.patch<Student>(`/students/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/students/${id}`);
  },

  bulkDelete: async (ids: string[]): Promise<void> => {
    await axiosInstance.post('/students/bulk-delete', { ids });
  },

  export: async (filters: StudentFilters = {}): Promise<Blob> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    const response = await axiosInstance.get('/students/export', { 
      params,
      responseType: 'blob'
    });
    return response.data;
  },
};

export const gradeApi = {
  list: async (): Promise<{ id: string; name: string; level: string }[]> => {
    const response = await axiosInstance.get('/academic/grade-levels');
    return response.data;
  },
};