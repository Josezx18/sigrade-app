import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { academicApi, SchoolYearCreateDTO, AcademicPeriodCreateDTO, SubjectFilters } from '../../services/academicApi';

export const academicKeys = {
  all: ['academic'] as const,
  schoolYears: () => [...academicKeys.all, 'school-years'] as const,
  schoolYear: (id: string) => [...academicKeys.schoolYears(), id] as const,
  periods: () => [...academicKeys.all, 'periods'] as const,
  period: (id: string) => [...academicKeys.periods(), id] as const,
  gradeLevels: () => [...academicKeys.all, 'grade-levels'] as const,
  subjects: () => [...academicKeys.all, 'subjects'] as const,
  subjectList: (filters: SubjectFilters) => [...academicKeys.subjects(), filters] as const,
};

export function useSchoolYears() {
  return useQuery({
    queryKey: academicKeys.schoolYears(),
    queryFn: () => academicApi.listSchoolYears(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useSchoolYear(id: string) {
  return useQuery({
    queryKey: academicKeys.schoolYear(id),
    queryFn: () => academicApi.getSchoolYear(id),
    enabled: !!id,
  });
}

export function useCreateSchoolYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SchoolYearCreateDTO) => academicApi.createSchoolYear(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.schoolYears() });
    },
  });
}

export function useUpdateSchoolYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SchoolYearCreateDTO> }) => academicApi.updateSchoolYear(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.schoolYears() });
    },
  });
}

export function usePeriods(schoolYearId?: string) {
  return useQuery({
    queryKey: [...academicKeys.periods(), { schoolYearId }] as const,
    queryFn: () => academicApi.listPeriods(schoolYearId),
  });
}

export function useActivePeriod() {
  return useQuery({
    queryKey: [...academicKeys.periods(), 'active'] as const,
    queryFn: () => academicApi.listPeriods(undefined, true).then(periods => periods[0] ?? null),
  });
}

export function useCreatePeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AcademicPeriodCreateDTO) => academicApi.createPeriod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.periods() });
    },
  });
}

export function useUpdatePeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AcademicPeriodCreateDTO> }) => academicApi.updatePeriod(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.periods() });
    },
  });
}

export function useGradeLevels() {
  return useQuery({
    queryKey: academicKeys.gradeLevels(),
    queryFn: () => academicApi.listGradeLevels(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useSubjects(filters: SubjectFilters = {}) {
  return useQuery({
    queryKey: academicKeys.subjectList(filters),
    queryFn: () => academicApi.listSubjects(filters),
  });
}
