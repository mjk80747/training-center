import { useEffect, useState } from 'react';
import axios from 'axios';
import { listBatches } from '../../api/batches';
import { listCourses } from '../../api/courses';
import { formatPrice } from '../../lib/format';
import { normalizeList } from '../../lib/normalizeList';

type AdminCourse = {
  id: number;
  code: string;
  name: string;
  duration_months: number;
  fee: number | string;
  status: string;
};

type CourseBatch = {
  course: number;
};

function getCourseLoadError(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return 'Something went wrong while loading the course catalogue. Please try again.';
  }
  if (!error.response) {
    return 'Unable to reach the course service. Check that the backend is running, then retry.';
  }
  return `The course catalogue could not be loaded (HTTP ${error.response.status}).`;
}

export function AdminCoursesPage() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [batches, setBatches] = useState<CourseBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    Promise.all([
      listCourses({ signal: controller.signal }),
      listBatches(),
    ])
      .then(([courseResponse, batchResponse]) => {
        setCourses(normalizeList<AdminCourse>(courseResponse.data));
        setBatches(normalizeList<CourseBatch>(batchResponse.data));
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        setCourses([]);
        setBatches([]);
        setError(getCourseLoadError(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [retryCount]);

  return (
    <section className="admin-courses-page">
      <header className="admin-courses-heading">
        <p className="admin-courses-eyebrow">Academics</p>
        <h1>Courses</h1>
        <p>Read-only course catalogue.</p>
      </header>

      <div className="admin-courses-notice">
        <span aria-hidden="true">i</span>
        <p>Course information is managed by your institute administrator.</p>
      </div>

      {error ? (
        <div className="admin-courses-message is-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setRetryCount((count) => count + 1)}>Try again</button>
        </div>
      ) : (
        <div className="admin-courses-table-wrap">
          <table className="admin-courses-table">
            <thead>
              <tr>
                <th scope="col">Course</th>
                <th scope="col">Duration</th>
                <th scope="col">Fee</th>
                <th scope="col">Batches</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="admin-courses-empty" colSpan={5} role="status">Loading courses...</td></tr>
              ) : courses.length ? (
                courses.map((course) => {
                  const batchCount = batches.filter((batch) => batch.course === course.id).length;
                  const active = course.status.toUpperCase() === 'ACTIVE';
                  return (
                    <tr key={course.id}>
                      <td>
                        <div className="admin-course-identity">
                          <span className="admin-course-code">{course.code}</span>
                          <strong>{course.name}</strong>
                        </div>
                      </td>
                      <td>{course.duration_months} {course.duration_months === 1 ? 'month' : 'months'}</td>
                      <td>{formatPrice(course.fee)}</td>
                      <td>{batchCount}</td>
                      <td>
                        <span className={`admin-course-status ${active ? 'is-active' : 'is-inactive'}`}>
                          <i />
                          {active ? 'Active' : course.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td className="admin-courses-empty" colSpan={5}>No courses are available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
