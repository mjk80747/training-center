import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { AxiosResponse } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listCourses } from '../../api/courses';
import { listEnrolments, listInstalments, listPayments } from '../../api/fees';
import { listStudents } from '../../api/students';
import { AdminFeesPage } from './AdminFeesPage';

vi.mock('../../api/courses', () => ({ listCourses: vi.fn() }));
vi.mock('../../api/fees', () => ({
  listEnrolments: vi.fn(),
  listInstalments: vi.fn(),
  listPayments: vi.fn(),
}));
vi.mock('../../api/students', () => ({ listStudents: vi.fn() }));

describe('AdminFeesPage', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listEnrolments).mockResolvedValue({
      data: { results: [{ id: 5, student: 2, course: 3, course_fee: '1000.00', final_fee: '1000.00' }] },
    } as AxiosResponse);
    vi.mocked(listPayments).mockResolvedValue({
      data: { results: [{ id: 8, enrolment: 5, amount: '400.00', status: 'SUCCESS', payment_date: '2026-11-01' }] },
    } as AxiosResponse);
    vi.mocked(listInstalments).mockResolvedValue({
      data: {
        results: [
          { id: 10, enrolment: 5, amount: '300.00', due_date: '2026-10-01', status: 'PAID' },
          { id: 11, enrolment: 5, amount: '300.00', due_date: '2026-10-01', status: 'OVERDUE' },
        ],
      },
    } as AxiosResponse);
    vi.mocked(listStudents).mockResolvedValue({
      data: { results: [{ id: 2, full_name: 'Rahul Sharma', student_code: 'STU-001' }] },
    } as AxiosResponse);
    vi.mocked(listCourses).mockResolvedValue({
      data: { results: [{ id: 3, code: 'PFS' }] },
    } as AxiosResponse);
  });

  it('shows calculated fee totals, instalment states, and student payments', async () => {
    render(<AdminFeesPage />);

    expect(await screen.findByText('Rahul Sharma')).toBeTruthy();
    expect(screen.getAllByText('₹400').length).toBeGreaterThan(0);
    expect(screen.getByText('₹600')).toBeTruthy();
    const table = screen.getByRole('table');
    expect(within(table).getByText('₹1,000')).toBeTruthy();
    expect(within(table).getAllByText('Paid').length).toBeGreaterThan(0);
    expect(within(table).getByText('Overdue')).toBeTruthy();
    expect(within(table).getByRole('progressbar', { name: 'Rahul Sharma fees paid' })).toBeTruthy();
  });

  it('filters fee rows by student search', async () => {
    render(<AdminFeesPage />);

    expect(await screen.findByText('Rahul Sharma')).toBeTruthy();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search fee records by student' }), {
      target: { value: 'STU-001' },
    });
    expect(screen.getByText('Rahul Sharma')).toBeTruthy();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search fee records by student' }), {
      target: { value: 'Not a student' },
    });
    expect(screen.getByText('No fee records match your search.')).toBeTruthy();
  });
});
