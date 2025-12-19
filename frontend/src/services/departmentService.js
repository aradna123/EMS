import api from '../utils/api';

export const departmentService = {
  getDepartments: async () => {
    const response = await api.get('/departments');
    return response.data;
  },

  getDepartment: async (id) => {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  },

  createDepartment: async (data) => {
    const response = await api.post('/departments', data);
    return response.data;
  },

  updateDepartment: async (id, data) => {
    const response = await api.put(`/departments/${id}`, data);
    return response.data;
  },

  deleteDepartment: async (id) => {
    const response = await api.delete(`/departments/${id}`);
    return response.data;
  },

  getDepartmentStats: async (id) => {
    const response = await api.get(`/departments/${id}/stats`);
    return response.data;
  },

  getDepartmentHierarchy: async () => {
    const response = await api.get('/departments/hierarchy');
    return response.data;
  },
};

