import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { AxiosResponse } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listBatches } from '../../api/batches';
import { listCertificates } from '../../api/certificates';
import { listEnrolments } from '../../api/fees';
import { StudentCertificatesPage } from './StudentCertificatesPage';

vi.mock('../../api/batches', () => ({ listBatches: vi.fn() }));
vi.mock('../../api/certificates', () => ({ listCertificates: vi.fn() }));
vi.mock('../../api/fees', () => ({ listEnrolments: vi.fn() }));

function response(data: unknown) {
  return { data } as AxiosResponse;
}

describe('StudentCertificatesPage', () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listCertificates).mockResolvedValue(response({ results: [
      { id: 1, course: 4, course_name: 'Python Foundations', certificate_id: 'CERT-2025-0142', issued_date: '2025-12-15', pdf_file: 'https://example.test/certificate.pdf' },
    ] }));
    vi.mocked(listEnrolments).mockResolvedValue(response({ results: [
      { id: 2, course: 4, status: 'COMPLETED' },
      { id: 3, course: 7, status: 'ACTIVE' },
      { id: 4, course: 9, status: 'DROPPED' },
    ] }));
    vi.mocked(listBatches).mockResolvedValue(response({ results: [
      { course: 4, course_name: 'Python Foundations' },
      { course: 7, course_name: 'Python Full Stack' },
    ] }));
  });

  it('shows issued certificates and only non-issued active or completed course cards', async () => {
    render(<StudentCertificatesPage />);

    expect(await screen.findByText('Python Foundations')).toBeTruthy();
    expect(screen.getByText(/CERT-2025-0142/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'View certificate' }).getAttribute('href')).toBe('https://example.test/certificate.pdf');
    expect(screen.getByText('Python Full Stack — Completion')).toBeTruthy();
    expect(screen.queryByText('Python Foundations — Completion')).toBeNull();
    expect(screen.queryByText(/Course completion certificate — Completion/)).toBeNull();
  });

  it('shows a real empty state when the student has no certificates or enrolled courses', async () => {
    vi.mocked(listCertificates).mockResolvedValue(response({ results: [] }));
    vi.mocked(listEnrolments).mockResolvedValue(response({ results: [] }));

    render(<StudentCertificatesPage />);

    expect(await screen.findByText('No certificates or enrolled course certificates are available yet.')).toBeTruthy();
  });

  it('shows API errors and can retry the request', async () => {
    vi.mocked(listCertificates)
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValue(response({ results: [] }));

    render(<StudentCertificatesPage />);

    expect(await screen.findByRole('alert')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Try again/i }));
    await waitFor(() => expect(listCertificates).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Python Full Stack — Completion')).toBeTruthy();
  });
});
