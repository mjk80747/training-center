import apiClient from './client';

export function getCourseSummary() {
  return apiClient.get('/reports/course-summary/');
}
