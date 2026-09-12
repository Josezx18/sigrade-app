import { api as axiosInstance } from '../lib/api';
import { PaginatedResponse } from '../lib/types';

export interface Activity {
  id: string;
  title: string;
  description?: string;
  type: string;
  courseSubjectId: string;
  periodId: string;
  teacherId: string;
  dueDate?: string;
  maxScore: number;
  weight: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityDTO {
  title: string;
  description?: string;
  type: string;
  courseSubjectId: string;
  periodId: string;
  teacherId: string;
  dueDate?: string;
  maxScore?: number;
  weight?: number;
}

export type UpdateActivityDTO = Partial<CreateActivityDTO>;

export interface ActivityFilters {
  courseSubjectId?: string;
  periodId?: string;
  teacherId?: string;
  type?: string;
  isPublished?: boolean;
  page?: number;
  limit?: number;
}


export const activityApi = {
  list: async (filters: ActivityFilters = {}): Promise<PaginatedResponse<Activity>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.append(key, String(value));
    });
    const response = await axiosInstance.get<PaginatedResponse<Activity>>('/activities', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Activity> => {
    const response = await axiosInstance.get<Activity>(`/activities/${id}`);
    return response.data;
  },

  create: async (data: CreateActivityDTO): Promise<Activity> => {
    const response = await axiosInstance.post<Activity>('/activities', data);
    return response.data;
  },

  update: async (id: string, data: UpdateActivityDTO): Promise<Activity> => {
    const response = await axiosInstance.put<Activity>(`/activities/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/activities/${id}`);
  },

  togglePublish: async (id: string): Promise<Activity> => {
    const response = await axiosInstance.patch<Activity>(`/activities/${id}/publish`);
    return response.data;
  },
};
