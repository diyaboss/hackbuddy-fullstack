import { fetchApiWithAuth } from './client.js';

export const authApi = {
  googleLogin: (credential) => fetchApiWithAuth('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential })
  }),
  savePhone: (phoneNumber, country) => fetchApiWithAuth('/auth/phone', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber, country })
  }),
  me: () => fetchApiWithAuth('/auth/me', { method: 'GET' }),
  logout: () => fetchApiWithAuth('/auth/logout', { method: 'POST' }),
};
