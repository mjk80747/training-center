import { useEffect, useMemo, useState } from 'react';
import { Award, LockKeyhole, RotateCcw } from 'lucide-react';
import { listBatches } from '../../api/batches';
import { listCertificates } from '../../api/certificates';
import { listEnrolments } from '../../api/fees';
import { normalizeList } from '../../lib/normalizeList';
import { apiErrorMessage } from '../auth/apiErrorMessage';

type StudentCertificate = {
  id: number;
  course: number;
  course_name: string;
  certificate_id: string;
  issued_date: string;
  pdf_file: string | null;
};

type StudentEnrolment = {
  id: number;
  course: number;
  status: string;
};

type StudentBatch = {
  course: number;
  course_name: string;
};

type CertificateData = {
  certificates: StudentCertificate[];
  enrolments: StudentEnrolment[];
  batches: StudentBatch[];
};

const emptyData: CertificateData = { certificates: [], enrolments: [], batches: [] };

function formatDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
}

export function StudentCertificatesPage() {
  const [data, setData] = useState<CertificateData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([listCertificates(), listEnrolments(), listBatches()])
      .then(([certificateResponse, enrolmentResponse, batchResponse]) => {
        if (!active) return;
        setData({
          certificates: normalizeList<StudentCertificate>(certificateResponse.data),
          enrolments: normalizeList<StudentEnrolment>(enrolmentResponse.data),
          batches: normalizeList<StudentBatch>(batchResponse.data),
        });
      })
      .catch((loadError: unknown) => {
        if (active) setError(apiErrorMessage(loadError, 'Could not load your certificates.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [retryKey]);

  const certificateView = useMemo(() => {
    const courseNames = new Map<number, string>();
    data.batches.forEach((batch) => {
      if (batch.course_name) courseNames.set(batch.course, batch.course_name);
    });

    const certificateCourseIds = new Set(data.certificates.map((certificate) => certificate.course));
    const eligibleEnrolments = data.enrolments.filter((enrolment) => (
      enrolment.status !== 'DROPPED' && enrolment.status !== 'TRANSFERRED'
    ));
    const enrolledCourses = [...new Set(eligibleEnrolments.map((enrolment) => enrolment.course))]
      .filter((courseId) => !certificateCourseIds.has(courseId))
      .map((courseId) => ({
        id: courseId,
        name: courseNames.get(courseId) || 'Course completion certificate',
      }));

    return { courseNames, enrolledCourses };
  }, [data]);

  return (
    <section className="student-certificates-page">
      <header className="student-certificates-heading">
        <p className="screen-eyebrow">STUDENT PORTAL</p>
        <h1>Certificates</h1>
        <p>Download certificates you&apos;ve earned.</p>
      </header>

      {error ? (
        <div className="student-certificates-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setRetryKey((key) => key + 1)}><RotateCcw size={15} /> Try again</button>
        </div>
      ) : null}

      {loading ? (
        <p className="student-certificates-empty" role="status">Loading your certificates…</p>
      ) : error ? null : (
        <div className="student-certificates-grid">
          {data.certificates.map((certificate) => (
            <article className="student-certificate-card" key={certificate.id}>
              <span className="student-certificate-icon earned"><Award size={22} /></span>
              <div className="student-certificate-copy">
                <h2>{certificate.course_name || certificateView.courseNames.get(certificate.course) || 'Course certificate'}</h2>
                <p>Issued {formatDate(certificate.issued_date)} · {certificate.certificate_id}</p>
                {certificate.pdf_file ? (
                  <a className="student-certificate-view" href={certificate.pdf_file} target="_blank" rel="noreferrer">
                    View certificate
                  </a>
                ) : null}
              </div>
            </article>
          ))}

          {certificateView.enrolledCourses.map((course) => (
            <article className="student-certificate-card" key={`locked-${course.id}`}>
              <span className="student-certificate-icon locked"><LockKeyhole size={21} /></span>
              <div className="student-certificate-copy">
                <h2>{course.name} — Completion</h2>
                <p>Available after the institute issues your course completion certificate.</p>
              </div>
            </article>
          ))}

          {!data.certificates.length && !certificateView.enrolledCourses.length ? (
            <p className="student-certificates-empty">No certificates or enrolled course certificates are available yet.</p>
          ) : null}
        </div>
      )}
    </section>
  );
}
