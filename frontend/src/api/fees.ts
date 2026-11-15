import apiClient from './client';

export function listPayments() {
  return apiClient.get('/payments/');
}

export function listInstalments() {
  return apiClient.get('/instalments/');
}

export function listEnrolments() {
  return apiClient.get('/enrolments/');
}
