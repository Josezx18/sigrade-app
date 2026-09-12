import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi, AttendanceCreateDTO, AttendanceFilters } from '../../services/attendanceApi';

export const attendanceKeys = {
  all: ['attendance'] as const,
  lists: () => [...attendanceKeys.all, 'list'] as const,
  list: (filters: AttendanceFilters) => [...attendanceKeys.lists(), filters] as const,
  details: () => [...attendanceKeys.all, 'detail'] as const,
  detail: (id: string) => [...attendanceKeys.details(), id] as const,
};

export function useAttendanceRecords(filters: AttendanceFilters = {}) {
  return useQuery({
    queryKey: attendanceKeys.list(filters),
    queryFn: () => attendanceApi.list(filters),
  });
}

export function useAttendanceRecord(id: string) {
  return useQuery({
    queryKey: attendanceKeys.detail(id),
    queryFn: () => attendanceApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AttendanceCreateDTO) => attendanceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.lists() });
    },
  });
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AttendanceCreateDTO> }) => attendanceApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.lists() });
    },
  });
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => attendanceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.lists() });
    },
  });
}

export function useBulkCreateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (records: AttendanceCreateDTO[]) => attendanceApi.bulkCreate(records),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.lists() });
    },
  });
}
