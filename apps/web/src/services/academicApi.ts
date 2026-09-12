import { api as axiosInstance } from '../lib/api';
import { PaginatedResponse } from '../lib/types';

export interface SchoolYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicPeriod {
  id: string;
  name: string;
  schoolYearId: string;
  startDate: string;
  endDate: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GradeLevel {
  id: string;
  name: string;
  code: string;
  level: number;
  order: number;
  createdAt: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  area: string;
  description?: string;
  gradeLevelId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolYearCreateDTO {
  name: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export interface AcademicPeriodCreateDTO {
  name: string;
  schoolYearId: string;
  startDate: string;
  endDate: string;
  order: number;
  isActive?: boolean;
}

export interface SubjectFilters {
  area?: string;
  search?: string;
  gradeLevelId?: string;
  page?: number;
  limit?: number;
}


export const academicApi = {
  // School Years
  listSchoolYears: async (): Promise<SchoolYear[]> => {
    const response = await axiosInstance.get<SchoolYear[]>('/academic/school-years');
    return response.data;
  },

  getSchoolYear: async (id: string): Promise<SchoolYear> => {
    const response = await axiosInstance.get<SchoolYear>(`/academic/school-years/${id}`);
    return response.data;
  },

  createSchoolYear: async (data: SchoolYearCreateDTO): Promise<SchoolYear> => {
    const response = await axiosInstance.post<SchoolYear>('/academic/school-years', data);
    return response.data;
  },

  updateSchoolYear: async (id: string, data: Partial<SchoolYearCreateDTO>): Promise<SchoolYear> => {
    const response = await axiosInstance.put<SchoolYear>(`/academic/school-years/${id}`, data);
    return response.data;
  },

  deleteSchoolYear: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/academic/school-years/${id}`);
  },

  // Academic Periods
  listPeriods: async (schoolYearId?: string, isActive?: boolean): Promise<AcademicPeriod[]> => {
    const params = new URLSearchParams();
    if (isActive !== undefined) params.append('isActive', String(isActive));
    const url = schoolYearId
      ? `/academic/school-years/${schoolYearId}/periods`
      : '/periods';
    const response = await axiosInstance.get<AcademicPeriod[]>(url, { params });
    return response.data;
  },

  getPeriod: async (id: string): Promise<AcademicPeriod> => {
    const response = await axiosInstance.get<AcademicPeriod>(`/periods/${id}`);
    return response.data;
  },

  createPeriod: async (data: AcademicPeriodCreateDTO): Promise<AcademicPeriod> => {
    const response = await axiosInstance.post<AcademicPeriod>('/periods', data);
    return response.data;
  },

  updatePeriod: async (id: string, data: Partial<AcademicPeriodCreateDTO>): Promise<AcademicPeriod> => {
    const response = await axiosInstance.put<AcademicPeriod>(`/periods/${id}`, data);
    return response.data;
  },

  deletePeriod: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/academic/periods/${id}`);
  },

  // Grade Levels
  listGradeLevels: async (): Promise<GradeLevel[]> => {
    const response = await axiosInstance.get<GradeLevel[]>('/academic/grade-levels');
    return response.data;
  },

  // Subjects
  listSubjects: async (filters: SubjectFilters = {}): Promise<PaginatedResponse<Subject>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.append(key, String(value));
    });
    const response = await axiosInstance.get<PaginatedResponse<Subject>>('/academic/subjects', { params });
    return response.data;
  },

  getSubject: async (id: string): Promise<Subject> => {
    const response = await axiosInstance.get<Subject>(`/academic/subjects/${id}`);
    return response.data;
  },
};
