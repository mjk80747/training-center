import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, Save, Users } from 'lucide-react';
import { bulkMarkAttendance, listAttendance } from '../../api/attendance';
import { listBatchSessions, listBatchStudents, listBatches } from '../../api/batches';
import { apiErrorMessage } from '../auth/apiErrorMessage';
import { normalizeList } from '../../lib/normalizeList';

type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
type TrainerBatch = {
  id: number;
  batch_code: string;
  start_time: string;
  end_time: string;
  status: string;
};
type BatchStudent = {
  id: number;
  student_code: string;
  full_name: string;
  college: string;
};
type ClassSession = {
  id: number;
  batch: number;
  date: string;
};
type AttendanceRecord = {
  id: number;
  session: number;
  student: number;
  status: AttendanceStatus;
};

const statusChoices: Array<{ label: string; value: Exclude<AttendanceStatus, 'EXCUSED'> }> = [
  { label: 'Present', value: 'PRESENT' },
  { label: 'Late', value: 'LATE' },
  { label: 'Absent', value: 'ABSENT' },
];

function localDateKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
  return new Date(1970, 0, 1, hours, minutes).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function statusMap(records: AttendanceRecord[]) {
  return Object.fromEntries(records.map((record) => [record.student, record.status])) as Record<number, AttendanceStatus>;
}

