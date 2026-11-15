import { useEffect, useMemo, useState } from 'react';
import { BookOpen, CalendarCheck, CalendarClock, ClipboardList, Layers3, Laptop, Play, RotateCcw, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { listAttendance } from '../../api/attendance';
import { listBatches, listSessions } from '../../api/batches';
import { listAssignments } from '../../api/learning';
import { listStudents } from '../../api/students';
import { apiErrorMessage } from '../auth/apiErrorMessage';
import { normalizeList } from '../../lib/normalizeList';
import { routes } from '../../routes/paths';
import { getAuthSession } from '../../store/auth';

type TrainerBatch = {
  id: number;
  batch_code: string;
  name: string;
  start_date: string;
  status: string;
  course_name: string;
  class_days: string;
  start_time: string;
  end_time: string;
  mode?: string;
  enrolled_students?: number;
};

type TrainerSession = {
  id: number;
  batch: number;
  date: string;
  start_time: string;
  end_time: string;
  topic: string;
  status: string;
};

type TrainerAssignment = {
  id: number;
  batch: number;
  title: string;
  due_date: string;
};

type TrainerStudent = {
  id: number;
};

type TrainerAttendance = {
  id: number;
  status: string;
};

const classParts = [
  { name: 'Revision', length: 15, detail: 'Previous class review', tone: 'revision' },
  { name: 'Concept', length: 45, detail: 'Core concept instruction', tone: 'concept' },
  { name: 'Break', length: 10, detail: 'Short refresh break', tone: 'break' },
  { name: 'Practical', length: 40, detail: 'Hands-on coding lab', tone: 'practical' },
  { name: 'Q&A', length: 10, detail: 'Questions and assignment', tone: 'qa' },
];

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
  return new Date(1970, 0, 1, hours, minutes).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
}

function classPartAt(elapsedSeconds: number) {
  const elapsedMinutes = elapsedSeconds / 60;
  let end = 0;
  return classParts.find((part) => {
    end += part.length;
    return elapsedMinutes < end;
  })?.name ?? 'Q&A';
}

