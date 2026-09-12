import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  counselingApi,
  RiskAlertFilters,
  CounselingCaseFilters,
  CreateRiskAlertDTO,
  UpdateRiskAlertDTO,
  CreateCounselingCaseDTO,
  UpdateCounselingCaseDTO,
} from '../../services/counselingApi';

export const counselingKeys = {
  all: ['counseling'] as const,
  riskAlerts: () => [...counselingKeys.all, 'risk-alerts'] as const,
  riskAlertsList: (filters: RiskAlertFilters) => [...counselingKeys.riskAlerts(), 'list', filters] as const,
  riskAlertDetail: (id: string) => [...counselingKeys.riskAlerts(), 'detail', id] as const,
  dashboard: () => [...counselingKeys.all, 'dashboard'] as const,
  cases: () => [...counselingKeys.all, 'cases'] as const,
  casesList: (filters: CounselingCaseFilters) => [...counselingKeys.cases(), 'list', filters] as const,
  caseDetail: (id: string) => [...counselingKeys.cases(), 'detail', id] as const,
  notes: (caseId: string) => [...counselingKeys.cases(), 'notes', caseId] as const,
  interventions: (caseId: string) => [...counselingKeys.cases(), 'interventions', caseId] as const,
  stats: () => [...counselingKeys.all, 'stats'] as const,
};

export function useRiskAlerts(filters: RiskAlertFilters = {}) {
  return useQuery({
    queryKey: counselingKeys.riskAlertsList(filters),
    queryFn: () => counselingApi.listRiskAlerts(filters),
    placeholderData: (prev) => prev,
  });
}

export function useRiskAlert(id: string) {
  return useQuery({
    queryKey: counselingKeys.riskAlertDetail(id),
    queryFn: () => counselingApi.getRiskAlert(id),
    enabled: !!id,
  });
}

export function useCreateRiskAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRiskAlertDTO) => counselingApi.createRiskAlert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: counselingKeys.riskAlerts() });
      queryClient.invalidateQueries({ queryKey: counselingKeys.dashboard() });
    },
  });
}

export function useUpdateRiskAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRiskAlertDTO }) => counselingApi.updateRiskAlert(id, data),
    onSuccess: (alert) => {
      queryClient.invalidateQueries({ queryKey: counselingKeys.riskAlerts() });
      queryClient.setQueryData(counselingKeys.riskAlertDetail(alert.id), alert);
    },
  });
}

export function useDeleteRiskAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => counselingApi.deleteRiskAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: counselingKeys.riskAlerts() });
      queryClient.invalidateQueries({ queryKey: counselingKeys.dashboard() });
    },
  });
}

export function useRiskDashboard() {
  return useQuery({
    queryKey: counselingKeys.dashboard(),
    queryFn: () => counselingApi.getRiskDashboard(),
  });
}

export function useCounselingCases(filters: CounselingCaseFilters = {}) {
  return useQuery({
    queryKey: counselingKeys.casesList(filters),
    queryFn: () => counselingApi.listCases(filters),
    placeholderData: (prev) => prev,
  });
}

export function useCounselingCase(id: string) {
  return useQuery({
    queryKey: counselingKeys.caseDetail(id),
    queryFn: () => counselingApi.getCase(id),
    enabled: !!id,
  });
}

export function useCreateCounselingCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCounselingCaseDTO) => counselingApi.createCase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: counselingKeys.cases() });
      queryClient.invalidateQueries({ queryKey: counselingKeys.stats() });
    },
  });
}

export function useUpdateCounselingCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCounselingCaseDTO }) => counselingApi.updateCase(id, data),
    onSuccess: (updatedCase) => {
      queryClient.invalidateQueries({ queryKey: counselingKeys.cases() });
      queryClient.setQueryData(counselingKeys.caseDetail(updatedCase.id), updatedCase);
    },
  });
}

export function useDeleteCounselingCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => counselingApi.deleteCase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: counselingKeys.cases() });
      queryClient.invalidateQueries({ queryKey: counselingKeys.stats() });
    },
  });
}

export function useCounselingNotes(caseId: string) {
  return useQuery({
    queryKey: counselingKeys.notes(caseId),
    queryFn: () => counselingApi.getNotes(caseId),
    enabled: !!caseId,
  });
}

export function useCounselingInterventions(caseId: string) {
  return useQuery({
    queryKey: counselingKeys.interventions(caseId),
    queryFn: () => counselingApi.getInterventions(caseId),
    enabled: !!caseId,
  });
}

export function useCounselingStats() {
  return useQuery({
    queryKey: counselingKeys.stats(),
    queryFn: () => counselingApi.getStats(),
  });
}
