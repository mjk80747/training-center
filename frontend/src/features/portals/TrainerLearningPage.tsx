import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Code2, Download, FileText, Link2, LoaderCircle, Plus, Presentation, Upload, Video, X } from 'lucide-react';
import { listBatches } from '../../api/batches';
import {
  createAssignment,
  createMaterial,
  gradeSubmission,
  listAssignments,
  listMaterials,
  listSubmissions,
} from '../../api/learning';
import { listStudents } from '../../api/students';
import { normalizeList } from '../../lib/normalizeList';
import { apiErrorMessage } from '../auth/apiErrorMessage';

type LearningTab = 'Materials' | 'Assignments' | 'Evaluations';
type TrainerBatch = {
  id: number;
  batch_code: string;
};
type Material = {
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
  due_date: string;
  max_marks: number;
  attachment: string | null;
};
type Submission = {
  id: number;
  assignment: number;
  student: number;
  file: string;
  github_link: string;
  submitted_at: string;
  marks: number | string;
  feedback: string;
  status: string;
};
type TrainerStudent = {
  id: number;
  full_name: string;
};

const materialKinds = [
  { value: 'PDF', label: 'PDF' },
  { value: 'PPT', label: 'Slides' },
  { value: 'CODE', label: 'Code' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'LINK', label: 'Link' },
];

function formatDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
}

function localDateKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getMaterialIcon(type: Material['file_type']) {
  if (type === 'PPT') return Presentation;
  if (type === 'VIDEO') return Video;
  if (type === 'CODE') return Code2;
  if (type === 'LINK') return Link2;
  return FileText;
}

function getResourceTarget(file: string | null, url: string) {
  return file || url;
}

function getStatusLabel(submission: Submission) {
  if (submission.status === 'GRADED') return 'Reviewed';
  return submission.status === 'LATE' ? 'Late submission' : 'Review pending';
}

