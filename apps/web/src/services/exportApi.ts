import { api as axiosInstance } from '../lib/api';

export interface ExportRequest {
  data: Record<string, unknown>[];
  filename?: string;
}

export const exportApi = {
  exportCsv: async (data: ExportRequest): Promise<Blob> => {
    const response = await axiosInstance.post('/export/csv', data, { responseType: 'blob' });
    return response.data;
  },

  exportXlsx: async (data: ExportRequest): Promise<Blob> => {
    const response = await axiosInstance.post('/export/xlsx', data, { responseType: 'blob' });
    return response.data;
  },

  exportPdf: async (data: ExportRequest): Promise<Blob> => {
    const response = await axiosInstance.post('/export/pdf', data, { responseType: 'blob' });
    return response.data;
  },
};