export function TrainerDashboardPage() {
  const [batches, setBatches] = useState<TrainerBatch[]>([]);
  const [sessions, setSessions] = useState<TrainerSession[]>([]);
  const [assignments, setAssignments] = useState<TrainerAssignment[]>([]);
  const [students, setStudents] = useState<TrainerStudent[]>([]);
  const [attendance, setAttendance] = useState<TrainerAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [classRunning, setClassRunning] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([listBatches(), listSessions(), listAssignments(), listStudents(), listAttendance()])
      .then(([batchResponse, sessionResponse, assignmentResponse, studentResponse, attendanceResponse]) => {
        if (!active) return;
        setBatches(normalizeList<TrainerBatch>(batchResponse.data));
        setSessions(normalizeList<TrainerSession>(sessionResponse.data));
        setAssignments(normalizeList<TrainerAssignment>(assignmentResponse.data));
        setStudents(normalizeList<TrainerStudent>(studentResponse.data));
        setAttendance(normalizeList<TrainerAttendance>(attendanceResponse.data));
      })
      .catch((loadError: unknown) => {
        if (active) setError(apiErrorMessage(loadError, 'Could not load your trainer dashboard. Please try again.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [reloadKey]);

  useEffect(() => {
    if (!classRunning) return undefined;
    const timer = window.setInterval(() => setElapsedSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [classRunning]);

  const activeBatches = batches.filter((batch) => ['ACTIVE', 'OPEN', 'UPCOMING'].includes(batch.status.toUpperCase()));
  const today = localDateKey(new Date());
  const openAssignments = assignments.filter((assignment) => assignment.due_date >= today);
  const nextSession = useMemo(() => sessions
    .filter((session) => session.status.toUpperCase() === 'SCHEDULED' && session.date >= today)
    .sort((left, right) => left.date.localeCompare(right.date) || left.start_time.localeCompare(right.start_time))[0], [sessions, today]);
  const currentBatch = nextSession ? batches.find((batch) => batch.id === nextSession.batch) : activeBatches[0];
  const presentCount = attendance.filter((record) => record.status.toUpperCase() === 'PRESENT').length;
  const currentPart = classPartAt(elapsedSeconds);
  const trainerName = getAuthSession()?.full_name || 'Trainer';
  const timerText = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:${String(elapsedSeconds % 60).padStart(2, '0')}`;

  return (
    <div className="trainer-dashboard">
      <header className="trainer-dashboard-heading">
        <p className="trainer-eyebrow">TRAINER WORKSPACE</p>
        <h1>Welcome, {trainerName}</h1>
        <p>Your assigned batches, upcoming class plan, and pending work.</p>
      </header>

      {error ? (
        <div className="trainer-dashboard-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setReloadKey((key) => key + 1)}>Try again</button>
        </div>
      ) : null}

      <div className="trainer-stat-grid" aria-busy={loading}>
        {[
          { label: 'Assigned batches', value: activeBatches.length, icon: Layers3, tone: 'violet' },
          { label: 'My students', value: students.length, icon: Users, tone: 'cyan' },
          { label: 'Open assignments', value: openAssignments.length, icon: ClipboardList, tone: 'amber' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <article className="trainer-stat-card" key={label}>
            <div className="trainer-stat-label">{label}<span className={`trainer-stat-icon ${tone}`}><Icon size={18} /></span></div>
            <strong>{loading ? '—' : value}</strong>
          </article>
        ))}
      </div>

      <div className="trainer-dashboard-grid">
        <section className="trainer-class-panel">
          <div className="trainer-class-heading">
            <div>
              <h2>{currentBatch ? `${nextSession?.date === today ? "Today's class" : 'Next class'} · ${currentBatch.batch_code}` : 'Your class plan'}</h2>
              <p>
                {currentBatch
                  ? `${formatTime(nextSession?.start_time ?? currentBatch.start_time)} – ${formatTime(nextSession?.end_time ?? currentBatch.end_time)} · ${currentBatch.mode || 'Class mode not set'}${nextSession?.date && nextSession.date !== today ? ` · ${formatDate(nextSession.date)}` : ''}`
                  : 'Your next scheduled class will appear here.'}
              </p>
            </div>
            <NavLink to={routes.trainer.attendance} className="trainer-mark-attendance"><CalendarCheck size={16} />Mark attendance</NavLink>
          </div>

          <div className="trainer-class-plan" aria-label="Two-hour class plan">
            {classParts.map((part) => (
              <div key={part.name} className={`trainer-class-segment ${part.tone}`} style={{ flexGrow: part.length }}>
                <span>{part.length}m</span>
              </div>
            ))}
          </div>
          <div className="trainer-class-parts">
            {classParts.map((part) => (
              <div key={part.name}>
                <strong><i className={part.tone} />{part.name} <span>{part.length}m</span></strong>
                <small>{part.detail}</small>
              </div>
            ))}
          </div>
          <div className="trainer-class-timer">
            <p><strong>{timerText}</strong><span> / 02:00</span><i />{currentPart}</p>
            <div>
              <button type="button" onClick={() => setClassRunning((running) => !running)}><Play size={14} />{classRunning ? 'Pause class' : 'Start class'}</button>
              <button type="button" className="trainer-timer-reset" aria-label="Reset class timer" onClick={() => { setClassRunning(false); setElapsedSeconds(0); }}><RotateCcw size={15} /></button>
            </div>
          </div>
          {nextSession?.topic ? <p className="trainer-class-topic"><CalendarClock size={14} />{nextSession.topic}</p> : null}
          {!currentBatch && !loading ? <p className="trainer-dashboard-empty">No assigned batches or upcoming sessions were found.</p> : null}
        </section>

        <section className="trainer-assigned-batches" aria-label="Assigned batches">
          {activeBatches.length ? activeBatches.map((batch) => (
            <article className="trainer-batch-card" key={batch.id}>
              <div className="trainer-batch-heading">
                <div><strong>{batch.batch_code}</strong><h2>{batch.course_name || batch.name}</h2></div>
                <span className={`trainer-batch-status ${batch.status.toLowerCase()}`}><i />{batch.status === 'ACTIVE' ? 'Running' : 'Upcoming'}</span>
              </div>
              <div className="trainer-batch-details">
                <span><CalendarClock size={14} />{batch.class_days} · {formatTime(batch.start_time)} – {formatTime(batch.end_time)}</span>
                <span><Laptop size={14} />{batch.mode || 'Mode not set'}</span>
                <span><Users size={14} />{batch.enrolled_students ?? 0} students</span>
                <span><BookOpen size={14} />Since {formatDate(batch.start_date)}</span>
              </div>
            </article>
          )) : (
            <article className="trainer-batch-card trainer-batch-empty">
              <h2>Assigned batches</h2>
              <p>{loading ? 'Loading your assigned groups…' : 'Your assigned batches will appear here.'}</p>
            </article>
          )}
        </section>
      </div>

      {!loading && !error && attendance.length > 0 ? (
        <p className="trainer-attendance-note">
          Attendance snapshot: {presentCount} of {attendance.length} records marked present.
        </p>
      ) : null}
    </div>
  );
}
