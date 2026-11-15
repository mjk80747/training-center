import { render, screen, waitFor } from '@testing-library/react';
import type { AxiosResponse } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listBatches } from '../../api/batches';
import { listCourses } from '../../api/courses';
import { AdminCoursesPage } from './AdminCoursesPage';

vi.mock('../../api/batches', () => ({ listBatches: vi.fn() }));
vi.mock('../../api/courses', () => ({ listCourses: vi.fn() }));

describe('AdminCoursesPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders live courses with their duration, fee, batch count, and status', async () => {
    vi.mocked(listCourses).mockResolvedValue({
      data: {
        results: [
          { id: 1, code: 'PFS', name: 'Python Full Stack', duration_months: 5, fee: '6999.00', status: 'ACTIVE' },
        ],
      },
    } as AxiosResponse);
    vi.mocked(listBatches).mockResolvedValue({
      data: { results: [{ course: 1 }, { course: 1 }, { course: 2 }] },
    } as AxiosResponse);

    render(<AdminCoursesPage />);

    expect(await screen.findByText('Python Full Stack')).toBeTruthy();
    expect(screen.getByText('5 months')).toBeTruthy();
    expect(screen.getByText('₹6,999')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
    expect(screen.queryByText(/sample data/i)).toBeNull();
  });

  it('shows a visible error and retry action when catalogue requests fail', async () => {
    vi.mocked(listCourses).mockRejectedValue(new Error('Request failed'));
    vi.mocked(listBatches).mockResolvedValue({ data: { results: [] } } as AxiosResponse);

    render(<AdminCoursesPage />);

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    await waitFor(() => expect(listCourses).toHaveBeenCalledTimes(1));
  });
});
