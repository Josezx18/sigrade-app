import { useQuery } from '@tanstack/react-query';
import { analyticsApi, AnalyticsFilters } from '../../services/analyticsApi';

export const analyticsKeys = {
  all: ['analytics'] as const,
  dashboard: (filters: AnalyticsFilters) => [...analyticsKeys.all, 'dashboard', filters] as const,
  gradeDistribution: (filters: AnalyticsFilters) => [...analyticsKeys.all, 'gradeDistribution', filters] as const,
  attendanceTrends: (filters: AnalyticsFilters) => [...analyticsKeys.all, 'attendanceTrends', filters] as const,
  subjectPerformance: (filters: AnalyticsFilters) => [...analyticsKeys.all, 'subjectPerformance', filters] as const,
  teacherDashboard: (teacherId: string) => [...analyticsKeys.all, 'teacherDashboard', teacherId] as const,
  nationalDashboard: () => [...analyticsKeys.all, 'nationalDashboard'] as const,
  regionalDashboard: () => [...analyticsKeys.all, 'regionalDashboard'] as const,
  districtDashboard: () => [...analyticsKeys.all, 'districtDashboard'] as const,
  schoolDashboard: () => [...analyticsKeys.all, 'schoolDashboard'] as const,
};

export function useDashboardKpis(filters: AnalyticsFilters = {}) {
  return useQuery({
    queryKey: analyticsKeys.dashboard(filters),
    queryFn: () => analyticsApi.getDashboard(filters),
  });
}

export function useGradeDistribution(filters: AnalyticsFilters = {}) {
  return useQuery({
    queryKey: analyticsKeys.gradeDistribution(filters),
    queryFn: () => analyticsApi.getGradeDistribution(filters),
  });
}

export function useAttendanceTrends(filters: AnalyticsFilters = {}) {
  return useQuery({
    queryKey: analyticsKeys.attendanceTrends(filters),
    queryFn: () => analyticsApi.getAttendanceTrends(filters),
  });
}

export function useSubjectPerformance(filters: AnalyticsFilters = {}) {
  return useQuery({
    queryKey: analyticsKeys.subjectPerformance(filters),
    queryFn: () => analyticsApi.getSubjectPerformance(filters),
  });
}

export function useTeacherDashboard(teacherId: string | undefined) {
  return useQuery({
    queryKey: analyticsKeys.teacherDashboard(teacherId as string),
    queryFn: () => analyticsApi.getTeacherDashboard(teacherId as string),
    enabled: !!teacherId,
  });
}

export function useNationalDashboard() {
  return useQuery({
    queryKey: analyticsKeys.nationalDashboard(),
    queryFn: () => analyticsApi.getNationalDashboard(),
  });
}

export function useRegionalDashboard() {
  return useQuery({
    queryKey: analyticsKeys.regionalDashboard(),
    queryFn: () => analyticsApi.getRegionalDashboard(),
  });
}

export function useDistrictDashboard() {
  return useQuery({
    queryKey: analyticsKeys.districtDashboard(),
    queryFn: () => analyticsApi.getDistrictDashboard(),
  });
}

export function useSchoolDashboard() {
  return useQuery({
    queryKey: analyticsKeys.schoolDashboard(),
    queryFn: () => analyticsApi.getSchoolDashboard(),
  });
}

export function useTeacherAssignments(teacherId: string | undefined) {
  return useQuery({
    queryKey: ['teacherAssignments', teacherId],
    queryFn: () => analyticsApi.getTeacherAssignments(teacherId as string),
    enabled: !!teacherId,
  });
}
