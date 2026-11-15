import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { AxiosResponse } from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listAttendance } from '../../api/attendance';
import { listBatches, listSessions } from '../../api/batches';
import { listEnrolments, listInstalments } from '../../api/fees';
import { listAssignments, listSubmissions } from '../../api/learning';
import { StudentDashboardPage } from './StudentDashboardPage';

vi.mock('../../api/attendance', () => ({ listAttendance: vi.fn() }));
vi.mock('../../api/batches', () => ({ listBatches: vi.fn(), listSessions: vi.fn() }));
vi.mock('../../api/fees', () => ({ listEnrolments: vi.fn(), listInstalments: vi.fn() }));
vi.mock('../../api/learning', () => ({ listAssignments: vi.fn(), listSubmissions: vi.fn() }));
vi.mock('../../store/auth', () => ({ getAuthSession: () => ({ full_name: 'Student Example' }) }));

function response(data: unknown) {
  return { data } as AxiosResponse;
}

function renderDashboard() {
  return render(<MemoryRouter><StudentDashboardPage /></MemoryRouter>);
}

describe('StudentDashboardPage', () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listBatches).mockResolvedValue(response({ results: [
      {
        id: 11,
        batch_code: 'PFS-01',
        name: 'Evening Batch',
        course: 3,
        course_name: 'Python Full Stack',
        start_date: '2026-01-01',
        end_date: '2026-06-01',
        class_days: 'Mon-Wed-Fri',
        start_time: '18:30:00',
        end_time: '20:30:00',
        mode: 'ONLINE',
        meeting_link: '',
        status: 'ACTIVE',
      },
    ] }));
    vi.mocked(listEnrolments).mockResolvedValue(response({ results: [{ id: 5, batch: 11, course: 3, status: 'ACTIVE' }] }));
    vi.mocked(listSessions).mockResolvedValue(response({ results: [] }));
    vi.mocked(listAttendance).mockResolvedValue(response({ results: [] }));
    vi.mocked(listAssignments).mockResolvedValue(response({ results: [] }));
    vi.mocked(listSubmissions).mockResolvedValue(response({ results: [] }));
    vi.mocked(listInstalments).mockResolvedValue(response({ results: [] }));
  });

  it('renders current enrolment details and factual empty states', async () => {
    renderDashboard();

    expect(await screen.findByText('Python Full Stack')).toBeTruthy();
    expect(screen.getByText('PFS-01')).toBeTruthy();
    expect(screen.queryByText('MOCK')).toBeNull();
    expect(screen.getByText('Your 2-hour class plan')).toBeTruthy();
    expect(screen.getByText('Last 25 classes')).toBeTruthy();
    expect(document.querySelectorAll('.student-attendance-cell.unrecorded')).toHaveLength(25);
    expect(screen.getByText('0')).toBeTruthy();
  });

  it('derives attendance, pending work, fees, and the next class from API data', async () => {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    vi.mocked(listSessions).mockResolvedValue(response({ results: [
      { id: 20, batch: 11, date: todayKey, start_time: '19:00:00', end_time: '21:00:00', topic: 'React hooks', meeting_link: 'https://example.test/class', status: 'SCHEDULED' },
      { id: 21, batch: 11, date: yesterdayKey, start_time: '19:00:00', end_time: '21:00:00', topic: 'React hooks', meeting_link: '', status: 'COMPLETED' },
    ] }));
    vi.mocked(listAttendance).mockResolvedValue(response({ results: [
      { id: 1, session: 20, status: 'PRESENT' },
      { id: 2, session: 21, status: 'ABSENT' },
    ] }));
    vi.mocked(listAssignments).mockResolvedValue(response({ results: [
      { id: 30, batch: 11, title: 'Build a form', due_date: todayKey },
      { id: 31, batch: 11, title: 'Build an API', due_date: todayKey },
    ] }));
    vi.mocked(listSubmissions).mockResolvedValue(response({ results: [{ assignment: 31 }] }));
    vi.mocked(listInstalments).mockResolvedValue(response({ results: [
      { id: 40, enrolment: 5, amount: '2500.00', due_date: todayKey, status: 'PENDING' },
    ] }));

    renderDashboard();

    expect(await screen.findAllByText('50%')).toHaveLength(2);
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Join today’s class/i }).getAttribute('href')).toBe('https://example.test/class');
    expect(screen.getByText(/Due/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'View your attendance data' }).getAttribute('href')).toBe('#student-attendance');
    expect(document.querySelectorAll('.student-attendance-cell')).toHaveLength(25);
    expect(document.querySelectorAll('.student-attendance-cell.present')).toHaveLength(1);
    expect(document.querySelectorAll('.student-attendance-cell.absent')).toHaveLength(1);
    expect(document.querySelectorAll('.student-attendance-cell.unrecorded')).toHaveLength(23);
  });

  it('shows API errors and retries instead of displaying empty data as success', async () => {
    vi.mocked(listBatches)
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValue(response({ results: [] }));

    renderDashboard();

    expect(await screen.findByRole('alert')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Try again/i }));
    await waitFor(() => expect(listBatches).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Your learning starts here')).toBeTruthy();
  });
});
