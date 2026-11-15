import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { AxiosResponse } from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listAssignments, listMaterials, listSubmissions } from '../../api/learning';
import { StudentLearningPage } from './StudentLearningPage';

vi.mock('../../api/learning', () => ({
  listAssignments: vi.fn(),
  listMaterials: vi.fn(),
  listSubmissions: vi.fn(),
}));

function response(data: unknown) {
  return { data } as AxiosResponse;
}

function renderPage() {
  return render(<MemoryRouter><StudentLearningPage /></MemoryRouter>);
}

describe('StudentLearningPage', () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listMaterials).mockResolvedValue(response({ results: [
      { id: 1, title: 'Django ORM deep-dive — slides', file_type: 'PPT', batch: 7, file: 'https://example.test/orm.pdf', url: '', created_at: '2026-02-17T10:00:00Z' },
      { id: 2, title: 'REST API starter repo', file_type: 'CODE', batch: 7, file: '', url: 'https://example.test/repo', created_at: '2026-02-18T10:00:00Z' },
    ] }));
    vi.mocked(listAssignments).mockResolvedValue(response({ results: [
      { id: 4, batch: 7, title: 'Build an authentication API', description: 'Implement JWT authentication and tests.', attachment: 'https://example.test/assignment.pdf', due_date: '2026-11-20', max_marks: 100 },
    ] }));
    vi.mocked(listSubmissions).mockResolvedValue(response({ results: [
      { id: 8, assignment: 4, submitted_at: '2026-11-10T10:00:00Z', marks: '86.00', feedback: 'Clear implementation.', status: 'GRADED' },
    ] }));
  });

  it('renders only the learning materials tab initially', async () => {
    renderPage();

    expect(await screen.findByText('Django ORM deep-dive — slides')).toBeTruthy();
    expect(screen.getByText('REST API starter repo')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Open Django ORM deep-dive — slides' }).getAttribute('href')).toBe('https://example.test/orm.pdf');
    expect(screen.getByRole('tab', { name: 'Materials' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tab', { name: 'Assignments' }).getAttribute('aria-selected')).toBe('false');
    expect(screen.queryByText('Build an authentication API')).toBeNull();
  });

  it('shows assignment due dates and the student submission evaluation', async () => {
    renderPage();
    await screen.findByText('Django ORM deep-dive — slides');

    fireEvent.click(screen.getByRole('tab', { name: 'Assignments' }));

    expect(await screen.findByText('Build an authentication API')).toBeTruthy();
    expect(screen.getByText('Implement JWT authentication and tests.')).toBeTruthy();
    expect(screen.getByText('Reviewed')).toBeTruthy();
    expect(screen.getByText('86.00 / 100')).toBeTruthy();
    expect(screen.getByText('Clear implementation.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Open Build an authentication API attachment' }).getAttribute('href')).toBe('https://example.test/assignment.pdf');
  });

  it('shows API errors and can retry loading learning content', async () => {
    vi.mocked(listMaterials)
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValue(response({ results: [] }));

    renderPage();

    expect(await screen.findByRole('alert')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Try again/i }));
    await waitFor(() => expect(listMaterials).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('No materials have been shared with your batches yet.')).toBeTruthy();
  });
});
