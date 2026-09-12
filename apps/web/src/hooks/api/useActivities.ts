import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activityApi, CreateActivityDTO, UpdateActivityDTO, ActivityFilters } from '../../services/activityApi';

export const activityKeys = {
  all: ['activities'] as const,
  lists: () => [...activityKeys.all, 'list'] as const,
  list: (filters: ActivityFilters) => [...activityKeys.lists(), filters] as const,
  details: () => [...activityKeys.all, 'detail'] as const,
  detail: (id: string) => [...activityKeys.details(), id] as const,
};

export function useActivities(filters: ActivityFilters = {}) {
  return useQuery({
    queryKey: activityKeys.list(filters),
    queryFn: () => activityApi.list(filters),
  });
}

export function useActivity(id: string) {
  return useQuery({
    queryKey: activityKeys.detail(id),
    queryFn: () => activityApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateActivityDTO) => activityApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
    },
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateActivityDTO }) => activityApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activityApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
    },
  });
}

export function useTogglePublishActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activityApi.togglePublish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
    },
  });
}
