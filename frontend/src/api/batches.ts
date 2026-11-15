import apiClient from './client';

export function listBatches() {
  return apiClient.get('/batches/');
}

export function listSessions() {
  return apiClient.get('/sessions/');
}

export function listBatchStudents(batchId: number) {
  return apiClient.get(`/batches/${batchId}/students/`);
}

export function listBatchSessions(batchId: number, date: string) {
  return apiClient.get('/sessions/', { params: { batch: batchId, date } });
}
