import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CourseCard } from './CourseCard';
import type { CourseItem } from './types';

afterEach(cleanup);

const mockCourse: CourseItem = {
  id: 101,
  code: 'PFS',
  name: 'Python Full Stack',
  description: 'Master Python, Django, modern React frontend, and build production web apps.',
  duration_months: 5,
  total_modules: 9,
  fee: 6999,
  learning_mode: 'HYBRID',
  skills_covered: 'Python, Django, React, REST APIs, PostgreSQL',
  level: 'Beginner to Advanced',
  modules: [
    { id: 1, title: 'Python Core & Data Structures', description: 'Syntax, OOP, and problem solving', duration_hours: 24 },
    { id: 2, title: 'Django Backend & ORM', description: 'Models, migrations, views, and DRF', duration_hours: 32 },
    { id: 3, title: 'React 18 & Frontend State', description: 'Components, hooks, and TanStack query', duration_hours: 30 },
  ],
};

function renderCard(course = mockCourse) {
  return render(
    <MemoryRouter>
      <CourseCard course={course} />
    </MemoryRouter>,
  );
}

describe('CourseCard Component', () => {
  it('renders course name, code, level, duration, and batch mode', () => {
    renderCard();

    expect(screen.getByText('Python Full Stack')).toBeDefined();
    expect(screen.getByText('PFS')).toBeDefined();

    // Check level
    expect(screen.getByTestId('course-level').textContent).toContain('Beginner to Advanced');

    // Check duration
    expect(screen.getByTestId('course-duration').textContent).toContain('5 Months');

    // Check batch mode
    expect(screen.getByTestId('course-batch-mode').textContent).toContain('Hybrid');
  });

  it('renders all key tech tags', () => {
    renderCard();

    const tags = screen.getAllByTestId('tech-tag');
    expect(tags.length).toBe(5);
    expect(screen.getByText('Python')).toBeDefined();
    expect(screen.getByText('Django')).toBeDefined();
    expect(screen.getByText('React')).toBeDefined();
    expect(screen.getByText('REST APIs')).toBeDefined();
    expect(screen.getByText('PostgreSQL')).toBeDefined();
  });

  it('handles "View syllabus" toggle button and displays modules', async () => {
    renderCard();

    const toggleBtn = screen.getByTestId('view-syllabus-btn');
    expect(toggleBtn.textContent).toContain('View syllabus');
    expect(toggleBtn.getAttribute('aria-expanded')).toBe('false');

    // Modules should not be visible before toggle
    expect(screen.queryByTestId('syllabus-module-list')).toBeNull();

    // Click to expand syllabus
    fireEvent.click(toggleBtn);

    expect(toggleBtn.textContent).toContain('Hide syllabus');
    expect(toggleBtn.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByTestId('syllabus-module-list')).toBeDefined();
    expect(screen.getByText('Python Core & Data Structures')).toBeDefined();
    expect(screen.getByText('Django Backend & ORM')).toBeDefined();
    expect(screen.getByText('React 18 & Frontend State')).toBeDefined();

    // Click again to hide syllabus
    fireEvent.click(toggleBtn);
    expect(toggleBtn.textContent).toContain('View syllabus');
    expect(toggleBtn.getAttribute('aria-expanded')).toBe('false');
    await waitFor(() => expect(screen.queryByTestId('syllabus-module-list')).toBeNull());
  });

  it('renders program fee and enquire link', () => {
    renderCard();

    expect(screen.getByText('₹6,999')).toBeTruthy();
    const enquireLink = screen.getByRole('link', { name: /Enquire about Python Full Stack/i });
    expect(enquireLink.getAttribute('href')).toContain('/contact?course=Python%20Full%20Stack');
  });

  it('displays the Core Python fee', () => {
    renderCard({
      ...mockCourse,
      id: 102,
      code: 'PYCORE',
      name: 'Core Python',
      duration_months: 3,
      fee: 4999,
    });

    expect(screen.getByText('Core Python')).toBeTruthy();
    expect(screen.getByText('₹4,999')).toBeTruthy();
  });

  it('displays course image if image url is provided', () => {
    const courseWithImage: CourseItem = {
      ...mockCourse,
      image: 'https://example.com/pfs-preview.png',
    };
    renderCard(courseWithImage);

    const img = screen.getByAltText(/Python Full Stack preview/i);
    expect(img).toBeDefined();
    expect(img.getAttribute('src')).toBe('https://example.com/pfs-preview.png');
  });
});
