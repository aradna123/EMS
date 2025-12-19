import api from '../utils/api';

export const notificationService = {
  // Get all notifications for the current user
  getNotifications: async (params = {}) => {
    const { status = 'all', page = 1, limit = 20 } = params;
    const response = await api.get('/notifications', {
      params: { status, page, limit },
    });
    return response.data;
  },

  // Mark a notification as read
  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.put('/notifications/mark-all-read');
    return response.data;
  },

  // Delete a notification
  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },
};

