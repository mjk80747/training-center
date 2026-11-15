import { cleanup, render, screen, waitFor } from '@testing-library/react';
import type { AxiosResponse } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listEnrolments, listInstalments, listPayments } from '../../api/fees';
import { StudentFeesPage } from './StudentFeesPage';

vi.mock('../../api/fees', () => ({
  listEnrolments: vi.fn(),
  listInstalments: vi.fn(),
  listPayments: vi.fn(),
}));

function response(data: unknown) {
  return { data } as AxiosResponse;
}

describe('StudentFeesPage', () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listEnrolments).mockResolvedValue(response({ results: [
      { id: 1, final_fee: '38000.00' },
      { id: 2, final_fee: '2000.00' },
    ] }));
    vi.mocked(listPayments).mockResolvedValue(response({ results: [
      { id: 7, enrolment: 1, amount: '26600.00', payment_date: '2026-02-10', status: 'SUCCESS', mode: 'UPI', transaction_id: 'TXN1001', receipt_number: '' },
      { id: 8, enrolment: 1, amount: '5000.00', payment_date: '2026-02-12', status: 'FAILED', mode: 'BANK', transaction_id: 'TXN1002', receipt_number: '' },
      { id: 9, enrolment: 99, amount: '999999.00', payment_date: '2026-02-12', status: 'SUCCESS', mode: 'CASH', transaction_id: 'OTHER', receipt_number: '' },
    ] }));
    vi.mocked(listInstalments).mockResolvedValue(response({ results: [
      { id: 11, enrolment: 1, amount: '15200.00', due_date: '2026-01-10', status: 'PAID' },
      { id: 12, enrolment: 1, amount: '11400.00', due_date: '2099-02-10', status: 'PENDING' },
    ] }));
  });

  it('calculates the signed-in student fee totals and renders instalments and payments', async () => {
    render(<StudentFeesPage />);

    expect(await screen.findByText('₹40,000')).toBeTruthy();
    expect(screen.getAllByText('₹26,600')).toHaveLength(2);
    expect(screen.getByText('Balance ₹13,400')).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: 'Course fee paid' }).getAttribute('aria-valuenow')).toBe('67');

    const instalmentTable = screen.getByRole('table', { name: 'Instalment plan' });
    expect(instalmentTable).toBeTruthy();
    expect(screen.getByText('₹15,200')).toBeTruthy();
    expect(screen.getByText('₹11,400')).toBeTruthy();
    expect(screen.getByText(/TXN1001/)).toBeTruthy();
    expect(screen.queryByText('OTHER')).toBeNull();
    expect(screen.getByText('Pay at the institute desk by cash, UPI, bank transfer or cheque. Online payments are coming soon.')).toBeTruthy();
  });

  it('reports loading failures and exposes a retry action', async () => {
    vi.mocked(listEnrolments)
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValue(response({ results: [] }));

    render(<StudentFeesPage />);
    expect(await screen.findByRole('alert')).toBeTruthy();

    screen.getByRole('button', { name: /Try again/i }).click();
    await waitFor(() => expect(listEnrolments).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('No instalment records are available yet.')).toBeTruthy();
  });
});
