import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  BookOpen,
  Braces,
  Clock,
  Code2,
  GraduationCap,
  Laptop,
  Layers3,
  PanelsTopLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../lib/format';
import { routes } from '../../routes/paths';
import type { CourseItem } from './types';

const courseArt = {
  PFS: {
    icon: Code2,
    kicker: 'BUILD FOR THE WEB',
    accent: 'python',
    level: 'Beginner to Advanced',
    defaultTech: ['Python', 'Django', 'React', 'REST APIs', 'PostgreSQL'],
  },
  JFS: {
    icon: Braces,
    kicker: 'ENGINEER AT SCALE',
    accent: 'java',
    level: 'Intermediate to Advanced',
    defaultTech: ['Core Java', 'Spring Boot', 'Hibernate', 'Microservices', 'SQL'],
  },
  PYCORE: {
    icon: Code2,
    kicker: 'MASTER THE FUNDAMENTALS',
    accent: 'python',
    level: 'Beginner Friendly',
    defaultTech: ['Python', 'OOP', 'Data Structures', 'Problem Solving'],
  },
  JCORE: {
    icon: Braces,
    kicker: 'MASTER THE FUNDAMENTALS',
    accent: 'java',
    level: 'Beginner Friendly',
    defaultTech: ['Java', 'OOP', 'Collections', 'Problem Solving'],
  },
  DA: {
    icon: BarChart3,
    kicker: 'FIND THE SIGNAL',
    accent: 'analytics',
    level: 'Beginner Friendly',
    defaultTech: ['Python', 'SQL', 'Power BI', 'Excel', 'Pandas'],
  },
  FED: {
    icon: PanelsTopLeft,
    kicker: 'DESIGN THE EXPERIENCE',
    accent: 'frontend',
    level: 'Beginner to Pro',
    defaultTech: ['HTML5/CSS3', 'JavaScript', 'React 18', 'Tailwind', 'Git'],
  },
} as const;

function getCourseArt(code: string) {
  return (
    courseArt[code as keyof typeof courseArt] ?? {
      icon: Layers3,
      kicker: 'CAREER-READY SKILLS',
      accent: 'default',
      level: 'All Levels',
      defaultTech: ['Software Engineering', 'System Design', 'Git'],
    }
  );
}

function formatLearningMode(mode: string) {
  if (!mode) return 'Hybrid';
  return mode.toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase());
}

export function CourseCard({ course }: { course: CourseItem }) {
  const [syllabusOpen, setSyllabusOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const supportsScrollReveal = typeof IntersectionObserver !== 'undefined';
  const courseMeta = getCourseArt(course.code);
  const CourseIcon = courseMeta.icon;
  const level = course.level || courseMeta.level;

  // Extract key tech tags from skills_covered or fallback to defaults
  const techTags = course.key_tech?.length
    ? course.key_tech
    : course.skills_covered
    ? course.skills_covered
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 5)
    : courseMeta.defaultTech;

  const moduleCount = course.modules?.length ?? course.total_modules ?? 0;
  const contactPath = `${routes.contact}?course=${encodeURIComponent(course.name)}`;

  return (
    <motion.article
      className="syllabus-course-card"
      id={`course-${course.id}`}
      data-testid={`course-card-${course.code}`}
      initial={reduceMotion || !supportsScrollReveal ? false : { opacity: 0, y: 16 }}
      animate={supportsScrollReveal ? undefined : { opacity: 1, y: 0 }}
      whileInView={supportsScrollReveal ? { opacity: 1, y: 0 } : undefined}
      viewport={supportsScrollReveal ? { once: true, amount: 0.12 } : undefined}
      transition={{ duration: reduceMotion ? 0.01 : 0.36, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={`syllabus-course-art syllabus-art-${courseMeta.accent}`}>
        {course.image ? (
          <img
            src={course.image}
            alt={`${course.name} preview`}
            className="syllabus-course-image"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        ) : null}

        <div className="syllabus-art-top">
          <span className="syllabus-course-code">{course.code}</span>
          <span className="syllabus-course-mode" data-testid="course-batch-mode">
            <Laptop size={12} className="inline-block mr-1" aria-hidden="true" />
            {formatLearningMode(course.learning_mode)}
          </span>
        </div>

        <div className="syllabus-art-center" aria-hidden="true">
          <span className="syllabus-art-orbit" />
          <CourseIcon size={46} strokeWidth={1.4} />
        </div>

        <div className="syllabus-art-bottom">
          <span className="syllabus-art-badge" data-testid="course-duration">
            <Clock size={13} aria-hidden="true" /> {course.duration_months} Months
          </span>
          <span className="syllabus-art-badge" data-testid="course-level">
            <GraduationCap size={13} aria-hidden="true" /> {level}
          </span>
        </div>

        <span className="syllabus-art-kicker">{courseMeta.kicker}</span>
      </div>

      <div className="syllabus-course-body">
        <div className="syllabus-course-heading">
          <div>
            <p className="syllabus-course-eyebrow">Professional Track · {level}</p>
            <h3>{course.name}</h3>
          </div>
          <span className="syllabus-module-count" title={`${moduleCount} Curriculum Modules`}>
            {moduleCount} <small>modules</small>
          </span>
        </div>

        <p className="syllabus-course-description">
          {course.description || 'Build practical skills through structured lessons, hands-on labs, and guided projects.'}
        </p>

        {/* Key Tech Tags */}
        <div className="syllabus-skills" aria-label="Key technologies covered">
          {techTags.map((tech) => (
            <span key={tech} className="syllabus-tech-tag" data-testid="tech-tag">
              {tech}
            </span>
          ))}
        </div>

        {/* View Syllabus Toggle Button */}
        <button
          type="button"
          className="syllabus-toggle"
          aria-expanded={syllabusOpen}
          aria-controls={`syllabus-${course.id}`}
          onClick={() => setSyllabusOpen((open) => !open)}
          data-testid="view-syllabus-btn"
        >
          <span>
            <BookOpen size={15} aria-hidden="true" />
            {syllabusOpen ? 'Hide syllabus' : 'View syllabus'}
          </span>
          <ArrowDown size={15} className={syllabusOpen ? 'syllabus-chevron-open' : ''} aria-hidden="true" />
        </button>

        {/* Expandable Module Syllabus List */}
        <AnimatePresence initial={false}>
          {syllabusOpen ? (
            <motion.div
              className="syllabus-module-list-motion"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.24, ease: 'easeOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div
                className="syllabus-module-list"
                id={`syllabus-${course.id}`}
                data-testid="syllabus-module-list"
              >
                {course.modules && course.modules.length ? (
                  course.modules.map((module, index) => (
                    <div className="syllabus-module" key={module.id || index}>
                      <span className="syllabus-module-number">{String(index + 1).padStart(2, '0')}</span>
                      <div>
                        <strong>{module.title}</strong>
                        {module.description ? <p>{module.description}</p> : null}
                      </div>
                      {module.duration_hours ? <small>{module.duration_hours}h</small> : null}
                    </div>
                  ))
                ) : (
                  <p className="syllabus-empty">The detailed syllabus for this course is being prepared.</p>
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Footer with Fee and Enquire CTA */}
        <div className="syllabus-course-footer">
          <div>
            <span className="syllabus-fee-label">Program Fee</span>
            <strong>{formatPrice(course.fee)}</strong>
          </div>
          <Link to={contactPath} className="syllabus-enquire" aria-label={`Enquire about ${course.name}`}>
            <span>Enquire</span>
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