function ModalFrame({
  title,
  description,
  onClose,
  variant,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  variant?: 'upload';
  children: ReactNode;
}) {
  return (
    <div className="trainer-learning-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className={`trainer-learning-modal${variant ? ` trainer-${variant}-modal` : ''}`} role="dialog" aria-modal="true" aria-labelledby="trainer-modal-title">
        <div className="trainer-learning-modal-heading">
          <div><h2 id="trainer-modal-title">{title}</h2><p>{description}</p></div>
          <button type="button" aria-label="Close dialog" onClick={onClose}><X size={19} /></button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function TrainerLearningPage() {
  const [tab, setTab] = useState<LearningTab>('Materials');
  const [batches, setBatches] = useState<TrainerBatch[]>([]);
  const [students, setStudents] = useState<TrainerStudent[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [gradingId, setGradingId] = useState<number | null>(null);
  const [savingGrade, setSavingGrade] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [gradeDraft, setGradeDraft] = useState<{ marks: string; feedback: string }>({ marks: '', feedback: '' });
  const [uploadForm, setUploadForm] = useState({ title: '', batch: '', file_type: 'PDF', url: '' });
  const [assignmentForm, setAssignmentForm] = useState({ title: '', batch: '', due_date: '', max_marks: '100', description: '' });

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([listBatches(), listStudents(), listMaterials(), listAssignments(), listSubmissions()])
      .then(([batchResponse, studentResponse, materialResponse, assignmentResponse, submissionResponse]) => {
        if (!active) return;
        const batchData = normalizeList<TrainerBatch>(batchResponse.data);
        setBatches(batchData);
        setStudents(normalizeList<TrainerStudent>(studentResponse.data));
        setMaterials(normalizeList<Material>(materialResponse.data));
        setAssignments(normalizeList<Assignment>(assignmentResponse.data));
        setSubmissions(normalizeList<Submission>(submissionResponse.data));
        setUploadForm((current) => ({ ...current, batch: current.batch || String(batchData[0]?.id ?? '') }));
        setAssignmentForm((current) => ({ ...current, batch: current.batch || String(batchData[0]?.id ?? '') }));
      })
      .catch((loadError: unknown) => {
        if (active) setError(apiErrorMessage(loadError, 'Could not load your materials and assignments.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [retryKey]);

  const batchNames = useMemo(() => new Map(batches.map((batch) => [batch.id, batch.batch_code])), [batches]);
  const studentNames = useMemo(() => new Map(students.map((student) => [student.id, student.full_name])), [students]);
  const assignmentNames = useMemo(() => new Map(assignments.map((assignment) => [assignment.id, assignment.title])), [assignments]);
  const assignmentsById = useMemo(() => new Map(assignments.map((assignment) => [assignment.id, assignment])), [assignments]);
  const pendingCount = submissions.filter((submission) => submission.status !== 'GRADED').length;
  const visibleSubmissions = submissions;
  const today = localDateKey();

  function closeUpload() {
    setUploadOpen(false);
    setSelectedFile(null);
  }

  async function submitMaterial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploading(true);
    setError('');
    setNotice('');
    const formData = new FormData();
    formData.append('title', uploadForm.title.trim());
    formData.append('batch', uploadForm.batch);
    formData.append('file_type', uploadForm.file_type);
    if (uploadForm.file_type === 'LINK') formData.append('url', uploadForm.url.trim());
    if (selectedFile) formData.append('file', selectedFile);
    try {
      const { data } = await createMaterial(formData);
      setMaterials((current) => [data as Material, ...current]);
      setNotice('Material uploaded and shared with the selected batch.');
      setUploadForm((current) => ({ ...current, title: '', url: '' }));
      closeUpload();
    } catch (submitError: unknown) {
      setError(apiErrorMessage(submitError, 'Material could not be uploaded. Check the file and try again.'));
    } finally {
      setUploading(false);
    }
  }

  async function submitAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingAssignment(true);
    setError('');
    setNotice('');
    const formData = new FormData();
    formData.append('title', assignmentForm.title.trim());
    formData.append('batch', assignmentForm.batch);
    formData.append('due_date', assignmentForm.due_date);
    formData.append('max_marks', assignmentForm.max_marks);
    formData.append('description', assignmentForm.description.trim());
    try {
      const { data } = await createAssignment(formData);
      setAssignments((current) => [data as Assignment, ...current]);
      setNotice('Assignment published for the selected batch.');
      setAssignmentForm((current) => ({ ...current, title: '', due_date: '', description: '' }));
      setAssignmentOpen(false);
    } catch (submitError: unknown) {
      setError(apiErrorMessage(submitError, 'Assignment could not be published. Please check the details.'));
    } finally {
      setSavingAssignment(false);
    }
  }

  async function submitGrade(submission: Submission) {
    const marks = Number(gradeDraft.marks);
    const assignment = assignmentsById.get(submission.assignment);
    if (!assignment || !Number.isFinite(marks) || marks < 0 || marks > assignment.max_marks) {
      setError(`Enter a score from 0 to ${assignment?.max_marks ?? 'the maximum marks'}.`);
      return;
    }
    setGradingId(submission.id);
    setSavingGrade(true);
    setError('');
    setNotice('');
    try {
      const { data } = await gradeSubmission(submission.id, marks, gradeDraft.feedback.trim());
      setSubmissions((current) => current.map((item) => item.id === submission.id ? data as Submission : item));
      setNotice(`Evaluation saved for ${studentNames.get(submission.student) || 'student'}.`);
      setGradeDraft({ marks: '', feedback: '' });
      setGradingId(null);
    } catch (gradeError: unknown) {
      setError(apiErrorMessage(gradeError, 'The evaluation could not be saved.'));
    } finally {
      setSavingGrade(false);
    }
  }

  function openGrading(submission: Submission) {
    setGradingId(submission.id);
    setGradeDraft({ marks: String(submission.marks ?? ''), feedback: submission.feedback ?? '' });
  }

  const tabs: LearningTab[] = ['Materials', 'Assignments', 'Evaluations'];

  return (
    <section className="trainer-learning-page">
      <header className="trainer-learning-heading">
        <p className="trainer-eyebrow">TRAINER</p>
        <h1>Materials &amp; assignments</h1>
        <p>Share class materials, publish assignments and review evaluations for your batches.</p>
      </header>

      {error ? (
        <div className="trainer-dashboard-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setRetryKey((key) => key + 1)}>Reload</button>
        </div>
      ) : null}
      {notice ? <p className="trainer-learning-notice" role="status">{notice}</p> : null}

      <div className="trainer-learning-tabs" role="tablist" aria-label="Trainer learning workspace">
        {tabs.map((item) => (
          <button
            type="button"
            key={item}
            role="tab"
            aria-selected={tab === item}
            className={tab === item ? 'active' : ''}
            onClick={() => { setTab(item); setError(''); setNotice(''); }}
          >
            {item}
            {item === 'Evaluations' && pendingCount ? <span>{pendingCount}</span> : null}
          </button>
        ))}
      </div>

      {tab !== 'Evaluations' ? (
        <div className="trainer-learning-actions">
          {tab === 'Materials' ? (
            <button type="button" className="trainer-mark-attendance" onClick={() => { setUploadOpen(true); setError(''); }}>
              <Upload size={16} />Upload material
            </button>
          ) : (
            <button type="button" className="trainer-mark-attendance" onClick={() => { setAssignmentOpen(true); setError(''); }}>
              <Plus size={17} />New assignment
            </button>
          )}
        </div>
      ) : null}

      {loading ? (
        <p className="trainer-learning-empty"><LoaderCircle size={17} className="trainer-learning-spinner" />Loading your assigned learning data…</p>
      ) : null}

      {!loading && tab === 'Materials' ? (
        materials.length ? (
          <div className="trainer-material-grid">
            {materials.map((material) => {
              const Icon = getMaterialIcon(material.file_type);
              const target = getResourceTarget(material.file, material.url);
              return (
                <article className="trainer-material-card" key={material.id}>
                  <span className="trainer-material-icon"><Icon size={19} /></span>
                  <div className="trainer-material-copy">
                    <h2>{material.title}</h2>
                    <p>{batchNames.get(material.batch ?? 0) || 'Course material'} · {materialKinds.find((kind) => kind.value === material.file_type)?.label ?? material.file_type} · {formatDate(material.created_at)}</p>
                  </div>
                  {target ? <a className="trainer-resource-download" href={target} target="_blank" rel="noreferrer" aria-label={`Open ${material.title}`}>
                    {material.file ? <Download size={17} /> : <Link2 size={17} />}
                  </a> : null}
                </article>
              );
            })}
          </div>
        ) : <p className="trainer-learning-empty">No materials have been shared with your batches yet.</p>
      ) : null}

      {!loading && tab === 'Assignments' ? (
        assignments.length ? (
          <div className="trainer-learning-table-wrap">
            <table className="trainer-learning-table">
              <thead><tr><th>Assignment</th><th>Batch</th><th>Due</th><th>Submissions</th><th>Status</th></tr></thead>
              <tbody>
                {assignments.map((assignment) => {
                  const submitted = submissions.filter((submission) => submission.assignment === assignment.id).length;
                  const open = assignment.due_date >= today;
                  return (
                    <tr key={assignment.id}>
                      <td><strong>{assignment.title}</strong><small>Max {assignment.max_marks} marks</small></td>
                      <td><code>{batchNames.get(assignment.batch) || 'Assigned batch'}</code></td>
                      <td>{formatDate(assignment.due_date)}</td>
                      <td>{submitted}</td>
                      <td><span className={`trainer-assignment-status ${open ? 'open' : 'closed'}`}><i />{open ? 'Open' : 'Closed'}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <p className="trainer-learning-empty">No assignments have been published for your batches.</p>
      ) : null}

      {!loading && tab === 'Evaluations' ? (
        visibleSubmissions.length ? (
          <div className="trainer-learning-table-wrap">
            <table className="trainer-learning-table trainer-evaluation-table">
              <thead><tr><th>Student</th><th>Assignment</th><th>Batch</th><th>Submission</th><th>Evaluation</th><th /></tr></thead>
              <tbody>
                {visibleSubmissions.map((submission) => (
                  <tr key={submission.id}>
                    <td><strong>{studentNames.get(submission.student) || `Student #${submission.student}`}</strong></td>
                    <td>{assignmentNames.get(submission.assignment) || 'Assignment'}</td>
                    <td><code>{batchNames.get(assignmentsById.get(submission.assignment)?.batch ?? 0) || 'Assigned batch'}</code></td>
                    <td>
                      {submission.file ? <a href={submission.file} target="_blank" rel="noreferrer">View file</a> : null}
                      {submission.github_link ? <a href={submission.github_link} target="_blank" rel="noreferrer">GitHub</a> : null}
                      {!submission.file && !submission.github_link ? 'Submitted' : null}
                    </td>
                    <td>
                      {gradingId === submission.id ? (
                        <form className="trainer-grade-form" onSubmit={(event) => { event.preventDefault(); void submitGrade(submission); }}>
                          <label><span className="sr-only">Marks</span><input aria-label="Marks" required type="number" min="0" max={assignmentsById.get(submission.assignment)?.max_marks ?? 100} step="0.01" value={gradeDraft.marks} onChange={(event) => setGradeDraft((current) => ({ ...current, marks: event.target.value }))} /></label>
                          <label><span className="sr-only">Feedback</span><input aria-label="Feedback" value={gradeDraft.feedback} onChange={(event) => setGradeDraft((current) => ({ ...current, feedback: event.target.value }))} placeholder="Feedback" /></label>
                          <button type="submit" disabled={savingGrade}>{savingGrade ? 'Saving…' : 'Save'}</button>
                          <button type="button" onClick={() => setGradingId(null)}>Cancel</button>
                        </form>
                      ) : (
                        <span className={`trainer-evaluation-status ${submission.status === 'GRADED' ? 'graded' : 'pending'}`}>
                          {submission.status === 'GRADED' ? `${submission.marks} / ${assignmentsById.get(submission.assignment)?.max_marks ?? '—'}` : getStatusLabel(submission)}
                        </span>
                      )}
                    </td>
                    <td>
                      {gradingId !== submission.id ? (
                        <button type="button" className="trainer-evaluate-button" onClick={() => openGrading(submission)}>
                          <ClipboardCheck size={14} />Evaluate
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="trainer-learning-empty">No submissions are waiting for evaluation.</p>
      ) : null}

      {uploadOpen ? (
        <ModalFrame
          title="Upload material"
          description="Visible only to students in the selected batch."
          onClose={closeUpload}
          variant="upload"
        >
          <form className="trainer-learning-form trainer-upload-form" onSubmit={(event) => { void submitMaterial(event); }}>
            <label>Batch<select required value={uploadForm.batch} onChange={(event) => setUploadForm((current) => ({ ...current, batch: event.target.value }))}>
              {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.batch_code}</option>)}
            </select></label>
            <label>Title<input required maxLength={255} value={uploadForm.title} onChange={(event) => setUploadForm((current) => ({ ...current, title: event.target.value }))} /></label>
            <label>Type<select value={uploadForm.file_type} onChange={(event) => { setUploadForm((current) => ({ ...current, file_type: event.target.value, url: '' })); setSelectedFile(null); }}>
              {materialKinds.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}
            </select></label>
            {uploadForm.file_type === 'LINK' ? (
              <label>Resource URL<input type="url" required value={uploadForm.url} onChange={(event) => setUploadForm((current) => ({ ...current, url: event.target.value }))} placeholder="https://…" /></label>
            ) : (
              <label>
                File ({uploadForm.file_type === 'PDF' ? '.pdf' : uploadForm.file_type === 'PPT' ? '.ppt, .pptx' : uploadForm.file_type === 'VIDEO' ? '.mp4, .mov, .webm' : '.zip, .ipynb, .py, .js, .ts, .tsx, .html, .css, .sql'} · 20 MB max)
                <input required type="file" accept={uploadForm.file_type === 'PDF' ? '.pdf' : uploadForm.file_type === 'PPT' ? '.ppt,.pptx' : uploadForm.file_type === 'VIDEO' ? '.mp4,.mov,.webm' : '.zip,.ipynb,.py,.js,.ts,.tsx,.html,.css,.sql'} onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} />
              </label>
            )}
            {selectedFile ? <p className="trainer-learning-file-name">{selectedFile.name}</p> : null}
            <div className="trainer-learning-form-actions">
              <button type="button" onClick={closeUpload}>Cancel</button>
              <button type="submit" className="trainer-mark-attendance" disabled={uploading || !batches.length}>{uploading ? 'Uploading…' : 'Upload'}</button>
            </div>
          </form>
        </ModalFrame>
      ) : null}

      {assignmentOpen ? (
        <ModalFrame title="New assignment" description="Publish assignment details for your assigned batch." onClose={() => setAssignmentOpen(false)}>
          <form className="trainer-learning-form" onSubmit={(event) => { void submitAssignment(event); }}>
            <label>Batch<select required value={assignmentForm.batch} onChange={(event) => setAssignmentForm((current) => ({ ...current, batch: event.target.value }))}>
              {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.batch_code}</option>)}
            </select></label>
            <label>Title<input required maxLength={255} value={assignmentForm.title} onChange={(event) => setAssignmentForm((current) => ({ ...current, title: event.target.value }))} /></label>
            <label>Description<textarea rows={3} value={assignmentForm.description} onChange={(event) => setAssignmentForm((current) => ({ ...current, description: event.target.value }))} /></label>
            <div className="trainer-learning-form-row">
              <label>Due date<input required type="date" min={today} value={assignmentForm.due_date} onChange={(event) => setAssignmentForm((current) => ({ ...current, due_date: event.target.value }))} /></label>
              <label>Maximum marks<input required type="number" min="1" value={assignmentForm.max_marks} onChange={(event) => setAssignmentForm((current) => ({ ...current, max_marks: event.target.value }))} /></label>
            </div>
            <div className="trainer-learning-form-actions">
              <button type="button" onClick={() => setAssignmentOpen(false)}>Cancel</button>
              <button type="submit" className="trainer-mark-attendance" disabled={savingAssignment || !batches.length}>{savingAssignment ? 'Publishing…' : 'Publish assignment'}</button>
            </div>
          </form>
        </ModalFrame>
      ) : null}
    </section>
  );
}