export function TrainerAttendancePage() {
  const [batches, setBatches] = useState<TrainerBatch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedDate, setSelectedDate] = useState(localDateKey);
  const [students, setStudents] = useState<BatchStudent[]>([]);
  const [draftStatuses, setDraftStatuses] = useState<Record<number, AttendanceStatus>>({});
  const [savedStatuses, setSavedStatuses] = useState<Record<number, AttendanceStatus>>({});
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoadingBatches(true);
    setError('');
    listBatches()
      .then((response) => {
        if (!active) return;
        const available = normalizeList<TrainerBatch>(response.data);
        setBatches(available);
        setSelectedBatchId((current) => current && available.some((batch) => String(batch.id) === current)
          ? current
          : available[0] ? String(available[0].id) : '');
      })
      .catch((loadError: unknown) => {
        if (active) setError(apiErrorMessage(loadError, 'Could not load your assigned batches.'));
      })
      .finally(() => {
        if (active) setLoadingBatches(false);
      });
    return () => { active = false; };
  }, [retryKey]);

  useEffect(() => {
    if (!selectedBatchId || !selectedDate) {
      setStudents([]);
      setSessionId(null);
      setDraftStatuses({});
      setSavedStatuses({});
      return undefined;
    }

    let active = true;
    setLoadingRoster(true);
    setError('');
    setNotice('');
    setSessionId(null);
    setStudents([]);
    setDraftStatuses({});
    setSavedStatuses({});

    const batchId = Number(selectedBatchId);
    Promise.all([listBatchStudents(batchId), listBatchSessions(batchId, selectedDate)])
      .then(async ([studentResponse, sessionResponse]) => {
        if (!active) return;
        const roster = normalizeList<BatchStudent>(studentResponse.data);
        const session = normalizeList<ClassSession>(sessionResponse.data)[0];
        setStudents(roster);
        if (!session) {
          setSessionId(null);
          setDraftStatuses(Object.fromEntries(roster.map((student) => [student.id, 'PRESENT'])));
          return;
        }

        const attendanceResponse = await listAttendance(session.id);
        if (!active) return;
        const persistedStatuses = statusMap(normalizeList<AttendanceRecord>(attendanceResponse.data));
        setSessionId(session.id);
        setSavedStatuses(persistedStatuses);
        setDraftStatuses(Object.fromEntries(roster.map((student) => [
          student.id,
          persistedStatuses[student.id] ?? 'PRESENT',
        ])));
      })
      .catch((loadError: unknown) => {
        if (active) setError(apiErrorMessage(loadError, 'Could not load attendance for this batch and date.'));
      })
      .finally(() => {
        if (active) setLoadingRoster(false);
      });

    return () => { active = false; };
  }, [selectedBatchId, selectedDate, retryKey]);

  const counts = useMemo(() => students.reduce((result, student) => {
    const status = draftStatuses[student.id];
    if (status === 'PRESENT') result.present += 1;
    if (status === 'LATE') result.late += 1;
    if (status === 'ABSENT') result.absent += 1;
    return result;
  }, { present: 0, late: 0, absent: 0 }), [students, draftStatuses]);
  const hasUnsavedChanges = Boolean(sessionId) && students.some((student) => (
    savedStatuses[student.id] !== draftStatuses[student.id]
  ));
  const selectedBatch = batches.find((batch) => String(batch.id) === selectedBatchId);

  function updateOne(studentId: number, status: AttendanceStatus) {
    setDraftStatuses((current) => ({ ...current, [studentId]: status }));
    setNotice('');
  }

  function updateAll(status: Exclude<AttendanceStatus, 'EXCUSED'>) {
    setDraftStatuses(Object.fromEntries(students.map((student) => [student.id, status])));
    setNotice('');
  }

  async function saveAttendance() {
    if (!sessionId || !students.length || !hasUnsavedChanges) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await bulkMarkAttendance(sessionId, students.map((student) => ({
        student_id: student.id,
        status: draftStatuses[student.id],
      })));
      setSavedStatuses({ ...draftStatuses });
      setNotice('Attendance saved successfully.');
    } catch (saveError: unknown) {
      setError(apiErrorMessage(saveError, 'Attendance could not be saved. Please try again.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="trainer-attendance-page">
      <header className="trainer-attendance-heading">
        <div>
          <p className="trainer-eyebrow">TRAINER</p>
          <h1>Attendance</h1>
          <p>Mark attendance for your assigned batches only.</p>
        </div>
        <button
          className="trainer-mark-attendance"
          type="button"
          onClick={() => { void saveAttendance(); }}
          disabled={!hasUnsavedChanges || saving || loadingRoster}
        >
          <Save size={16} />{saving ? 'Saving…' : 'Save attendance'}
        </button>
      </header>

      {error ? (
        <div className="trainer-dashboard-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setRetryKey((key) => key + 1)}>Try again</button>
        </div>
      ) : null}
      {notice ? <p className="trainer-attendance-notice" role="status">{notice}</p> : null}

      <div className="trainer-attendance-controls">
        <label>
          <span className="sr-only">Attendance batch</span>
          <select
            aria-label="Attendance batch"
            value={selectedBatchId}
            onChange={(event) => setSelectedBatchId(event.target.value)}
            disabled={loadingBatches || batches.length === 0}
          >
            {batches.length === 0 ? <option value="">{loadingBatches ? 'Loading batches…' : 'No assigned batches'}</option> : null}
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.batch_code} · {formatTime(batch.start_time)} – {formatTime(batch.end_time)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Attendance date</span>
          <input
            type="date"
            aria-label="Attendance date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </label>
        <div className="trainer-attendance-bulk">
          <button type="button" onClick={() => updateAll('PRESENT')} disabled={!students.length || loadingRoster}>All present</button>
          <button type="button" onClick={() => updateAll('ABSENT')} disabled={!students.length || loadingRoster}>All absent</button>
        </div>
      </div>

      <div className="trainer-attendance-counts" aria-live="polite">
        Present: <strong>{counts.present}</strong>
        <span>Late: <strong>{counts.late}</strong></span>
        <span>Absent: <strong>{counts.absent}</strong></span>
        {selectedBatch ? <span className="trainer-attendance-roster-count"><Users size={14} />{students.length} students</span> : null}
      </div>

      {loadingRoster ? <p className="trainer-attendance-empty">Loading roster and existing attendance…</p> : null}
      {!loadingRoster && selectedBatchId && !sessionId ? (
        <p className="trainer-attendance-empty">
          No class session is scheduled for {selectedDate} in this batch. Attendance can be marked after a session is scheduled.
        </p>
      ) : null}
      {!loadingRoster && sessionId && students.length === 0 ? (
        <p className="trainer-attendance-empty">No students are enrolled in this batch.</p>
      ) : null}

      {sessionId && students.length ? (
        <div className="trainer-attendance-roster">
          {students.map((student) => {
            const currentStatus = draftStatuses[student.id];
            return (
              <article className="trainer-attendance-student" key={student.id}>
                <span className="trainer-attendance-avatar">{initials(student.full_name)}</span>
                <div className="trainer-attendance-student-copy">
                  <strong>{student.full_name}</strong>
                  <span>{student.college || student.student_code}</span>
                </div>
                {currentStatus === 'EXCUSED' ? <span className="trainer-attendance-excused">Excused</span> : null}
                <div className="trainer-attendance-options" role="group" aria-label={`Attendance for ${student.full_name}`}>
                  {statusChoices.map(({ label, value }) => (
                    <button
                      type="button"
                      key={value}
                      className={`${currentStatus === value ? `selected ${value.toLowerCase()}` : ''}`}
                      aria-pressed={currentStatus === value}
                      onClick={() => updateOne(student.id, value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
      {hasUnsavedChanges ? <p className="trainer-attendance-dirty">Counts update as you make changes. Save attendance to record them.</p> : null}
      {!selectedBatchId && !loadingBatches && !error ? <p className="trainer-attendance-empty"><CalendarCheck size={16} />No assigned batches are available.</p> : null}
    </section>
  );
}
