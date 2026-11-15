import type { AxiosRequestConfig } from 'axios';
import apiClient from './client';

export function listCourses(config?: AxiosRequestConfig) {
  return apiClient.get('/courses/', config);
}
