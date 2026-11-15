import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CourseCatalogSection } from './CourseCatalogSection';

function renderCatalog(props: Parameters<typeof CourseCatalogSection>[0]) {
  return render(
    <MemoryRouter>
      <CourseCatalogSection {...props} />
    </MemoryRouter>,
  );
}

describe('CourseCatalogSection', () => {
  it('shows accessible skeletons while loading', () => {
    renderCatalog({ courses: [], loading: true, error: '', onRetry: vi.fn() });

    expect(screen.getByRole('status').textContent).toContain('Loading trending courses');
    expect(document.querySelector('.syllabus-course-grid')?.getAttribute('aria-busy')).toBe('true');
    expect(document.querySelectorAll('.syllabus-course-skeleton')).toHaveLength(3);
  });

  it('shows the error and invokes retry', () => {
    const onRetry = vi.fn();
    renderCatalog({
      courses: [],
      loading: false,
      error: 'Unable to reach the course service.',
      onRetry,
    });

    expect(screen.getByRole('alert').textContent).toContain('Unable to reach the course service.');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('shows an empty state and contact link when there are no courses', () => {
    renderCatalog({ courses: [], loading: false, error: '', onRetry: vi.fn() });

    expect(screen.getByRole('heading', { name: 'Courses are coming soon' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Contact admissions' }).getAttribute('href')).toBe('/contact');
  });
});
