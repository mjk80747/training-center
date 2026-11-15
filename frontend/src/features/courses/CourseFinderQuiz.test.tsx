import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CourseFinderQuiz } from './CourseFinderQuiz';
import type { CourseItem } from './types';

afterEach(cleanup);

const courses: CourseItem[] = [
  {
    id: 1,
    code: 'PFS',
    name: 'Python Full Stack',
    description: 'Python, web development, and project work.',
    duration_months: 5,
    fee: 6999,
    learning_mode: 'Hybrid',
    skills_covered: 'Python, Django, React',
    modules: [],
  },
  {
    id: 2,
    code: 'DA',
    name: 'Data Analytics',
    description: 'Analytics and dashboards.',
    duration_months: 4,
    fee: 6999,
    learning_mode: 'Hybrid',
    skills_covered: 'Excel, SQL, Python',
    modules: [],
  },
];

describe('CourseFinderQuiz', () => {
  it('uses the quiz answers to recommend a real course and shows its details', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <CourseFinderQuiz courses={courses} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /find your perfect course/i }));
    expect(screen.getByRole('heading', { name: "What's your background?" })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /fresher/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: /some basics/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: /building websites & apps/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: /first tech job/i }));
    fireEvent.click(screen.getByRole('button', { name: /see my result/i }));

    expect(screen.getByRole('heading', { name: 'Python Full Stack' })).toBeTruthy();
    expect(screen.getByText('5 months')).toBeTruthy();
    expect(screen.getByText('₹6,999')).toBeTruthy();
    expect(screen.getByRole('link', { name: /view course details/i }).getAttribute('href')).toBe('/courses#course-1');
  });
});
