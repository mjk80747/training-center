import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { AxiosResponse } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listStudents } from './api/students';
import App from './App';
import { setAuthSession } from './store/auth';
import { MemoryRouter } from 'react-router-dom';

vi.mock('./api/students', () => ({
  listStudents: vi.fn(),
  createStudent: vi.fn(),
  updateStudent: vi.fn(),
  archiveStudent: vi.fn(),
}));

describe('admin student actions', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    setAuthSession(
      { id: 1, email: 'admin@example.com', full_name: 'Admin User', role: 'ADMIN' },
      'access-token',
      'refresh-token',
    );
    vi.mocked(listStudents).mockResolvedValue({
      data: {
        results: [{
          id: 7,
          student_code: 'STU-001',
          full_name: 'Rahul Sharma',
          email: 'rahul@example.com',
          mobile: '9000000000',
          status: 'ACTIVE',
          is_active: true,
          email_verified: true,
          city: 'Tirupati',
        }],
      },
    } as AxiosResponse);
  });

  it('opens the row actions menu and launches the existing student edit form', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/students']}>
        <App />
      </MemoryRouter>,
    );

    await screen.findByText('Rahul Sharma', {}, { timeout: 5000 });
    fireEvent.click(screen.getByRole('button', { name: 'More actions for Rahul Sharma' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));

    expect(await screen.findByRole('heading', { name: 'Edit student' })).toBeTruthy();
    expect(screen.getByDisplayValue('Rahul Sharma')).toBeTruthy();
    expect(screen.getByDisplayValue('rahul@example.com')).toBeTruthy();
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('closes the row actions menu when Escape is pressed', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/students']}>
        <App />
      </MemoryRouter>,
    );

    await screen.findByText('Rahul Sharma', {}, { timeout: 5000 });
    fireEvent.click(screen.getByRole('button', { name: 'More actions for Rahul Sharma' }));
    expect(screen.getByRole('menu')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
  });
});
