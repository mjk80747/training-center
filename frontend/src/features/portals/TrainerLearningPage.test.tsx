import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { AxiosResponse } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createAssignment,
  createMaterial,
  gradeSubmission,
  listAssignments,
  listMaterials,
  listSubmissions,
} from '../../api/learning';
import { listBatches } from '../../api/batches';
import { listStudents } from '../../api/students';
import { TrainerLearningPage } from './TrainerLearningPage';

vi.mock('../../api/learning', () => ({
  createAssignment: vi.fn(),
  createMaterial: vi.fn(),
  gradeSubmission: vi.fn(),
  listAssignments: vi.fn(),
  listMaterials: vi.fn(),
  listSubmissions: vi.fn(),
}));
vi.mock('../../api/batches', () => ({ listBatches: vi.fn() }));
vi.mock('../../api/students', () => ({ listStudents: vi.fn() }));

function response(data: unknown) {
  return { data } as AxiosResponse;
}

describe('TrainerLearningPage', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listBatches).mockResolvedValue(response({ results: [
      { id: 8, batch_code: 'PFS-WD-01' },
      { id: 9, batch_code: 'DA-WD-02' },
    ] }));
    vi.mocked(listStudents).mockResolvedValue(response({ results: [
      { id: 12, full_name: 'Rahul Sharma' },
      { id: 13, full_name: 'Priya Nair' },
    ] }));
    vi.mocked(listMaterials).mockResolvedValue(response({ results: [
      { id: 1, title: 'Django ORM slides', file_type: 'PPT', batch: 8, file: '/media/slides.pptx', url: '', created_at: '2026-02-17T10:00:00Z' },
    ] }));
    vi.mocked(listAssignments).mockResolvedValue(response({ results: [
      { id: 21, batch: 8, title: 'Build a REST API', description: '', due_date: '2027-01-15', max_marks: 50, attachment: null },
    ] }));
    vi.mocked(listSubmissions).mockResolvedValue(response({ results: [
      { id: 31, assignment: 21, student: 12, file: '/media/submission.zip', github_link: '', submitted_at: '2026-11-04T10:00:00Z', marks: 0, feedback: '', status: 'SUBMITTED' },
    ] }));
    vi.mocked(createMaterial).mockImplementation(async (formData) => response({
      id: 2,
      title: formData.get('title'),
      file_type: formData.get('file_type'),
      batch: Number(formData.get('batch')),
      file: '/media/uploaded.pdf',
      url: '',
      created_at: new Date().toISOString(),
    }));
    vi.mocked(createAssignment).mockImplementation(async (formData) => response({
      id: 22,
      title: formData.get('title'),
      batch: Number(formData.get('batch')),
      due_date: formData.get('due_date'),
      max_marks: Number(formData.get('max_marks')),
      description: formData.get('description'),
      attachment: null,
    }));
    vi.mocked(gradeSubmission).mockResolvedValue(response({
      id: 31,
      assignment: 21,
      student: 12,
      file: '/media/submission.zip',
      github_link: '',
      submitted_at: '2026-11-04T10:00:00Z',
      marks: '42.00',
      feedback: 'Good work',
      status: 'GRADED',
    }));
  });

  it('renders live material, assignment and evaluation tabs for trainer data', async () => {
    render(<TrainerLearningPage />);

    expect(await screen.findByText('Django ORM slides')).toBeTruthy();
    expect(screen.getByText((_, element) => element?.tagName === 'P' && element.textContent?.includes('PFS-WD-01 · Slides') === true)).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: /Assignments/ }));
    expect(await screen.findByText('Build a REST API')).toBeTruthy();
    expect(screen.getByText('PFS-WD-01')).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: /Evaluations/ }));
    expect(await screen.findByText('Rahul Sharma')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'View file' })).toBeTruthy();
  });

  it('uploads a material to the selected assigned batch', async () => {
    render(<TrainerLearningPage />);
    await screen.findByText('Django ORM slides');

    fireEvent.click(screen.getByRole('button', { name: 'Upload material' }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'New class notes' } });
    const file = new File(['notes'], 'notes.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText(/File/), { target: { files: [file] } });
    const uploadForm = screen.getByRole('dialog').querySelector('form');
    if (!uploadForm) throw new Error('Expected the material upload form to be visible.');
    fireEvent.submit(uploadForm);

    await waitFor(() => expect(createMaterial).toHaveBeenCalled());
    const formData = vi.mocked(createMaterial).mock.calls[0][0];
    expect(formData.get('title')).toBe('New class notes');
    expect(formData.get('batch')).toBe('8');
    expect(formData.get('file')).toBe(file);
    expect((await screen.findByRole('status')).textContent).toContain('Material uploaded');
    expect(screen.getByText('New class notes')).toBeTruthy();
  });

  it('publishes an assignment and submits grades from the evaluations tab', async () => {
    render(<TrainerLearningPage />);
    await screen.findByText('Django ORM slides');

    fireEvent.click(screen.getByRole('tab', { name: /Assignments/ }));
    fireEvent.click(screen.getByRole('button', { name: 'New assignment' }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Build a portfolio' } });
    fireEvent.change(screen.getByLabelText('Due date'), { target: { value: '2027-01-20' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publish assignment' }));
    await waitFor(() => expect(createAssignment).toHaveBeenCalled());
    expect(screen.getByText('Build a portfolio')).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: /Evaluations/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Evaluate' }));
    const gradeForm = screen.getByRole('spinbutton', { name: 'Marks' }).closest('form');
    if (!gradeForm) throw new Error('Expected the grading form to be visible.');
    fireEvent.change(within(gradeForm).getByRole('spinbutton', { name: 'Marks' }), { target: { value: '42' } });
    fireEvent.change(within(gradeForm).getByRole('textbox', { name: 'Feedback' }), { target: { value: 'Good work' } });
    fireEvent.click(within(gradeForm).getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(gradeSubmission).toHaveBeenCalledWith(31, 42, 'Good work'));
    expect(await screen.findByText('42.00 / 50')).toBeTruthy();
  });
});
