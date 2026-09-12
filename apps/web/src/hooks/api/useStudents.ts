import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi, Student, StudentCreateDTO, StudentUpdateDTO, StudentFilters } from '../../services/studentApi';

export const studentKeys = {
  all: ['students'] as const,
  lists: () => [...studentKeys.all, 'list'] as const,
  list: (filters: StudentFilters) => [...studentKeys.lists(), filters] as const,
  details: () => [...studentKeys.all, 'detail'] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
};

export function useStudents(filters: StudentFilters = {}) {
  return useQuery({
    queryKey: studentKeys.list(filters),
    queryFn: () => studentApi.list(filters),
    placeholderData: (previousData) => previousData,
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: () => studentApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StudentCreateDTO) => studentApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StudentUpdateDTO }) => studentApi.update(id, data),
    onSuccess: (updatedStudent: Student) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      queryClient.setQueryData(studentKeys.detail(updatedStudent.id), updatedStudent);
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
}

export function useBulkDeleteStudents() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => studentApi.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
}
