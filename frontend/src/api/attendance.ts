import apiClient from './client';

export function listAttendance(sessionId?: number) {
  return apiClient.get('/attendance/', { params: sessionId ? { session: sessionId } : undefined });
}

export function bulkMarkAttendance(sessionId: number, records: { student_id: number; status: string }[]) {
  return apiClient.post('/attendance/bulk_mark/', { session_id: sessionId, records });
}
