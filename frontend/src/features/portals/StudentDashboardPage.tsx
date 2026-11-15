import { useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, CreditCard, ExternalLink, RotateCcw } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { listAttendance } from '../../api/attendance';
import { listBatches, listSessions } from '../../api/batches';
import { listInstalments, listEnrolments } from '../../api/fees';
import { listAssignments, listSubmissions } from '../../api/learning';
import { apiErrorMessage } from '../auth/apiErrorMessage';
import { normalizeList } from '../../lib/normalizeList';
import { formatPrice } from '../../lib/format';
import { routes } from '../../routes/paths';
import { getAuthSession } from '../../store/auth';

type StudentBatch = {
  id: number;
  batch_code: string;
  name: string;
  course: number;
  course_name: string;
  start_date: string;
  end_date: string;
  class_days: string;
  start_time: string;
  end_time: string;
  mode: string;
  meeting_link: string;
  status: string;
};

type StudentEnrolment = {
  id: number;
  batch: number;
  course: number;
  status: string;
};

type StudentSession = {
  id: number;
  batch: number;
  date: string;
  start_time: string;
  end_time: string;
  topic: string;
  meeting_link: string;
  status: string;
};

type StudentAttendance = {
  id: number;
  session: number;
  status: string;
};

type StudentAssignment = {
  id: number;
  batch: number;
  title: string;
  due_date: string;
};

type StudentSubmission = {
  assignment: number;
};

type StudentInstalment = {
  id: number;
  enrolment: number;
  due_date: string;
  amount: number | string;
  status: string;
};

type DashboardData = {
  batches: StudentBatch[];
  enrolments: StudentEnrolment[];
  sessions: StudentSession[];
  attendance: StudentAttendance[];
  assignments: StudentAssignment[];
  submissions: StudentSubmission[];
  instalments: StudentInstalment[];
};

const emptyData: DashboardData = {
  batches: [],
  enrolments: [],
  sessions: [],
  attendance: [],
  assignments: [],
  submissions: [],
  instalments: [],
};

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
  return new Date(1970, 0, 1, hours, minutes).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function attendanceTone(status: string) {
  if (status === 'PRESENT') return 'present';
  if (status === 'LATE') return 'late';
  if (status === 'EXCUSED') return 'excused';
  return 'absent';
}

