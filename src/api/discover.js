import { fetchApiWithAuth } from './client.js';

export const discoverApi = {
  getEligibleUsers: (gender) => {
    const url = gender ? `/discover?gender=${encodeURIComponent(gender)}` : '/discover';
    return fetchApiWithAuth(url, { method: 'GET' });
  }
};
