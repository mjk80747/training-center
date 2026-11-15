import { cleanup, render, screen } from '@testing-library/react';
import type { AxiosResponse } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { listCourses } from './api/courses';
import App from './App';
import type { CourseItem } from './features/courses/types';

vi.mock('./api/courses', () => ({ listCourses: vi.fn() }));

const courses: CourseItem[] = [
  { id: 1, code: 'PFS', name: 'Python Full Stack', description: 'Full stack course', duration_months: 5, fee: 6999, learning_mode: 'HYBRID', modules: [] },
  { id: 2, code: 'JFS', name: 'Java Full Stack', description: 'Full stack course', duration_months: 5, fee: 6999, learning_mode: 'HYBRID', modules: [] },
  { id: 3, code: 'PYCORE', name: 'Core Python', description: 'Core course', duration_months: 3, fee: 4999, learning_mode: 'HYBRID', modules: [] },
  { id: 4, code: 'JCORE', name: 'Core Java', description: 'Core course', duration_months: 3, fee: 4999, learning_mode: 'HYBRID', modules: [] },
  { id: 5, code: 'FED', name: 'Front-End Development', description: 'Frontend course', duration_months: 3, fee: 3999, learning_mode: 'HYBRID', modules: [] },
  { id: 6, code: 'DA', name: 'Data Analytics', description: 'Analytics course', duration_months: 4, fee: 6999, learning_mode: 'HYBRID', modules: [] },
];

describe('Home page course catalog', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listCourses).mockResolvedValue({
      data: { results: courses },
    } as AxiosResponse);
  });

  it('shows every available course, including the final catalog entries', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Core Python' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Core Java' })).toBeTruthy();
    expect(screen.getAllByTestId(/^course-card-/)).toHaveLength(6);
    expect(screen.getByText('30%')).toBeTruthy();
    expect(screen.getByText('70%')).toBeTruthy();
    expect(screen.getByText('3 modes')).toBeTruthy();
    expect(screen.queryByText('100%')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'What’s moving the tech world?' })).toBeNull();
  });
});
