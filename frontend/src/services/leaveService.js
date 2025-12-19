import api from '../utils/api';

export const leaveService = {
  submitLeaveRequest: async (data) => {
    const response = await api.post('/leaves/request', data);
    return response.data;
  },

  getLeaveRequests: async (params = {}) => {
    const response = await api.get('/leaves/requests', { params });
    return response.data;
  },

  getLeaveRequest: async (id) => {
    const response = await api.get(`/leaves/${id}`);
    return response.data;
  },

  updateLeaveRequest: async (id, data) => {
    const response = await api.put(`/leaves/${id}`, data);
    return response.data;
  },

  deleteLeaveRequest: async (id) => {
    const response = await api.delete(`/leaves/${id}`);
    return response.data;
  },

  approveLeaveRequest: async (id, status) => {
    const response = await api.put(`/leaves/requests/${id}/approve`, { status });
    return response.data;
  },

  rejectLeaveRequest: async (id) => {
    const response = await api.patch(`/leaves/${id}/reject`);
    return response.data;
  },

  getLeaveBalance: async (params = {}) => {
    const response = await api.get('/leaves/balance', { params });
    return response.data;
  },

  getLeaveCalendar: async (params = {}) => {
    const response = await api.get('/leaves/calendar', { params });
    return response.data;
  },
};

