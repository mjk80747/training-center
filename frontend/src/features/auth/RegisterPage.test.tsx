import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { RegisterPage } from './RegisterPage';

afterEach(cleanup);

describe('RegisterPage', () => {
  it('shows each step-one validation message beneath its matching field', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(screen.getByText('Enter your full name.')).toBeTruthy();
    expect(screen.getByText('Enter a valid email.')).toBeTruthy();
    expect(screen.getByText('Enter a valid 10-digit mobile number.')).toBeTruthy();
    expect(screen.getByText('Enter your college name.')).toBeTruthy();
    expect(screen.getByText('Select your branch.')).toBeTruthy();
    expect(screen.getByText('Select your year.')).toBeTruthy();

    expect(screen.getByLabelText('Full name').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByLabelText('Email address').getAttribute('aria-describedby')).toBe('email-error');
    expect(screen.getByLabelText('Mobile number').getAttribute('aria-describedby')).toBe('mobile-error');
    expect(screen.getByLabelText('Branch').getAttribute('aria-describedby')).toBe('branch-error');
    expect(screen.getByLabelText('Year').getAttribute('aria-describedby')).toBe('year-error');
  });
});
