import { api as axiosInstance } from '../lib/api';
import { PaginatedResponse } from '../lib/types';

export interface FileItem {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  bucket: string;
  objectKey: string;
  url?: string;
  uploadedById: string;
  gradeId?: string | null;
  sessionId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FileUploadDTO {
  file: File;
  gradeId?: string;
  sessionId?: string;
}

export interface FileQuery {
  gradeId?: string;
  sessionId?: string;
  page?: number;
  limit?: number;
}


export const filesApi = {
  list: async (query: FileQuery = {}): Promise<PaginatedResponse<FileItem>> => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.append(key, String(value));
    });
    const response = await axiosInstance.get<PaginatedResponse<FileItem>>('/files', { params });
    return response.data;
  },

  getById: async (id: string): Promise<FileItem> => {
    const response = await axiosInstance.get<FileItem>(`/files/${id}`);
    return response.data;
  },

  upload: async (data: FileUploadDTO): Promise<FileItem> => {
    const formData = new FormData();
    formData.append('file', data.file);
    if (data.gradeId) formData.append('gradeId', data.gradeId);
    if (data.sessionId) formData.append('sessionId', data.sessionId);
    const response = await axiosInstance.post<FileItem>('/files', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/files/${id}`);
  },
};