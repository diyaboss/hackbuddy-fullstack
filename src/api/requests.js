import { fetchApiWithAuth } from './client.js';

export const requestsApi = {
  sendRequest: (receiverId) => fetchApiWithAuth('/team-requests', {
    method: 'POST',
    body: JSON.stringify({ receiverId })
  }),
  getIncoming: () => fetchApiWithAuth('/team-requests/incoming', { method: 'GET' }),
  getOutgoing: () => fetchApiWithAuth('/team-requests/outgoing', { method: 'GET' }),
  acceptRequest: (id) => fetchApiWithAuth(`/team-requests/${id}/accept`, { method: 'POST' }),
  declineRequest: (id) => fetchApiWithAuth(`/team-requests/${id}/decline`, { method: 'POST' })
};