export function StudentDashboardPage() {
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([
      listBatches(),
      listEnrolments(),
      listSessions(),
      listAttendance(),
      listAssignments(),
      listSubmissions(),
      listInstalments(),
    ])
      .then(([batchResponse, enrolmentResponse, sessionResponse, attendanceResponse, assignmentResponse, submissionResponse, instalmentResponse]) => {
        if (!active) return;
        setData({
          batches: normalizeList<StudentBatch>(batchResponse.data),
          enrolments: normalizeList<StudentEnrolment>(enrolmentResponse.data),
          sessions: normalizeList<StudentSession>(sessionResponse.data),
          attendance: normalizeList<StudentAttendance>(attendanceResponse.data),
          assignments: normalizeList<StudentAssignment>(assignmentResponse.data),
          submissions: normalizeList<StudentSubmission>(submissionResponse.data),
          instalments: normalizeList<StudentInstalment>(instalmentResponse.data),
        });
      })
      .catch((loadError: unknown) => {
        if (active) setError(apiErrorMessage(loadError, 'Could not load your student dashboard.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [retryKey]);

  const dashboard = useMemo(() => {
    const activeEnrolments = data.enrolments.filter((enrolment) => enrolment.status === 'ACTIVE');
    const enrolledBatchIds = new Set(activeEnrolments.map((enrolment) => enrolment.batch));
    const enrolledBatches = data.batches.filter((batch) => enrolledBatchIds.has(batch.id));
    const currentBatch = enrolledBatches.find((batch) => batch.status === 'ACTIVE') ?? enrolledBatches[0];
    const sessions = data.sessions
      .filter((session) => enrolledBatchIds.has(session.batch) && session.status !== 'CANCELLED')
      .sort((left, right) => `${left.date}T${left.start_time}`.localeCompare(`${right.date}T${right.start_time}`));
    const today = localDateKey(new Date());
    const upcoming = sessions.filter((session) => session.date >= today);
    const nextSession = upcoming[0];
    const attendanceRecords = data.attendance
      .map((record) => ({ ...record, sessionData: data.sessions.find((session) => session.id === record.session) }))
      .filter((record) => record.sessionData && record.sessionData.status !== 'CANCELLED' && enrolledBatchIds.has(record.sessionData.batch))
      .sort((left, right) => `${right.sessionData?.date}T${right.sessionData?.start_time}`.localeCompare(`${left.sessionData?.date}T${left.sessionData?.start_time}`))
      .slice(0, 25);
    const recentAttendance = attendanceRecords.slice(0, 5);
    const countableAttendance = attendanceRecords.filter((record) => record.status !== 'EXCUSED');
    const attendedClasses = countableAttendance.filter((record) => record.status === 'PRESENT' || record.status === 'LATE').length;
    const attendanceRate = countableAttendance.length
      ? Math.round((attendedClasses / countableAttendance.length) * 100)
      : null;
    const assignmentBatchIds = new Set(enrolledBatches.map((batch) => batch.id));
    const submittedIds = new Set(data.submissions.map((submission) => submission.assignment));
    const pendingAssignments = data.assignments.filter((assignment) =>
      assignmentBatchIds.has(assignment.batch) && !submittedIds.has(assignment.id),
    );
    const relevantEnrolmentIds = new Set(activeEnrolments.map((enrolment) => enrolment.id));
    const unpaidInstalments = data.instalments
      .filter((instalment) => relevantEnrolmentIds.has(instalment.enrolment) && instalment.status !== 'PAID')
      .sort((left, right) => left.due_date.localeCompare(right.due_date));
    const nextFee = unpaidInstalments[0];

    return { currentBatch, enrolledBatches, sessions, upcoming, nextSession, attendanceRecords, recentAttendance, attendedClasses, attendanceRate, pendingAssignments, nextFee };
  }, [data]);

  const name = getAuthSession()?.full_name?.trim().split(/\s+/)[0] || 'there';
  const classPlan = [
    { name: 'Revision', minutes: 15, tone: 'violet', detail: 'Previous class revision & doubts' },
    { name: 'Concept', minutes: 45, tone: 'blue', detail: 'Core concept instruction' },
    { name: 'Break', minutes: 10, tone: 'slate', detail: 'Mental refresh break' },
    { name: 'Practical', minutes: 40, tone: 'green', detail: 'Live hands-on coding lab' },
    { name: 'Q&A', minutes: 10, tone: 'amber', detail: 'Questions & assignment' },
  ];
  const attendanceCells = [
    ...dashboard.attendanceRecords.map((record) => ({ id: record.id, status: attendanceTone(record.status) })),
    ...Array.from({ length: Math.max(0, 25 - dashboard.attendanceRecords.length) }, (_, index) => ({
      id: `unrecorded-${index}`,
      status: 'unrecorded',
    })),
  ];

  return (
    <div className="student-portal-view">
      <header className="student-portal-intro">
        <div>
          <p className="student-eyebrow">STUDENT PORTAL</p>
          <h1>
            Hi {name}
            <span aria-hidden="true">👋</span>
          </h1>
          <p>Your course, classes and progress at a glance.</p>
        </div>
      </header>

      {error ? (
        <div className="student-dashboard-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setRetryKey((key) => key + 1)}><RotateCcw size={15} /> Try again</button>
        </div>
      ) : null}

      {loading ? (
        <div className="student-dashboard-loading" role="status">Loading your learning dashboard…</div>
      ) : (
        <>
          <section className="student-course-feature">
            <div className="student-course-identity-block">
              {dashboard.currentBatch ? <div className="student-course-subtag">{dashboard.currentBatch.batch_code}</div> : null}
              <div className="student-course-header-row">
                <h2>{dashboard.currentBatch?.course_name || (dashboard.enrolledBatches.length ? 'Your enrolled course' : 'Your learning starts here')}</h2>
                {dashboard.nextSession?.meeting_link ? (
                  <a className="student-join-button" href={dashboard.nextSession.meeting_link} target="_blank" rel="noreferrer">
                    <span className="student-join-icon"><ExternalLink size={15} /></span>
                    Join {dashboard.nextSession.date === localDateKey(new Date()) ? 'today’s' : 'next'} class
                  </a>
                ) : null}
              </div>
              {dashboard.currentBatch ? (
                <p>
                  {dashboard.currentBatch.class_days} · {formatTime(dashboard.currentBatch.start_time)} – {formatTime(dashboard.currentBatch.end_time)} IST · {dashboard.currentBatch.mode}
                </p>
              ) : <p>Your course and class schedule will appear here after enrolment.</p>}
              <div className="student-progress-block">
                <div className="student-progress-label-row">
                  <span>Attendance rate</span>
                  <strong>{dashboard.attendanceRate === null ? '—' : `${dashboard.attendanceRate}%`}</strong>
                </div>
                <div className="student-progress-track" aria-label="Attendance rate">
                  <span style={{ width: `${dashboard.attendanceRate ?? 0}%` }} />
                </div>
              </div>
            </div>
          </section>

          <section className="student-stat-grid" aria-label="Learning overview">
            <a href="#student-attendance" className="student-stat-card student-stat-card-link" aria-label="View your attendance data">
              <div className="student-stat-header">
                <span>Attendance</span>
                <div className="student-stat-icon icon-green"><CheckCircle2 size={18} /></div>
              </div>
              <div className="student-stat-copy">
                <strong>{dashboard.attendanceRate === null ? '—' : `${dashboard.attendanceRate}%`}</strong>
                <span>{dashboard.attendanceRate === null ? 'No classes recorded' : `${dashboard.attendedClasses} of ${dashboard.attendanceRecords.length} classes`}</span>
              </div>
            </a>

            <NavLink to={routes.student.courses} className="student-stat-card student-stat-card-link" aria-label="View assignment list">
              <div className="student-stat-header">
                <span>Pending assignments</span>
                <div className="student-stat-icon icon-amber"><BookOpen size={18} /></div>
              </div>
              <div className="student-stat-copy">
                <strong>{dashboard.pendingAssignments.length}</strong>
                <span>{dashboard.pendingAssignments.length === 1 ? 'assignment to submit' : 'assignments to submit'}</span>
              </div>
            </NavLink>

            <NavLink to={routes.student.fees} className="student-stat-card student-stat-card-link" aria-label="View fee details">
              <div className="student-stat-header">
                <span>Next fee due</span>
                <div className="student-stat-icon icon-gold"><CreditCard size={18} /></div>
              </div>
              <div className="student-stat-copy">
                <strong>{dashboard.nextFee ? formatPrice(Number(dashboard.nextFee.amount)) : '—'}</strong>
                <span>{dashboard.nextFee ? `Due ${formatDate(dashboard.nextFee.due_date)}` : 'No fee due'}</span>
              </div>
            </NavLink>
          </section>

          <section className="student-lower-grid">
            <article className="student-panel-card student-plans-panel">
              <div className="student-card-title-row">
                <h3>Your 2-hour class plan</h3>
              </div>
              <div className="student-class-plan-wrapper" aria-label="Class plan">
                {classPlan.map((item) => (
                  <div key={item.name} className={`student-class-plan-segment segment-${item.tone}`} style={{ flexBasis: `${item.minutes / 120 * 100}%` }}>
                    <span>{item.minutes}m</span>
                  </div>
                ))}
              </div>
              <div className="student-plan-breakdown">
                {classPlan.map((item) => (
                  <div key={`${item.name}-meta`} className="student-plan-breakdown-item">
                    <div className={`dot dot-${item.tone}`} />
                    <div className="student-plan-meta-copy">
                      <strong>{item.name} <span>{item.minutes}m</span></strong>
                      <small>{item.detail}</small>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="student-panel-card student-attendance-panel" id="student-attendance">
              <div className="student-card-title-row">
                <h3>Last 25 classes</h3>
                <div className="student-mini-legend">
                  <span><i className="legend-present" />Present</span>
                  <span><i className="legend-late" />Late</span>
                  <span><i className="legend-absent" />Absent</span>
                </div>
              </div>
              <div className="student-attendance-grid" aria-label="Last 25 classes attendance">
                {attendanceCells.map(({ id, status }, index) => (
                  <span key={id} className={`student-attendance-cell ${status}`} aria-label={status === 'unrecorded' ? 'Not recorded' : status} title={status === 'unrecorded' ? 'Not recorded' : status} data-class-number={index + 1} />
                ))}
              </div>
            </article>
          </section>
        </>
      )}
    </div>
  );
}
