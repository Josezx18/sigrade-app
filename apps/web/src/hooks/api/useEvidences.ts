import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { evidenceApi, CreateEvidenceDTO, GradeEvidenceDTO, EvidenceFilters } from '../../services/evidenceApi';

export const evidenceKeys = {
  all: ['evidences'] as const,
  lists: () => [...evidenceKeys.all, 'list'] as const,
  list: (filters: EvidenceFilters) => [...evidenceKeys.lists(), filters] as const,
  details: () => [...evidenceKeys.all, 'detail'] as const,
  detail: (id: string) => [...evidenceKeys.details(), id] as const,
};

export function useEvidences(filters: EvidenceFilters = {}) {
  return useQuery({
    queryKey: evidenceKeys.list(filters),
    queryFn: () => evidenceApi.list(filters),
  });
}

export function useEvidence(id: string) {
  return useQuery({
    queryKey: evidenceKeys.detail(id),
    queryFn: () => evidenceApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateEvidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEvidenceDTO) => evidenceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evidenceKeys.lists() });
    },
  });
}

export function useUpdateEvidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateEvidenceDTO> }) => evidenceApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evidenceKeys.lists() });
    },
  });
}

export function useDeleteEvidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => evidenceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evidenceKeys.lists() });
    },
  });
}

export function useGradeEvidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: GradeEvidenceDTO }) => evidenceApi.grade(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evidenceKeys.lists() });
    },
  });
}
