import { useMutation } from '@tanstack/react-query';
import { aiApi, GradeAssistRequest, PredictRiskRequest } from '../../services/aiApi';

export function useGeneratePlanning() {
  return useMutation({
    mutationFn: (prompt: string) => aiApi.generatePlanning(prompt),
  });
}

export function useGradeAssist() {
  return useMutation({
    mutationFn: (data: GradeAssistRequest) => aiApi.gradeAssist(data),
  });
}

export function usePredictRisk() {
  return useMutation({
    mutationFn: (data: PredictRiskRequest) => aiApi.predictRisk(data),
  });
}