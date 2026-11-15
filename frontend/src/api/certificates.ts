import apiClient from './client';

export function listCertificates() {
  return apiClient.get('/certificates/');
}
