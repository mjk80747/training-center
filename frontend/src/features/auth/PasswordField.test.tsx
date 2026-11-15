import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PasswordField } from './PasswordField';

afterEach(cleanup);

describe('PasswordField', () => {
  it('toggles password visibility while preserving the input value', () => {
    render(<PasswordField label="Password" value="correct-horse" onChange={() => {}} />);

    const input = screen.getByLabelText('Password') as HTMLInputElement;
    expect(input.type).toBe('password');
    expect(input.value).toBe('correct-horse');

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input.type).toBe('text');
    expect(input.value).toBe('correct-horse');
    const hideButton = screen.getByRole('button', { name: 'Hide password' });
    expect(hideButton.getAttribute('aria-pressed')).toBe('true');
    expect(hideButton.querySelector('.lucide-eye-off')).toBeTruthy();

    fireEvent.click(hideButton);
    expect(input.type).toBe('password');
    expect(input.value).toBe('correct-horse');
    const showButton = screen.getByRole('button', { name: 'Show password' });
    expect(showButton.querySelector('.lucide-eye')).toBeTruthy();
  });
});
