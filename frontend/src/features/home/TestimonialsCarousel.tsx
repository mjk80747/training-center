import { useEffect, useRef, useState } from 'react';
import {
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Quote,
  Sparkles,
  Star,
} from 'lucide-react';
import { instituteName } from '../../lib/config';

export interface TestimonialItem {
  id: string;
  name: string;
  initials: string;
  course: string;
  courseCode: string;
  role: string;
  company: string;
  packageOutcome: string;
  quote: string;
  rating: number;
  badge: string;
  gradient: string;
}

export const defaultTestimonials: TestimonialItem[] = [
  {
    id: 'priya-sharma',
    name: 'Priya Sharma',
    initials: 'PS',
    course: 'Python Full Stack (PFS)',
    courseCode: 'PFS',
    role: 'Associate Software Engineer',
    company: 'Capgemini',
    packageOutcome: '6.5 LPA',
    quote:
      'Coming from a non-CS background, I was intimidated by coding. The mentors broke down Django, React, and REST APIs so clearly. The capstone project was the highlight during my Capgemini interview!',
    rating: 5,
    badge: 'Alumni Placement',
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'rahul-verma',
    name: 'Rahul Verma',
    initials: 'RV',
    course: 'Java Full Stack (JFS)',
    courseCode: 'JFS',
    role: 'Full Stack Engineer',
    company: 'Infosys',
    packageOutcome: '7.2 LPA',
    quote:
      'The 70% practical approach is real. We didn’t just read about Spring Boot and microservices—we actually built and deployed them with PostgreSQL. The mock interviews gave me immense confidence.',
    rating: 5,
    badge: 'Alumni Placement',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'ananya-patel',
    name: 'Ananya Patel',
    initials: 'AP',
    course: 'Data Analytics (DA)',
    courseCode: 'DA',
    role: 'Data Analyst',
    company: 'Accenture',
    packageOutcome: '6.8 LPA',
    quote:
      'The real-world business datasets and Power BI dashboards we created in class helped me stand out immediately. The placement cell scheduled 3 interviews within two weeks of course completion!',
    rating: 5,
    badge: 'Alumni Placement',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'karthik-reddy',
    name: 'Karthik Reddy',
    initials: 'KR',
    course: 'Front-End Development (FED)',
    courseCode: 'FED',
    role: 'UI/UX Frontend Engineer',
    company: 'TCS Digital',
    packageOutcome: '7.0 LPA',
    quote:
      'Modern React 18, TypeScript, Tailwind CSS, and state management were taught with extreme depth. The trainer personally reviewed my GitHub pull requests. Best career decision I made.',
    rating: 5,
    badge: 'Alumni Placement',
    gradient: 'from-indigo-500 to-violet-600',
  },
  {
    id: 'sneha-mukherjee',
    name: 'Sneha Mukherjee',
    initials: 'SM',
    course: 'Python Full Stack (PFS)',
    courseCode: 'PFS',
    role: 'Junior Cloud Developer',
    company: 'Cognizant',
    packageOutcome: '6.2 LPA',
    quote:
      'The evening batch timings were perfect alongside my final year college exams. The mentors were available round-the-clock for doubts, and the resume workshop directly got me shortlisted.',
    rating: 5,
    badge: 'Alumni Placement',
    gradient: 'from-rose-500 to-pink-600',
  },
];

export function TestimonialsCarousel({
  testimonials = defaultTestimonials,
}: {
  testimonials?: TestimonialItem[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const total = testimonials.length;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % total);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  useEffect(() => {
    if (isPaused || total <= 1) return;

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, total]);

  const current = testimonials[activeIndex];

  return (
    <section
      className="testimonials-carousel-section"
      aria-roledescription="carousel"
      aria-label="Student Success Stories and Reviews"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div className="testimonials-header">
        <div className="testimonials-header-copy">
          <span className="testimonials-eyebrow">
            <Sparkles size={13} aria-hidden="true" /> Real Outcomes, Real Stories
          </span>
          <h2>Hear From Alumni Who Launched Their Careers</h2>
          <p>
            Discover how learners transformed from curious students to hired software engineers and data analysts
            at {instituteName}.
          </p>
        </div>

        <div className="testimonials-nav-controls">
          <button
            type="button"
            className="testimonials-nav-btn testimonials-nav-prev"
            onClick={prevSlide}
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="testimonials-nav-counter" aria-live="polite">
            {activeIndex + 1} / {total}
          </span>
          <button
            type="button"
            className="testimonials-nav-btn testimonials-nav-next"
            onClick={nextSlide}
            aria-label="Next testimonial"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="testimonials-carousel-viewport">
        <div className="testimonials-card" data-testid={`testimonial-card-${current.id}`}>
          <div className="testimonials-card-quote-mark" aria-hidden="true">
            <Quote size={42} />
          </div>

          <div className="testimonials-card-top">
            <div className="testimonials-stars" aria-label={`Rating: ${current.rating} out of 5 stars`}>
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={i < current.rating ? 'star-filled' : 'star-empty'}
                  aria-hidden="true"
                />
              ))}
              <span className="testimonials-verified-badge">
                <CheckCircle2 size={12} aria-hidden="true" /> Verified Alumni
              </span>
            </div>

            <span className="testimonials-package-chip">{current.packageOutcome} Package</span>
          </div>

          <blockquote className="testimonials-quote-text">
            “{current.quote}”
          </blockquote>

          <div className="testimonials-author-row">
            <div
              className={`testimonials-avatar-gradient ${current.gradient}`}
              aria-hidden="true"
            >
              <span>{current.initials}</span>
            </div>

            <div className="testimonials-author-info">
              <strong className="testimonials-author-name">{current.name}</strong>
              <div className="testimonials-author-role">
                <Briefcase size={12} className="author-role-icon" aria-hidden="true" />
                <span>
                  {current.role} at <strong>{current.company}</strong>
                </span>
              </div>
              <div className="testimonials-author-course">
                <GraduationCap size={12} className="author-course-icon" aria-hidden="true" />
                <span>Track: {current.course}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="testimonials-dots" role="tablist" aria-label="Testimonial slides">
        {testimonials.map((item, idx) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={idx === activeIndex}
            aria-label={`Go to testimonial by ${item.name}`}
            className={`testimonials-dot ${idx === activeIndex ? 'active' : ''}`}
            onClick={() => setActiveIndex(idx)}
          />
        ))}
      </div>
    </section>
  );
}
