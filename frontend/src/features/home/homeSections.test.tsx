import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import {
  FinalCtaBanner,
  HiringPartnersSection,
  LearningPathSection,
  PracticeSessionCard,
  StatsCounterStrip,
  TestimonialsCarousel,
  WhyChooseUsSection,
} from './index';

afterEach(cleanup);

describe('Home Page New Sections', () => {
  describe('StatsCounterStrip', () => {
    it('renders all key institute metrics and labels', () => {
      render(<StatsCounterStrip />);

      expect(screen.getByText('1,250+')).toBeDefined();
      expect(screen.getByText('Graduates Trained')).toBeDefined();
      expect(screen.getByText('94.8%')).toBeDefined();
      expect(screen.getByText('Placement Success')).toBeDefined();
      expect(screen.getByText('50+')).toBeDefined();
      expect(screen.getByText('Hiring Partners')).toBeDefined();
      expect(screen.getByText('4.9 / 5')).toBeDefined();
      expect(screen.getByText('Alumni Rating')).toBeDefined();
      expect(screen.getByText('70%')).toBeDefined();
      expect(screen.getByText('Hands-on Coding')).toBeDefined();
    });

    it('renders with accessible container label', () => {
      render(<StatsCounterStrip />);
      expect(screen.getByLabelText('Key Institute Metrics & Highlights')).toBeDefined();
    });
  });

  describe('WhyChooseUsSection', () => {
    it('renders heading, subtitle, and all 6 core feature cards', () => {
      render(<WhyChooseUsSection />);

      expect(screen.getByRole('heading', { name: 'Engineered for Real Tech Careers, Not Just Theory' })).toBeDefined();
      expect(screen.getByText('70% Practical & Project-First')).toBeDefined();
      expect(screen.getByText('Senior Industry Mentors')).toBeDefined();
      expect(screen.getByText('Dedicated Placement Cell')).toBeDefined();
      expect(screen.getByText('Modern & In-Demand Stacks')).toBeDefined();
      expect(screen.getByText('Flexible Modes & Batch Timings')).toBeDefined();
      expect(screen.getByText('Deployable Portfolio Capstones')).toBeDefined();
    });

    it('displays feature badges and highlight bullets', () => {
      render(<WhyChooseUsSection />);

      expect(screen.getByText('Code Every Day')).toBeDefined();
      expect(screen.getByText('1-on-1 Feedback')).toBeDefined();
      expect(screen.getByText('Career Acceleration')).toBeDefined();
      expect(screen.getByText('Hands-on daily coding drills')).toBeDefined();
    });
  });

  describe('LearningPathSection', () => {
    it('renders the 4-step progressive milestones and key deliverables', () => {
      render(
        <MemoryRouter>
          <LearningPathSection />
        </MemoryRouter>,
      );

      expect(screen.getByRole('heading', { name: 'Your 4-Step Journey from Beginner to Hired Engineer' })).toBeDefined();
      expect(screen.getByText('01')).toBeDefined();
      expect(screen.getByText('Foundations & Architecture')).toBeDefined();
      expect(screen.getByText('02')).toBeDefined();
      expect(screen.getByText('Intensive Practical Labs')).toBeDefined();
      expect(screen.getByText('03')).toBeDefined();
      expect(screen.getByText('Enterprise Capstone & Reviews')).toBeDefined();
      expect(screen.getByText('04')).toBeDefined();
      expect(screen.getByText('Mock Interviews & Hiring')).toBeDefined();

      expect(screen.getByText('Clean Code Foundations')).toBeDefined();
      expect(screen.getByText('Dream Job Placement')).toBeDefined();
    });

    describe('PracticeSessionCard', () => {
      it('shows the planned two-hour class structure', () => {
        render(<PracticeSessionCard />);

        expect(screen.getByRole('complementary', { name: 'Sample two-hour class plan' })).toBeDefined();
        expect(screen.getByText('Concept instruction')).toBeDefined();
        expect(screen.getByText('45 min')).toBeDefined();
        expect(screen.getByText('Practical work')).toBeDefined();
        expect(screen.getByText('40 min')).toBeDefined();
        expect(screen.getByText('Doubts & assignment')).toBeDefined();
      });
    });

    it('includes a link to browse courses', () => {
      render(
        <MemoryRouter>
          <LearningPathSection />
        </MemoryRouter>,
      );

      const link = screen.getByRole('link', { name: /Browse All Syllabuses/i });
      expect(link.getAttribute('href')).toBe('/courses');
    });
  });

  describe('TestimonialsCarousel', () => {
    it('renders initial testimonial and allows navigation via next and prev buttons', () => {
      render(<TestimonialsCarousel />);

      expect(screen.getByText('Priya Sharma')).toBeDefined();
      expect(screen.getByText(/Associate Software Engineer/i)).toBeDefined();
      expect(screen.getAllByText(/Capgemini/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/6.5 LPA Package/i)).toBeDefined();

      const nextBtn = screen.getByRole('button', { name: 'Next testimonial' });
      fireEvent.click(nextBtn);

      // Second testimonial is Rahul Verma
      expect(screen.getByText('Rahul Verma')).toBeDefined();
      expect(screen.getAllByText(/Infosys/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/7.2 LPA Package/i)).toBeDefined();

      const prevBtn = screen.getByRole('button', { name: 'Previous testimonial' });
      fireEvent.click(prevBtn);

      // Back to Priya Sharma
      expect(screen.getByText('Priya Sharma')).toBeDefined();
    });

    it('navigates when clicking a dot indicator', () => {
      render(<TestimonialsCarousel />);

      const dots = screen.getAllByRole('tab');
      expect(dots.length).toBeGreaterThanOrEqual(4);

      // Click on dot for Ananya Patel (index 2)
      fireEvent.click(dots[2]);
      expect(screen.getByText('Ananya Patel')).toBeDefined();
      expect(screen.getAllByText(/Accenture/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/6.8 LPA Package/i)).toBeDefined();
    });
  });

  describe('HiringPartnersSection', () => {
    it('renders partner company tiles and hiring stats footer', () => {
      render(<HiringPartnersSection />);

      expect(screen.getByRole('heading', { name: /Top Companies Hiring from/i })).toBeDefined();

      const tcsTile = screen.getByTestId('partner-tcs');
      expect(within(tcsTile).getByText('TCS')).toBeDefined();

      const capgeminiTile = screen.getByTestId('partner-capgemini');
      expect(within(capgeminiTile).getByText('Capgemini')).toBeDefined();

      const infosysTile = screen.getByTestId('partner-infosys');
      expect(within(infosysTile).getByText('Infosys')).toBeDefined();

      const amazonTile = screen.getByTestId('partner-amazon');
      expect(within(amazonTile).getByText('Amazon')).toBeDefined();

      expect(screen.getByText(/50\+/i)).toBeDefined();
      expect(screen.getByText(/Active Recruiting Partners/i)).toBeDefined();
      expect(screen.getByText(/4.5 LPA – 12 LPA/i)).toBeDefined();
    });
  });

  describe('FinalCtaBanner', () => {
    it('renders call to action headline, buttons, and trust guarantees', () => {
      render(
        <MemoryRouter>
          <FinalCtaBanner />
        </MemoryRouter>,
      );

      expect(screen.getByRole('heading', { name: 'Ready to Accelerate Your Career in Tech?' })).toBeDefined();

      const coursesLink = screen.getByRole('link', { name: /Explore All Courses/i });
      expect(coursesLink.getAttribute('href')).toBe('/courses');

      const counselLink = screen.getByRole('link', { name: /Book Free Counselling/i });
      expect(counselLink.getAttribute('href')).toContain('/contact');

      expect(screen.getByText('Next batch starts this Monday')).toBeDefined();
      expect(screen.getByText('Flexible EMI & Instalments')).toBeDefined();
      expect(screen.getByText('Dedicated Placement Guidance')).toBeDefined();
    });
  });
});
