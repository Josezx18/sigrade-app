import { api as axiosInstance } from '../lib/api';
import { PaginatedResponse } from '../lib/types';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  userId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationQuery {
  read?: boolean;
  type?: string;
  page?: number;
  limit?: number;
}


export const notificationsApi = {
  list: async (query: NotificationQuery = {}): Promise<PaginatedResponse<Notification>> => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.append(key, String(value));
    });
    const response = await axiosInstance.get<PaginatedResponse<Notification>>('/notifications', { params });
    return response.data;
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await axiosInstance.get<{ count: number }>('/notifications/unread/count');
    return response.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await axiosInstance.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await axiosInstance.patch('/notifications/read-all');
  },
};
