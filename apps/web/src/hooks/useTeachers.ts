import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherApi, Teacher, TeacherCreateDTO, TeacherUpdateDTO, TeacherFilters } from '../services/teacherApi';

export const teacherKeys = {
  all: ['teachers'] as const,
  lists: () => [...teacherKeys.all, 'list'] as const,
  list: (filters: TeacherFilters) => [...teacherKeys.lists(), filters] as const,
  details: () => [...teacherKeys.all, 'detail'] as const,
  detail: (id: string) => [...teacherKeys.details(), id] as const,
};

export function useTeachers(filters: TeacherFilters = {}) {
  return useQuery({
    queryKey: teacherKeys.list(filters),
    queryFn: () => teacherApi.list(filters),
  });
}

export function useTeacher(id: string) {
  return useQuery({
    queryKey: teacherKeys.detail(id),
    queryFn: () => teacherApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TeacherCreateDTO) => teacherApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
    },
  });
}

export function useUpdateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TeacherUpdateDTO }) => teacherApi.update(id, data),
    onSuccess: (updatedTeacher: Teacher) => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
      queryClient.setQueryData(teacherKeys.detail(updatedTeacher.id), updatedTeacher);
    },
  });
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teacherApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
    },
  });
}
