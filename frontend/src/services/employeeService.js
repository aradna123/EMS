import api from '../utils/api';

export const employeeService = {
  getEmployees: async (params = {}) => {
    const response = await api.get('/employees', { params });
    return response.data;
  },

  getEmployee: async (id) => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  createEmployee: async (data) => {
    const response = await api.post('/employees', data);
    return response.data;
  },

  updateEmployee: async (id, data) => {
    const response = await api.put(`/employees/${id}`, data);
    return response.data;
  },

  deleteEmployee: async (id) => {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  },

  uploadPhoto: async (id, file) => {
    const formData = new FormData();
    formData.append('photo', file);
    const response = await api.post(`/employees/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  exportEmployees: async () => {
    const response = await api.get('/employees/export/csv', {
      responseType: 'blob',
    });
    return response.data;
  },
};

