import api from '../utils/api';

export const dashboardService = {
  getDashboard: async () => {
    const response = await api.get('/dashboard');
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
};

