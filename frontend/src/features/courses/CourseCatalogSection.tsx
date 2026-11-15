import { AlertCircle, ArrowRight, BookOpen, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { routes } from '../../routes/paths';
import { CourseCard } from './CourseCard';
import type { CourseItem } from './types';

type CourseCatalogSectionProps = {
  courses: CourseItem[];
  loading: boolean;
  error: string;
  onRetry: () => void;
}

export function CourseCatalogSection({ courses, loading, error, onRetry }: CourseCatalogSectionProps) {
  return (
    <section className="public-section !px-0" aria-labelledby="trending-courses-title">
      <div className="public-section-heading">
        <div>
          <p className="page-eyebrow">Find your next skill</p>
          <h2 id="trending-courses-title">Trending courses</h2>
          <p>Explore our hands-on programs and open each syllabus to see what you’ll learn.</p>
        </div>
        <Link to={routes.courses} className="panel-link">View all courses <ArrowRight size={14} /></Link>
      </div>
      <div className="syllabus-course-grid" aria-busy={loading}>
        {loading ? (
          <>
            <p className="sr-only" role="status">Loading trending courses</p>
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="syllabus-course-skeleton" aria-hidden="true" />
            ))}
          </>
        ) : error ? (
          <div className="course-catalog-state course-catalog-error" role="alert">
            <span className="course-catalog-state-icon"><AlertCircle size={20} /></span>
            <div className="course-catalog-state-copy">
              <h3>We couldn’t load courses</h3>
              <p>{error}</p>
            </div>
            <button
              type="button"
              className="course-catalog-retry"
              onClick={onRetry}
            >
              <RefreshCw size={15} /> Retry
            </button>
          </div>
        ) : courses.length ? (
          courses.map((course) => <CourseCard key={course.id} course={course} />)
        ) : (
          <div className="course-catalog-state course-catalog-empty" role="status">
            <span className="course-catalog-state-icon"><BookOpen size={20} /></span>
            <div className="course-catalog-state-copy">
              <h3>Courses are coming soon</h3>
              <p>Our course catalog is being prepared. Contact admissions to learn more.</p>
            </div>
            <Link to={routes.contact} className="course-catalog-retry">
              Contact admissions <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
