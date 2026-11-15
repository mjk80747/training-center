import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { clearAuthSession, setAuthSession, type UserRole } from '../store/auth';
import { ProtectedRoute } from './ProtectedRoute';

afterEach(cleanup);

function renderStudentRoute() {
  return render(
    <MemoryRouter
      initialEntries={['/student/courses']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/" element={<p>Public home</p>} />
        <Route
          path="/student/*"
          element={(
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <p>Student portal</p>
            </ProtectedRoute>
          )}
        />
      </Routes>
    </MemoryRouter>,
  );
}

function renderAdminFeesRoute(role: UserRole) {
  signInForTest(role);
  return render(
    <MemoryRouter
      initialEntries={['/admin/fees']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/" element={<p>Public home</p>} />
        <Route
          path="/admin/*"
          element={(
            <ProtectedRoute allowedRoles={['ADMIN', 'COUNSELLOR']}>
              <Routes>
                <Route
                  path="fees"
                  element={(
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <p>Admin fees</p>
                    </ProtectedRoute>
                  )}
                />
              </Routes>
            </ProtectedRoute>
          )}
        />
      </Routes>
    </MemoryRouter>,
  );
}

function signInForTest(role: UserRole) {
  setAuthSession(
    { id: 1, email: 'student@example.com', full_name: 'Student', role },
    'test-access-token',
    'test-refresh-token',
  );
}

describe('ProtectedRoute', () => {
  beforeEach(clearAuthSession);

  it('redirects signed-out visitors to login', () => {
    renderStudentRoute();

    expect(screen.getByText('Login page')).toBeTruthy();
  });

  it('redirects visitors without an access token to login', () => {
    localStorage.setItem('user', JSON.stringify({
      id: 1,
      email: 'student@example.com',
      full_name: 'Student',
      role: 'STUDENT',
    }));

    renderStudentRoute();

    expect(screen.getByText('Login page')).toBeTruthy();
  });

  it('redirects a signed-in user whose role is not allowed', () => {
    signInForTest('TRAINER');

    renderStudentRoute();

    expect(screen.getByText('Public home')).toBeTruthy();
  });

  it('renders the protected page for an authorized signed-in user', () => {
    signInForTest('STUDENT');

    renderStudentRoute();

    expect(screen.getByText('Student portal')).toBeTruthy();
  });

  it('blocks counsellors from the admin-only fees page', () => {
    renderAdminFeesRoute('COUNSELLOR');

    expect(screen.getByText('Public home')).toBeTruthy();
  });

  it('allows admins to open the fees page', () => {
    renderAdminFeesRoute('ADMIN');

    expect(screen.getByText('Admin fees')).toBeTruthy();
  });
});
