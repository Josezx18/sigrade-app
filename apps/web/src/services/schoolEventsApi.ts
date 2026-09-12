import { api as axiosInstance } from '../lib/api';
import { PaginatedResponse } from '../lib/types';

export interface SchoolEvent {
  id: string;
  title: string;
  description?: string;
  type: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  courseId?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventDTO {
  title: string;
  description?: string;
  type: string;
  startDate: string;
  endDate: string;
  allDay?: boolean;
  courseId?: string;
}

export interface EventQuery {
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  courseId?: string;
  page?: number;
  limit?: number;
}


export const schoolEventsApi = {
  list: async (query: EventQuery = {}): Promise<PaginatedResponse<SchoolEvent>> => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.append(key, String(value));
    });
    const response = await axiosInstance.get<PaginatedResponse<SchoolEvent>>('/school-events', { params });
    return response.data;
  },

  getById: async (id: string): Promise<SchoolEvent> => {
    const response = await axiosInstance.get<SchoolEvent>(`/school-events/${id}`);
    return response.data;
  },

  create: async (data: CreateEventDTO): Promise<SchoolEvent> => {
    const response = await axiosInstance.post<SchoolEvent>('/school-events', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateEventDTO>): Promise<SchoolEvent> => {
    const response = await axiosInstance.patch<SchoolEvent>(`/school-events/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/school-events/${id}`);
  },
};
