import apiClient from './client';

export type NewStudent = {
  email: string;
  full_name: string;
  mobile: string;
  password: string;
};

export type StudentUpdate = {
  email?: string;
  full_name?: string;
  mobile?: string;
  city?: string;
  is_active?: boolean;
};

export function listStudents() {
  return apiClient.get('/students/');
}

export function createStudent(student: NewStudent) {
  return apiClient.post('/students/', student);
}

export function updateStudent(studentId: number, student: StudentUpdate) {
  return apiClient.patch(`/students/${studentId}/`, student);
}

export function archiveStudent(studentId: number) {
  return apiClient.delete(`/students/${studentId}/`);
}
