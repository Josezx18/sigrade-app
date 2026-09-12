import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../services/analyticsApi';

export function useTeacherDashboard(teacherId: string | undefined) {
  return useQuery({
    queryKey: ['teacherDashboard', teacherId],
    queryFn: () => analyticsApi.getTeacherDashboard(teacherId as string),
    enabled: !!teacherId,
  });
}

export function useTeacherAssignments(teacherId: string | undefined) {
  return useQuery({
    queryKey: ['teacherAssignments', teacherId],
    queryFn: () => analyticsApi.getTeacherAssignments(teacherId as string),
    enabled: !!teacherId,
  });
}
