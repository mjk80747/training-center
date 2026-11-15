import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { listCourses } from '../../api/courses';
import { normalizeList } from '../../lib/normalizeList';
import type { CourseItem } from './types';

const publicCourseOrder = new Map([
  'PYCORE',
  'JCORE',
  'FED',
  'PFS',
  'JFS',
  'DA',
].map((code, index) => [code, index]));

function getCourseLoadError(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return 'Something went wrong while loading courses. Please try again.';
  }

  if (!error.response) {
    return 'Unable to reach the course service. Check that the backend is running, then retry.';
  }

  const detail = error.response.data?.detail;
  return `Courses could not be loaded (HTTP ${error.response.status}).${typeof detail === 'string' ? ` ${detail}` : ''}`;
}

export function usePublicCourses() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    listCourses({ signal: controller.signal })
      .then((response) => {
        const courses = normalizeList<CourseItem>(response.data);
        courses.sort((a, b) => (
          (publicCourseOrder.get(a.code) ?? publicCourseOrder.size)
          - (publicCourseOrder.get(b.code) ?? publicCourseOrder.size)
          || a.code.localeCompare(b.code)
        ));
        setCourses(courses);
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        setCourses([]);
        setError(getCourseLoadError(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [retryCount]);

  const retry = useCallback(() => setRetryCount((count) => count + 1), []);

  return { courses, loading, error, retry };
}
