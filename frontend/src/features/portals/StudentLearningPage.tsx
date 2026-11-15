import { useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, CalendarDays, CheckCircle2, Code2, Download, FileText, Link2, Presentation, RotateCcw, Video } from 'lucide-react';
import { listAssignments, listMaterials, listSubmissions } from '../../api/learning';
import { apiErrorMessage } from '../auth/apiErrorMessage';
import { normalizeList } from '../../lib/normalizeList';

type LearningTab = 'Materials' | 'Assignments';
type LearningMaterial = {
  id: number;
  title: string;
  file_type: 'PDF' | 'PPT' | 'CODE' | 'VIDEO' | 'LINK';
  batch: number | null;
  file: string | null;
  url: string;
  created_at: string;
};
type Assignment = {
  id: number;
  batch: number;
  title: string;
  description: string;
  attachment: string | null;
  due_date: string;
  max_marks: number;
};
type Submission = {
  id: number;
  assignment: number;
  submitted_at: string;
  marks: number | string;
  feedback: string;
  status: string;
};
type LearningData = {
  materials: LearningMaterial[];
  assignments: Assignment[];
  submissions: Submission[];
};

const emptyData: LearningData = { materials: [], assignments: [], submissions: [] };
const tabs: LearningTab[] = ['Materials', 'Assignments'];

function formatDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
}

function getMaterialIcon(type: LearningMaterial['file_type']) {
  if (type === 'PPT') return Presentation;
  if (type === 'VIDEO') return Video;
  if (type === 'CODE') return Code2;
  if (type === 'LINK') return Link2;
  return FileText;
}

function getMaterialKind(type: LearningMaterial['file_type']) {
  if (type === 'PPT') return 'Slides';
  if (type === 'CODE') return 'Code';
  return type.charAt(0) + type.slice(1).toLowerCase();
}

function getSubmissionLabel(submission?: Submission) {
  if (!submission) return 'Not submitted';
  if (submission.status === 'GRADED') return 'Reviewed';
  if (submission.status === 'LATE') return 'Submitted late';
  return 'Submitted · awaiting review';
}

export function StudentLearningPage() {
  const [tab, setTab] = useState<LearningTab>('Materials');
  const [data, setData] = useState<LearningData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([listMaterials(), listAssignments(), listSubmissions()])
      .then(([materialsResponse, assignmentsResponse, submissionsResponse]) => {
        if (!active) return;
        setData({
          materials: normalizeList<LearningMaterial>(materialsResponse.data),
          assignments: normalizeList<Assignment>(assignmentsResponse.data),
          submissions: normalizeList<Submission>(submissionsResponse.data),
        });
      })
      .catch((loadError: unknown) => {
        if (active) setError(apiErrorMessage(loadError, 'Could not load your batch learning materials and assignments.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [retryKey]);

  const submissionsByAssignment = useMemo(
    () => new Map(data.submissions.map((submission) => [submission.assignment, submission])),
    [data.submissions],
  );
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <section className="student-learning-page">
      <header className="student-learning-heading">
        <p className="student-eyebrow">STUDENT PORTAL</p>
        <h1>My learning</h1>
        <p>Class materials and assignments for your enrolled batches.</p>
      </header>

      <div className="student-learning-notice">
        <span>YOUR BATCH</span>
        <p>Materials and assignments shared by your trainer appear here.</p>
      </div>

      <div className="student-learning-tabs" role="tablist" aria-label="My learning">
        {tabs.map((item) => (
          <button
            type="button"
            key={item}
            id={`student-learning-tab-${item.toLowerCase()}`}
            role="tab"
            aria-selected={tab === item}
            aria-controls={`student-learning-panel-${item.toLowerCase()}`}
            className={tab === item ? 'active' : ''}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {error ? (
        <div className="student-learning-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setRetryKey((key) => key + 1)}><RotateCcw size={15} /> Try again</button>
        </div>
      ) : null}

      {loading ? (
        <p className="student-learning-empty" role="status">Loading your learning resources…</p>
      ) : tab === 'Materials' ? (
        <div className="student-learning-grid" id="student-learning-panel-materials" role="tabpanel" aria-labelledby="student-learning-tab-materials">
          {data.materials.length ? data.materials.map((material) => {
            const Icon = getMaterialIcon(material.file_type);
            const target = material.file || material.url;
            return (
              <article className="student-learning-material" key={material.id}>
                <span className="student-learning-material-icon"><Icon size={19} /></span>
                <div className="student-learning-material-copy">
                  <h2>{material.title}</h2>
                  <p>{getMaterialKind(material.file_type)} · {formatDate(material.created_at)}</p>
                </div>
                {target ? (
                  <a className="student-learning-download" href={target} target="_blank" rel="noreferrer" aria-label={`Open ${material.title}`}>
                    {material.file ? <Download size={18} /> : <Link2 size={17} />}
                  </a>
                ) : null}
              </article>
            );
          }) : <p className="student-learning-empty">No materials have been shared with your batches yet.</p>}
        </div>
      ) : (
        <div className="student-learning-assignment-list" id="student-learning-panel-assignments" role="tabpanel" aria-labelledby="student-learning-tab-assignments">
          {data.assignments.length ? data.assignments.map((assignment) => {
            const submission = submissionsByAssignment.get(assignment.id);
            const isOpen = assignment.due_date >= todayKey;
            return (
              <article className="student-learning-assignment" key={assignment.id}>
                <div className="student-learning-assignment-icon"><BookOpenCheck size={19} /></div>
                <div className="student-learning-assignment-copy">
                  <div className="student-learning-assignment-title">
                    <h2>{assignment.title}</h2>
                    <span className={`student-assignment-badge ${submission ? 'submitted' : isOpen ? 'open' : 'closed'}`}>
                      {submission ? getSubmissionLabel(submission) : isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  {assignment.description ? <p>{assignment.description}</p> : null}
                  <div className="student-learning-assignment-meta">
                    <span><CalendarDays size={14} />Due {formatDate(assignment.due_date)}</span>
                    <span>{assignment.max_marks} marks</span>
                    {submission?.status === 'GRADED' ? <span><CheckCircle2 size={14} />{submission.marks} / {assignment.max_marks}</span> : null}
                  </div>
                  {submission?.feedback ? <p className="student-learning-feedback">{submission.feedback}</p> : null}
                </div>
                {assignment.attachment ? (
                  <a className="student-learning-download" href={assignment.attachment} target="_blank" rel="noreferrer" aria-label={`Open ${assignment.title} attachment`}>
                    <Download size={18} />
                  </a>
                ) : null}
              </article>
            );
          }) : <p className="student-learning-empty">No assignments have been published for your batches yet.</p>}
        </div>
      )}
    </section>
  );
}
