import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { filesApi, FileUploadDTO, FileQuery } from '../../services/filesApi';

export const fileKeys = {
  all: ['files'] as const,
  lists: () => [...fileKeys.all, 'list'] as const,
  list: (query: FileQuery) => [...fileKeys.lists(), query] as const,
  details: () => [...fileKeys.all, 'detail'] as const,
  detail: (id: string) => [...fileKeys.details(), id] as const,
};

export function useFiles(query: FileQuery = {}) {
  return useQuery({
    queryKey: fileKeys.list(query),
    queryFn: () => filesApi.list(query),
  });
}

export function useFile(id: string) {
  return useQuery({
    queryKey: fileKeys.detail(id),
    queryFn: () => filesApi.getById(id),
    enabled: !!id,
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FileUploadDTO) => filesApi.upload(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileKeys.lists() });
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => filesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileKeys.lists() });
    },
  });
}
