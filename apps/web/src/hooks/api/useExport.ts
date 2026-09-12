import { useMutation } from '@tanstack/react-query';
import { exportApi, ExportRequest } from '../../services/exportApi';

export function useExportCsv() {
  return useMutation({
    mutationFn: (data: ExportRequest) => exportApi.exportCsv(data),
  });
}

export function useExportXlsx() {
  return useMutation({
    mutationFn: (data: ExportRequest) => exportApi.exportXlsx(data),
  });
}

export function useExportPdf() {
  return useMutation({
    mutationFn: (data: ExportRequest) => exportApi.exportPdf(data),
  });
}
