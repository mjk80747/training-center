import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { clearAuthSession, setAuthSession, type UserRole } from '../store/auth';

afterEach(cleanup);

function renderAdminLayout(role: UserRole) {
  setAuthSession(
    { id: 1, email: `${role.toLowerCase()}@example.com`, full_name: role, role },
    'test-access-token',
    'test-refresh-token',
  );
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AdminLayout />
    </MemoryRouter>,
  );
}

describe('AdminLayout role navigation', () => {
  beforeEach(() => {
    clearAuthSession();
  });

  it('shows counsellor work areas but hides finance and reports', () => {
    renderAdminLayout('COUNSELLOR');

    expect(screen.getByRole('link', { name: 'Students' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Batches' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Leads' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Course catalog' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Fees' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Reports' })).toBeNull();
  });

  it('shows finance and reports to admins', () => {
    renderAdminLayout('ADMIN');

    expect(screen.getByRole('link', { name: 'Fees' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Reports' })).toBeTruthy();
  });

  it('does not render workspace search or notifications in the top bar', () => {
    renderAdminLayout('COUNSELLOR');

    expect(screen.queryByRole('textbox', { name: 'Search workspace pages' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Notifications' })).toBeNull();
  });

  it('opens the account menu with user details and no sign-out action', () => {
    renderAdminLayout('ADMIN');

    fireEvent.click(screen.getByRole('button', { name: 'Account menu for ADMIN' }));

    const accountMenu = screen.getByRole('dialog', { name: 'Account menu' });
    expect(accountMenu).toBeTruthy();
    expect(within(accountMenu).getByText('admin@example.com')).toBeTruthy();
    expect(within(accountMenu).queryByRole('link', { name: 'Sign out' })).toBeNull();
  });
});
