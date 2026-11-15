import apiClient from './client';

export function getDashboardSummary() {
  return apiClient.get('/summary/');
}
