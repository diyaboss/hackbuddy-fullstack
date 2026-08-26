import { fetchApiWithAuth } from './client.js';

export const profileApi = {
  getMe: () => fetchApiWithAuth('/profiles/me', { method: 'GET' }),
  updateMe: (data) => fetchApiWithAuth('/profiles/me', {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  updateStatus: (status) => fetchApiWithAuth('/profiles/matching-status', {
    method: 'PATCH',
    body: JSON.stringify({ status })
  })
};
