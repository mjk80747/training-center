import apiClient from './client';

export function listAssignments() {
  return apiClient.get('/assignments/');
}

export function createAssignment(assignment: FormData) {
  return apiClient.post('/assignments/', assignment, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function listMaterials() {
  return apiClient.get('/materials/');
}

export function createMaterial(material: FormData) {
  return apiClient.post('/materials/', material, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function listSubmissions() {
  return apiClient.get('/submissions/');
}

export function gradeSubmission(submissionId: number, marks: number, feedback: string) {
  return apiClient.patch(`/submissions/${submissionId}/`, {
    marks,
    feedback,
    status: 'GRADED',
  });
}
