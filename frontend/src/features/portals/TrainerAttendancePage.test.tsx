import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { AxiosResponse } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bulkMarkAttendance, listAttendance } from '../../api/attendance';
import { listBatchSessions, listBatchStudents, listBatches } from '../../api/batches';
import { TrainerAttendancePage } from './TrainerAttendancePage';

vi.mock('../../api/attendance', () => ({ bulkMarkAttendance: vi.fn(), listAttendance: vi.fn() }));
vi.mock('../../api/batches', () => ({
  listBatchSessions: vi.fn(),
  listBatchStudents: vi.fn(),
  listBatches: vi.fn(),
  listSessions: vi.fn(),
}));

function response(data: unknown) {
  return { data } as AxiosResponse;
}

describe('TrainerAttendancePage', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listBatches).mockResolvedValue(response({ results: [
      { id: 8, batch_code: 'PFS-WD-01', start_time: '19:00:00', end_time: '21:00:00', status: 'ACTIVE' },
    ] }));
    vi.mocked(listBatchStudents).mockResolvedValue(response({ results: [
      { id: 12, student_code: 'STU-12', full_name: 'Rahul Sharma', college: 'JNTU Hyderabad' },
      { id: 13, student_code: 'STU-13', full_name: 'Priya Nair', college: 'CBIT' },
    ] }));
    vi.mocked(listBatchSessions).mockResolvedValue(response({ results: [{ id: 21, batch: 8, date: '2026-11-05' }] }));
    vi.mocked(listAttendance).mockResolvedValue(response({ results: [
      { id: 1, session: 21, student: 12, status: 'PRESENT' },
      { id: 2, session: 21, student: 13, status: 'LATE' },
    ] }));
    vi.mocked(bulkMarkAttendance).mockResolvedValue(response({ detail: 'Attendance marked successfully.' }));
  });

  it('loads the selected batch roster and existing session statuses', async () => {
    render(<TrainerAttendancePage />);

    expect(await screen.findByText('Rahul Sharma', {}, { timeout: 5000 })).toBeTruthy();
    expect(screen.getByText('JNTU Hyderabad')).toBeTruthy();
    expect(screen.getByText('Present:')).toBeTruthy();
    expect(screen.getByText('Late:')).toBeTruthy();
    expect(screen.getByText('Absent:')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Save attendance' }) as HTMLButtonElement).disabled).toBe(true);
    expect(listBatchSessions).toHaveBeenCalledWith(8, expect.any(String));
    expect(listAttendance).toHaveBeenCalledWith(21);
  });

  it('updates totals immediately and saves changes only when requested', async () => {
    render(<TrainerAttendancePage />);

    await screen.findByText('Rahul Sharma', {}, { timeout: 5000 });
    const priyaAttendance = screen.getByRole('group', { name: 'Attendance for Priya Nair' });
    fireEvent.click(within(priyaAttendance).getByRole('button', { name: 'Absent' }));

    expect(screen.getByText('Absent:').parentElement?.textContent).toContain('1');
    expect(screen.getByText('Counts update as you make changes. Save attendance to record them.')).toBeTruthy();
    expect(bulkMarkAttendance).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Save attendance' }));
    await waitFor(() => expect(bulkMarkAttendance).toHaveBeenCalledWith(21, [
      { student_id: 12, status: 'PRESENT' },
      { student_id: 13, status: 'ABSENT' },
    ]));
    expect((await screen.findByRole('status')).textContent).toContain('Attendance saved successfully.');
    expect((screen.getByRole('button', { name: 'Save attendance' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('supports bulk status changes and reports when no session exists for the selected date', async () => {
    vi.mocked(listBatchSessions).mockResolvedValueOnce(response({ results: [] }));
    render(<TrainerAttendancePage />);

    expect(await screen.findByText(/No class session is scheduled/)).toBeTruthy();
    expect(screen.queryByText('Rahul Sharma')).toBeNull();
    expect((screen.getByRole('button', { name: 'Save attendance' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
