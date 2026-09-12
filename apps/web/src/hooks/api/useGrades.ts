import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gradeApi, GradeCreateDTO, GradeFilters } from '../../services/gradeApi';

export const gradeKeys = {
  all: ['grades'] as const,
  lists: () => [...gradeKeys.all, 'list'] as const,
  list: (filters: GradeFilters) => [...gradeKeys.lists(), filters] as const,
  details: () => [...gradeKeys.all, 'detail'] as const,
  detail: (id: string) => [...gradeKeys.details(), id] as const,
};

export function useGrades(filters: GradeFilters = {}) {
  return useQuery({
    queryKey: gradeKeys.list(filters),
    queryFn: () => gradeApi.list(filters),
  });
}

export function useGrade(id: string) {
  return useQuery({
    queryKey: gradeKeys.detail(id),
    queryFn: () => gradeApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateGrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GradeCreateDTO) => gradeApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.lists() });
    },
  });
}

export function useUpdateGrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GradeCreateDTO> }) => gradeApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.lists() });
    },
  });
}

export function useDeleteGrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => gradeApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.lists() });
    },
  });
}

export function useBulkCreateGrades() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (grades: GradeCreateDTO[]) => gradeApi.bulkCreate(grades),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.lists() });
    },
  });
}
