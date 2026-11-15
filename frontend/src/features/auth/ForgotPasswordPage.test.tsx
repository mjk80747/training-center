import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import apiClient from '../../api/client';
import { ForgotPasswordPage } from './ForgotPasswordPage';

vi.mock('../../api/client', () => ({
  default: { post: vi.fn() },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ForgotPasswordPage', () => {
  it('requests a code and submits the code with the new password', async () => {
    vi.mocked(apiClient.post)
      .mockResolvedValueOnce({ data: { detail: 'If an account exists, a reset code has been sent.' } } as never)
      .mockResolvedValueOnce({ data: { detail: 'Password reset successfully.' } } as never);

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'student@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));

    await screen.findByRole('heading', { name: 'Reset your password' });
    for (const [index, digit] of [...'123456'].entries()) {
      fireEvent.change(screen.getByLabelText(`Code digit ${index + 1}`), { target: { value: digit } });
    }
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'New!SecurePassword890' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'New!SecurePassword890' } });
    fireEvent.click(screen.getByRole('button', { name: /create new password/i }));

    await screen.findByRole('heading', { name: 'Password updated' });
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenNthCalledWith(1, '/auth/password/forgot/', { email: 'student@example.com' });
      expect(apiClient.post).toHaveBeenNthCalledWith(2, '/auth/password/reset/', {
        email: 'student@example.com',
        code: '123456',
        password: 'New!SecurePassword890',
      });
    });
  });
});
