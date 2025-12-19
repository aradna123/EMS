import api from '../utils/api';

export const attendanceService = {
  checkIn: async (date) => {
    const response = await api.post('/attendance/check-in', { date });
    return response.data;
  },

  checkOut: async (date) => {
    const response = await api.post('/attendance/check-out', { date });
    return response.data;
  },

  getAttendance: async (params = {}) => {
    const response = await api.get('/attendance', { params });
    return response.data;
  },

  getMonthlyReport: async (params = {}) => {
    const response = await api.get('/attendance/monthly', { params });
    return response.data;
  },

  getAttendanceStats: async () => {
    const response = await api.get('/attendance/stats');
    return response.data;
  },

  createAttendance: async (data) => {
    const response = await api.post('/attendance/record', data);
    return response.data;
  },
};

