import { api as axiosInstance } from '../lib/api';
import { PaginatedResponse } from '../lib/types';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName?: string;
  courseId: string;
  subjectId?: string;
  subjectName?: string;
  date: string;
  hour?: number;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  justification?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceCreateDTO {
  studentId: string;
  courseId: string;
  subjectId?: string;
  date: string;
  hour?: number;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  justification?: string;
}

export interface AttendanceFilters {
  courseId?: string;
  subjectId?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  studentId?: string;
  status?: string;
  page?: number;
  limit?: number;
}


export const attendanceApi = {
  list: async (filters: AttendanceFilters = {}): Promise<PaginatedResponse<AttendanceRecord>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    const response = await axiosInstance.get<PaginatedResponse<AttendanceRecord>>('/attendance', { params });
    return response.data;
  },

  getById: async (id: string): Promise<AttendanceRecord> => {
    const response = await axiosInstance.get<AttendanceRecord>(`/attendance/${id}`);
    return response.data;
  },

  create: async (data: AttendanceCreateDTO): Promise<AttendanceRecord> => {
    const response = await axiosInstance.post<AttendanceRecord>('/attendance', data);
    return response.data;
  },

  update: async (id: string, data: Partial<AttendanceCreateDTO>): Promise<AttendanceRecord> => {
    const response = await axiosInstance.patch<AttendanceRecord>(`/attendance/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/attendance/${id}`);
  },

  bulkCreate: async (records: AttendanceCreateDTO[]): Promise<AttendanceRecord[]> => {
    const response = await axiosInstance.post<AttendanceRecord[]>('/attendance/bulk', records);
    return response.data;
  },
};
