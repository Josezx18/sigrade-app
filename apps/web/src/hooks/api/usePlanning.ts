import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { planningApi, Planning, PlanningCreateDTO, PlanningFilters } from '../../services/planningApi';

export const planningKeys = {
  all: ['planning'] as const,
  lists: () => [...planningKeys.all, 'list'] as const,
  list: (filters: PlanningFilters) => [...planningKeys.lists(), filters] as const,
  details: () => [...planningKeys.all, 'detail'] as const,
  detail: (id: string) => [...planningKeys.details(), id] as const,
  sessions: (planningId: string) => [...planningKeys.all, 'sessions', planningId] as const,
  stats: (teacherId: string) => [...planningKeys.all, 'stats', teacherId] as const,
};

export function usePlannings(filters: PlanningFilters = {}) {
  return useQuery({
    queryKey: planningKeys.list(filters),
    queryFn: () => planningApi.list(filters),
  });
}

export function usePlanning(id: string) {
  return useQuery({
    queryKey: planningKeys.detail(id),
    queryFn: () => planningApi.getById(id),
    enabled: !!id,
  });
}

export function useCreatePlanning() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PlanningCreateDTO) => planningApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: planningKeys.lists() }),
  });
}

export function useUpdatePlanning() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PlanningCreateDTO> }) => planningApi.update(id, data),
    onSuccess: (updated: Planning) => {
      queryClient.invalidateQueries({ queryKey: planningKeys.lists() });
      queryClient.setQueryData(planningKeys.detail(updated.id), updated);
    },
  });
}

export function useDeletePlanning() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => planningApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: planningKeys.lists() }),
  });
}

export function usePlanningSessions(planningId: string) {
  return useQuery({
    queryKey: planningKeys.sessions(planningId),
    queryFn: () => planningApi.getById(planningId).then(p => p.sessions ?? []),
    enabled: !!planningId,
  });
}

export function useSubmitPlanning() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => planningApi.submitForApproval(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: planningKeys.lists() }),
  });
}

export function useApprovePlanning() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => planningApi.approve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: planningKeys.lists() }),
  });
}

export function useRejectPlanning() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => planningApi.reject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: planningKeys.lists() }),
  });
}

export function usePlanningStats(teacherId: string) {
  return useQuery({
    queryKey: planningKeys.stats(teacherId),
    queryFn: () => planningApi.list({ teacherId }).then(r => ({
      totalPlannings: r.total,
      byStatus: {} as Record<string, number>,
      aiGenerated: 0,
      totalSessions: 0,
      executedSessions: 0,
      executionRate: 0,
    })),
    enabled: !!teacherId,
  });
}
