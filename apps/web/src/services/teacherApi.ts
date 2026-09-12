import { api as axiosInstance } from '../lib/api';
import { PaginatedResponse } from '../lib/types';

export interface Teacher {
  id: string;
  userId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  degree: string;
  specialization: string;
  hireDate: string;
  contractType: string;
  isActive: boolean;
  subjects?: { id: string; name: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface TeacherCreateDTO {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dni: string;
  degree: string;
  specialization: string;
  hireDate: string;
  contractType: string;
  subjectIds?: string[];
}

export type TeacherUpdateDTO = Partial<TeacherCreateDTO>

export interface TeacherFilters {
  search?: string;
  isActive?: boolean;
  contractType?: string;
  specialization?: string;
  page?: number;
  limit?: number;
}


export const teacherApi = {
  list: async (filters: TeacherFilters = {}): Promise<PaginatedResponse<Teacher>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    const response = await axiosInstance.get<PaginatedResponse<Teacher>>('/teachers', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Teacher> => {
    const response = await axiosInstance.get<Teacher>(`/teachers/${id}`);
    return response.data;
  },

  create: async (data: TeacherCreateDTO): Promise<Teacher> => {
    const response = await axiosInstance.post<Teacher>('/teachers', data);
    return response.data;
  },

  update: async (id: string, data: TeacherUpdateDTO): Promise<Teacher> => {
    const response = await axiosInstance.patch<Teacher>(`/teachers/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/teachers/${id}`);
  },

  getAssignments: async (id: string): Promise<{ courseId: string; courseName: string; subjectId: string; subjectName: string }[]> => {
    const response = await axiosInstance.get(`/teachers/${id}/assignments`);
    return response.data;
  },
};
