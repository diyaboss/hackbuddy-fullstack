import { fetchApiWithAuth } from './client.js';

export const adminApi = {
  getOverview: () => fetchApiWithAuth('/admin/overview', { method: 'GET' }),
  getUsers: () => fetchApiWithAuth('/admin/users', { method: 'GET' }),
  getMatchingUsers: () => fetchApiWithAuth('/admin/matching-users', { method: 'GET' }),
  deleteUser: (id) => fetchApiWithAuth(`/admin/users/${id}`, { method: 'DELETE' })
};
