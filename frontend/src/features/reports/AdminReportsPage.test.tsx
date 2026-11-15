import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { AxiosResponse } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listAttendance } from '../../api/attendance';
import { listBatches, listSessions } from '../../api/batches';
import { listCourses } from '../../api/courses';
import { listEnrolments, listPayments } from '../../api/fees';
import { AdminReportsPage } from './AdminReportsPage';

vi.mock('../../api/attendance', () => ({ listAttendance: vi.fn() }));
vi.mock('../../api/batches', () => ({ listBatches: vi.fn(), listSessions: vi.fn() }));
vi.mock('../../api/courses', () => ({ listCourses: vi.fn() }));
vi.mock('../../api/fees', () => ({ listEnrolments: vi.fn(), listPayments: vi.fn() }));

function getThisWeekDate() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

describe('AdminReportsPage', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listCourses).mockResolvedValue({
      data: { results: [{ id: 3, code: 'PFS', name: 'Python Full Stack' }] },
    } as AxiosResponse);
    vi.mocked(listEnrolments).mockResolvedValue({
      data: {
        results: [{ id: 4, course: 3, batch: 9, final_fee: '1000.00', status: 'ACTIVE' }],
      },
    } as AxiosResponse);
    vi.mocked(listPayments).mockResolvedValue({
      data: {
        results: [
          { id: 1, enrolment: 4, amount: '250.00', status: 'SUCCESS' },
          { id: 2, enrolment: 4, amount: '100.00', status: 'PENDING' },
        ],
      },
    } as AxiosResponse);
    vi.mocked(listBatches).mockResolvedValue({
      data: { results: [{ id: 9, batch_code: 'PFS-01', course: 3, status: 'ACTIVE', trainer_name: 'Trainer One' }] },
    } as AxiosResponse);
    vi.mocked(listSessions).mockResolvedValue({
      data: { results: [{ id: 11, batch: 9, date: getThisWeekDate() }] },
    } as AxiosResponse);
    vi.mocked(listAttendance).mockResolvedValue({
      data: {
        results: [
          { id: 1, session: 11, status: 'PRESENT' },
          { id: 2, session: 11, status: 'ABSENT' },
        ],
      },
    } as AxiosResponse);
  });

  it('renders revenue, attendance, active enrolment, and trainer charts from live API data', async () => {
    const { container } = render(<AdminReportsPage />);

    expect(await screen.findByRole('heading', { name: 'Revenue by course' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Collected and outstanding fees by course' })).toBeTruthy();
    await screen.findByText('Collected');
    const chartTitles = Array.from(container.querySelectorAll('svg title'), (title) => title.textContent);
    expect(chartTitles).toContain('Python Full Stack: collected ₹250');
    expect(chartTitles).toContain('Python Full Stack: outstanding ₹750');

    expect(screen.getByRole('group', { name: 'Weekly attendance percentage by course' })).toBeTruthy();
    expect(chartTitles).toContain('PFS W6: 50%');
    expect(screen.getByRole('group', { name: 'Active enrolment mix by course' })).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Active batch and student load by trainer' })).toBeTruthy();
    expect(chartTitles).toContain('Trainer One: 1 active batches');
    expect(screen.queryByText(/sample data/i)).toBeNull();
  });

  it('shows detailed custom tooltips on hover and keyboard focus', async () => {
    render(<AdminReportsPage />);

    await screen.findByRole('heading', { name: 'Revenue by course' });
    const revenueBar = screen.getByRole('group', { name: 'PFS revenue details' });
    fireEvent.mouseEnter(revenueBar);

    const tooltip = screen.getByText('₹250').closest('.report-chart-tooltip');
    if (!tooltip) throw new Error('Revenue tooltip should be rendered.');
    expect(tooltip.textContent).toContain('Python Full Stack');
    expect(tooltip.textContent).toContain('Collected');
    expect(tooltip.textContent).toContain('₹250');
    expect(tooltip.textContent).toContain('Pending');
    expect(tooltip.textContent).toContain('₹750');

    fireEvent.mouseLeave(revenueBar);
    fireEvent.focus(screen.getByRole('img', { name: /PFS: 1 active enrolments/ }));
    expect(screen.getByRole('status').textContent).toContain('Share of active enrolments');
  });
});
