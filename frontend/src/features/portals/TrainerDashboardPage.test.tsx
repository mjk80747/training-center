import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { AxiosResponse } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listAttendance } from '../../api/attendance';
import { listBatches, listSessions } from '../../api/batches';
import { listAssignments } from '../../api/learning';
import { listStudents } from '../../api/students';
import { TrainerDashboardPage } from './TrainerDashboardPage';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../api/attendance', () => ({ listAttendance: vi.fn() }));
vi.mock('../../api/batches', () => ({ listBatches: vi.fn(), listSessions: vi.fn() }));
vi.mock('../../api/learning', () => ({ listAssignments: vi.fn() }));
vi.mock('../../api/students', () => ({ listStudents: vi.fn() }));
vi.mock('../../store/auth', () => ({
  getAuthSession: () => ({ full_name: 'Arjun Mehta', email: 'arjun@example.test', role: 'TRAINER' }),
}));

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

function response(data: unknown) {
  return { data } as AxiosResponse;
}

describe('TrainerDashboardPage', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listBatches).mockResolvedValue(response({ results: [{
      id: 8,
      batch_code: 'PFS-WD-01',
      name: 'Python Full Stack',
      course_name: 'Python Full Stack',
      start_date: '2026-01-12',
      status: 'ACTIVE',
      class_days: 'Mon-Fri',
      start_time: '19:00:00',
      end_time: '21:00:00',
      mode: 'HYBRID',
      enrolled_students: 4,
    }] }));
    vi.mocked(listSessions).mockResolvedValue(response({ results: [{
      id: 21,
      batch: 8,
      date: today(),
      start_time: '19:00:00',
      end_time: '21:00:00',
      topic: 'Python fundamentals',
      status: 'SCHEDULED',
    }] }));
    vi.mocked(listAssignments).mockResolvedValue(response({ results: [
      { id: 1, batch: 8, title: 'Build a portfolio', due_date: today() },
      { id: 2, batch: 8, title: 'Past assignment', due_date: '2020-01-01' },
    ] }));
    vi.mocked(listStudents).mockResolvedValue(response({ results: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }] }));
    vi.mocked(listAttendance).mockResolvedValue(response({ results: [
      { id: 1, status: 'PRESENT' },
      { id: 2, status: 'ABSENT' },
    ] }));
  });

  it('shows live trainer stats, today’s scheduled class, and assigned batches', async () => {
    render(<MemoryRouter><TrainerDashboardPage /></MemoryRouter>);

    expect(await screen.findByRole('heading', { name: 'Welcome, Arjun Mehta' })).toBeTruthy();
    expect(await screen.findByText('4', { selector: '.trainer-stat-card strong' })).toBeTruthy();
    expect(screen.getAllByText('1', { selector: '.trainer-stat-card strong' })).toHaveLength(2);
    expect(screen.getByRole('heading', { name: "Today's class · PFS-WD-01" })).toBeTruthy();
    expect(screen.getByText('Python fundamentals')).toBeTruthy();
    expect(screen.getByText('4 students')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Mark attendance/ }).getAttribute('href')).toBe('/trainer/attendance');
    expect(screen.getByText('Attendance snapshot: 1 of 2 records marked present.')).toBeTruthy();
  });

  it('runs and resets the class timer', async () => {
    render(<MemoryRouter><TrainerDashboardPage /></MemoryRouter>);

    const startButton = await screen.findByRole('button', { name: 'Start class' });
    fireEvent.click(startButton);
    expect(screen.getByRole('button', { name: 'Pause class' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Reset class timer' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Start class' })).toBeTruthy());
    expect(screen.getByText('00:00')).toBeTruthy();
  });

  it('shows an explicit message and retry action when dashboard requests fail', async () => {
    vi.mocked(listBatches).mockRejectedValueOnce(new Error('offline'));
    render(<MemoryRouter><TrainerDashboardPage /></MemoryRouter>);

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    expect(screen.getByText('Could not load your trainer dashboard. Please try again.')).toBeTruthy();
  });
});
