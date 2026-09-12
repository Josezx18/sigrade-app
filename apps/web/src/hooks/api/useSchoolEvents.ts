import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schoolEventsApi, CreateEventDTO, EventQuery } from '../../services/schoolEventsApi';

export const schoolEventKeys = {
  all: ['school-events'] as const,
  lists: () => [...schoolEventKeys.all, 'list'] as const,
  list: (query: EventQuery) => [...schoolEventKeys.lists(), query] as const,
  details: () => [...schoolEventKeys.all, 'detail'] as const,
  detail: (id: string) => [...schoolEventKeys.details(), id] as const,
};

export function useSchoolEvents(query: EventQuery = {}) {
  return useQuery({
    queryKey: schoolEventKeys.list(query),
    queryFn: () => schoolEventsApi.list(query),
  });
}

export function useSchoolEvent(id: string) {
  return useQuery({
    queryKey: schoolEventKeys.detail(id),
    queryFn: () => schoolEventsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateSchoolEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEventDTO) => schoolEventsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schoolEventKeys.lists() });
    },
  });
}

export function useUpdateSchoolEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateEventDTO> }) => schoolEventsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schoolEventKeys.lists() });
    },
  });
}

export function useDeleteSchoolEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => schoolEventsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schoolEventKeys.lists() });
    },
  });
}
