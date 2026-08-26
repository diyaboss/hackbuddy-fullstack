import { fetchApiWithAuth } from './client.js';

export const matchesApi = {
  getMatches: () => fetchApiWithAuth('/matches', { method: 'GET' }),
  getRoom: (matchId) => fetchApiWithAuth(`/matches/${matchId}/room`, { method: 'GET' }),
  updateProblemStatements: (matchId, statementIds) => fetchApiWithAuth(`/matches/${matchId}/problem-statements`, {
    method: 'PUT',
    body: JSON.stringify({ statementIds })
  }),
  shareContact: (matchId) => fetchApiWithAuth(`/matches/${matchId}/share-contact`, { method: 'POST' }),
  getProblemStatements: () => fetchApiWithAuth('/problem-statements', { method: 'GET' })
};
