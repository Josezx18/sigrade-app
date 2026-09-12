import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, NotificationQuery } from '../../services/notificationsApi';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (query: NotificationQuery) => [...notificationKeys.all, 'list', query] as const,
  unreadCount: () => [...notificationKeys.all, 'unreadCount'] as const,
};

export function useNotifications(query: NotificationQuery = {}) {
  return useQuery({
    queryKey: notificationKeys.list(query),
    queryFn: () => notificationsApi.list(query),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: 1000 * 30,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
