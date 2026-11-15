import { type FormEvent, useMemo, useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarDays,
  Check,
  Clock3,
  Code2,
  Download,
  FileCode2,
  FileText,
  Laptop,
  Layers3,
  Mail,
  MapPin,
  Phone,
  Play,
  Plus,
  Presentation,
  RotateCcw,
  Search,
  Save,
  Upload,
  UserRound,
  UserRoundPlus,
  Users,
  Video,
  Wallet,
  X,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatPrice } from '../../lib/format';
import { routes } from '../../routes/paths';

type PreviewStudent = {
  name: string;
  email: string;
  college: string;
  branch: string;
  course: string;
  batch: string;
  joined: string;
  status: 'Active' | 'Blocked';
};

const initialStudents: PreviewStudent[] = [
  { name: 'Rahul Sharma', email: 'student@jkit.in', college: 'JNTU Hyderabad', branch: 'CSE · 3rd Year', course: 'PFS', batch: 'PFS-WD-01', joined: '08 Jan 2026', status: 'Active' },
  { name: 'Priya Nair', email: 'priya@example.com', college: 'CBIT', branch: 'IT · 4th Year', course: 'PFS', batch: 'PFS-WD-01', joined: '09 Jan 2026', status: 'Active' },
  { name: 'Aditya Verma', email: 'aditya@example.com', college: 'VNR VJIET', branch: 'ECE · 3rd Year', course: 'PFS', batch: 'PFS-WD-01', joined: '10 Jan 2026', status: 'Active' },
  { name: 'Sana Khan', email: 'sana@example.com', college: 'Osmania University', branch: 'CSE · 2nd Year', course: 'DA', batch: 'DA-WD-02', joined: '28 Jan 2026', status: 'Active' },
  { name: 'Vikram Rao', email: 'vikram@example.com', college: 'MGIT', branch: 'EEE · 4th Year', course: 'DA', batch: 'DA-WD-02', joined: '29 Jan 2026', status: 'Blocked' },
  { name: 'Ananya Gupta', email: 'ananya@example.com', college: 'CVR College', branch: 'CSE · 3rd Year', course: 'JFS', batch: 'JFS-WE-01', joined: '14 Jan 2026', status: 'Active' },
  { name: 'Karthik Reddy', email: 'karthik@example.com', college: 'GRIET', branch: 'IT · 4th Year', course: 'JFS', batch: 'JFS-WE-01', joined: '15 Jan 2026', status: 'Active' },
];

const courseRows = [
  { code: 'PFS', name: 'Python Full Stack', duration: '5 months', fee: 38000, batches: 2 },
  { code: 'JFS', name: 'Java Full Stack', duration: '5 months', fee: 42000, batches: 1 },
  { code: 'DA', name: 'Data Analytics', duration: '4 months', fee: 34000, batches: 1 },
  { code: 'FED', name: 'Front-End Development', duration: '3 months', fee: 26000, batches: 1 },
];

const leadSeed = [
  { name: 'Harsha Vardhan', date: '18 Feb 2026', source: 'Website', phone: '+91 90000 11111', email: 'harsha@example.com', course: 'PFS', courseName: 'Python Full Stack', note: 'Interested in weekend batch.', status: 'New' },
  { name: 'Lakshmi Prasad', date: '16 Feb 2026', source: 'Walk-in', phone: '+91 90000 22222', email: 'lakshmi@example.com', course: 'DA', courseName: 'Data Analytics', note: 'Final year ECE, wants placement support.', status: 'Contacted' },
  { name: 'Siddharth Jain', date: '15 Feb 2026', source: 'Instagram', phone: '+91 90000 33333', email: 'sid@example.com', course: 'JFS', courseName: 'Java Full Stack', note: 'Demo on Saturday.', status: 'Demo Scheduled' },
  { name: 'Pooja Kulkarni', date: '19 Feb 2026', source: 'Referral', phone: '+91 90000 44444', email: 'pooja@example.com', course: 'FED', courseName: 'Front-End Development', note: 'Looking for an evening batch.', status: 'New' },
  { name: 'Manoj Kumar', date: '02 Feb 2026', source: 'College Seminar', phone: '+91 90000 55555', email: 'manoj@example.com', course: 'PFS', courseName: 'Python Full Stack', note: 'Ready to join the next cohort.', status: 'Converted' },
  { name: 'Ayesha Begum', date: '25 Jan 2026', source: 'Website', phone: '+91 90000 66666', email: 'ayesha@example.com', course: 'DA', courseName: 'Data Analytics', note: 'Requested a call next month.', status: 'Lost' },
  { name: 'Rohan Das', date: '23 Jan 2026', source: 'Walk-in', phone: '+91 90000 77777', email: 'rohan@example.com', course: 'JFS', courseName: 'Java Full Stack', note: 'Comparing course options.', status: 'Contacted' },
];

const batchRows = [
  { code: 'PFS-WD-01', name: 'Python Full Stack', trainer: 'Arjun Mehta', schedule: 'Mon – Fri · 7:00 PM – 9:00 PM', mode: 'Hybrid', starts: '12 Jan 2026', filled: 24, capacity: 30, status: 'Running' },
  { code: 'JFS-WE-01', name: 'Java Full Stack', trainer: 'Kavya Reddy', schedule: 'Sat – Sun · 2:00 PM – 4:00 PM', mode: 'Offline', starts: '17 Jan 2026', filled: 21, capacity: 25, status: 'Running' },
  { code: 'DA-WD-02', name: 'Data Analytics', trainer: 'Arjun Mehta', schedule: 'Mon – Fri · 6:30 PM – 8:30 PM', mode: 'Online', starts: '02 Feb 2026', filled: 28, capacity: 35, status: 'Running' },
  { code: 'FED-WE-03', name: 'Front-End Development', trainer: 'Sneha Iyer', schedule: 'Sat – Sun · 9:00 AM – 11:00 AM', mode: 'Online', starts: '07 Mar 2026', filled: 12, capacity: 30, status: 'Upcoming' },
  { code: 'PFS-WE-02', name: 'Python Full Stack', trainer: 'Kavya Reddy', schedule: 'Sat – Sun · 5:00 PM – 7:00 PM', mode: 'Hybrid', starts: '02 Nov 2025', filled: 25, capacity: 25, status: 'Completed' },
];

const materialSeed = [
  { title: 'Django ORM deep-dive — slides', kind: 'Slides', batch: 'PFS-WD-01', date: '17 Feb 2026' },
  { title: 'REST API with DRF — starter repo', kind: 'Code', batch: 'PFS-WD-01', date: '18 Feb 2026' },
  { title: 'Class recording: Authentication & JWT', kind: 'Video', batch: 'PFS-WD-01', date: '19 Feb 2026' },
  { title: 'Pandas cheat sheet', kind: 'PDF', batch: 'DA-WD-02', date: '16 Feb 2026' },
  { title: 'SQL window functions lab', kind: 'Code', batch: 'DA-WD-02', date: '18 Feb 2026' },
];

function PreviewBanner({ children = 'UI preview — data shown here is sample data and resets on reload.' }: { children?: string }) {
  return <div className="preview-banner"><strong>MOCK</strong><span>{children}</span></div>;
}

function ScreenTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="screen-title">
      <div><p className="screen-eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>
      {action ? <div className="screen-title-action">{action}</div> : null}
    </div>
  );
}

function StatusPill({ children }: { children: string }) {
  const tone = children.toLowerCase().replace(/ /g, '-');
  return <span className={`status-pill status-${tone}`}><i />{children}</span>;
}

function Metric({ label, value, caption, icon: Icon, tone = 'violet' }: { label: string; value: string; caption: string; icon: typeof Users; tone?: string }) {
  return (
    <article className="metric-card reference-metric">
      <div className="metric-top"><span>{label}</span><span className={`metric-icon ${tone}`}><Icon size={18} /></span></div>
      <p className="metric-value">{value}</p><div className="metric-caption">{caption}</div>
    </article>
  );
}

export function ReferenceAdminDashboard() {
  const navigate = useNavigate();
  return (
    <div className="reference-screen">
      <ScreenTitle eyebrow="Operations" title="Good evening, Ravi" description="Here's what's happening at KSR IT SOLUTIONS today." action={<button className="reference-button reference-primary" onClick={() => navigate(routes.admin.leads)}><UserRoundPlus size={16} /> New enquiries</button>} />
      <PreviewBanner />
      <div className="dashboard-stats">
        <Metric label="Active students" value="9" caption="12 total records" icon={Users} tone="violet" />
        <Metric label="Running batches" value="3" caption="1 upcoming" icon={Layers3} tone="cyan" />
        <Metric label="Open leads" value="5" caption="1 converted" icon={UserRoundPlus} tone="amber" />
        <Metric label="Fees collected" value="₹1,73,600" caption="Manually recorded payments" icon={Wallet} tone="green" />
      </div>
      <div className="reference-dashboard-grid">
        <section className="preview-panel chart-panel">
          <div className="panel-title-row"><h2>Enrolments vs leads</h2><span>Last 6 months</span></div>
          <svg className="enrolment-chart" viewBox="0 0 760 250" role="img" aria-label="Enrolments and leads from September to February">
            <defs><linearGradient id="chart-cyan" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#00bfd5" stopOpacity=".22" /><stop offset="1" stopColor="#00bfd5" stopOpacity="0" /></linearGradient><linearGradient id="chart-violet" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#6756f5" stopOpacity=".25" /><stop offset="1" stopColor="#6756f5" stopOpacity="0" /></linearGradient></defs>
            {[35, 91, 147, 203].map((y) => <line key={y} x1="42" x2="744" y1={y} y2={y} stroke="#243044" />)}
            <path d="M42 138 C90 124 120 112 180 112 S282 120 322 130 S418 164 464 160 S560 62 600 50 S704 69 744 82 L744 203 L42 203 Z" fill="url(#chart-cyan)" />
            <path d="M42 182 C102 169 132 161 180 164 S278 170 322 178 S419 191 464 188 S560 151 600 142 S701 149 744 158 L744 203 L42 203 Z" fill="url(#chart-violet)" />
            <path d="M42 138 C90 124 120 112 180 112 S282 120 322 130 S418 164 464 160 S560 62 600 50 S704 69 744 82" fill="none" stroke="#00c4dc" strokeWidth="2.5" />
            <path d="M42 182 C102 169 132 161 180 164 S278 170 322 178 S419 191 464 188 S560 151 600 142 S701 149 744 158" fill="none" stroke="#6858f6" strokeWidth="2.5" />
            {['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'].map((month, i) => <text key={month} x={42 + i * 140} y="226" fill="#79869a" fontSize="12" textAnchor="middle">{month}</text>)}
            {['120', '90', '60', '30'].map((num, i) => <text key={num} x="27" y={39 + i * 56} fill="#79869a" fontSize="11" textAnchor="end">{num}</text>)}
          </svg>
        </section>
        <section className="preview-panel funnel-panel">
          <h2>Lead funnel</h2>
          {[
            ['New', 100], ['Contacted', 100], ['Demo Scheduled', 52], ['Converted', 52], ['Lost', 52],
          ].map(([label, width]) => <div className="funnel-row" key={label}><span>{label}</span><i><b style={{ width: `${width}%` }} /></i></div>)}
        </section>
      </div>
      <div className="reference-dashboard-grid lower-grid">
        <section className="preview-panel occupancy-panel">
          <div className="panel-title-row"><h2>Batch occupancy</h2><Link to={routes.admin.batches}>All batches</Link></div>
          {batchRows.slice(0, 4).map((batch) => <div className="occupancy-row" key={batch.code}><div><strong>{batch.code}</strong><span>· {batch.trainer}</span><small>{batch.filled}/{batch.capacity}</small></div><i><b style={{ width: `${(batch.filled / batch.capacity) * 100}%` }} /></i></div>)}
        </section>
        <section className="preview-panel recent-leads-panel">
          <div className="panel-title-row"><h2>Recent enquiries</h2><Link to={routes.admin.leads}>View all <ArrowRight size={14} /></Link></div>
          {leadSeed.slice(0, 5).map((lead) => <div className="recent-lead-row" key={lead.email}><div><strong>{lead.name}</strong><span>{lead.course} · {lead.source} · {lead.date}</span></div><StatusPill>{lead.status}</StatusPill></div>)}
        </section>
      </div>
    </div>
  );
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((field) => `"${field.replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function ReferenceAdminStudents() {
  const [students, setStudents] = useState(initialStudents);
  const [search, setSearch] = useState('');
  const [course, setCourse] = useState('All courses');
  const [status, setStatus] = useState('All (excl. archived)');
  const [formOpen, setFormOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [notice, setNotice] = useState('');
  const visible = students.filter((student) => {
    const matchesText = `${student.name} ${student.email} ${student.college}`.toLowerCase().includes(search.toLowerCase());
    const matchesCourse = course === 'All courses' || student.course === course;
    const matchesStatus = status === 'All (excl. archived)' || student.status === status;
    return matchesText && matchesCourse && matchesStatus;
  });

  function addStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStudents((current) => [...current, { name: newName, email: newEmail, college: 'New student', branch: '—', course: 'PFS', batch: 'PFS-WD-01', joined: 'Today', status: 'Active' }]);
    setNewName('');
    setNewEmail('');
    setFormOpen(false);
    setNotice('Student added to this preview. It will reset when you reload.');
  }

  return (
    <div className="reference-screen">
      <ScreenTitle eyebrow="Admissions" title="Students" description="Register admitted students and view student records." action={<><button className="reference-button reference-outline" onClick={() => downloadCsv('students.csv', [['Student', 'Email', 'College', 'Course', 'Batch', 'Joined', 'Status'], ...visible.map((row) => [row.name, row.email, row.college, row.course, row.batch, row.joined, row.status])])}><Download size={16} /> Export CSV</button><button className="reference-button reference-primary" onClick={() => { setFormOpen((open) => !open); setNotice(''); }}><UserRoundPlus size={16} /> Register student</button></>} />
      <PreviewBanner />
      {notice ? <p className="preview-notice" role="status">{notice}</p> : null}
      {formOpen ? <form className="preview-inline-form" onSubmit={addStudent}><label>Full name<input required value={newName} onChange={(event) => setNewName(event.target.value)} /></label><label>Email<input required type="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} /></label><button className="reference-button reference-primary" type="submit"><Plus size={15} /> Add to preview</button></form> : null}
      <div className="student-filters">
        <label className="reference-search"><Search size={17} /><input placeholder="Search by name, email or college" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <select value={status} onChange={(event) => setStatus(event.target.value)}><option>All (excl. archived)</option><option>Active</option><option>Blocked</option></select>
        <select value={course} onChange={(event) => setCourse(event.target.value)}><option>All courses</option>{courseRows.map((row) => <option key={row.code}>{row.code}</option>)}</select>
      </div>
      <div className="preview-table-wrap"><table className="preview-table"><thead><tr><th>Student</th><th>College</th><th>Course · Batch</th><th>Joined</th><th>Status</th></tr></thead><tbody>{visible.map((student) => <tr key={student.email}><td><strong>{student.name}</strong><small>{student.email}</small></td><td><strong>{student.college}</strong><small>{student.branch}</small></td><td className="mono">{student.course} · {student.batch}</td><td>{student.joined}</td><td><StatusPill>{student.status}</StatusPill></td></tr>)}{visible.length === 0 ? <tr><td className="table-empty" colSpan={5}>No students match your search.</td></tr> : null}</tbody></table></div>
    </div>
  );
}

export function ReferenceAdminLeads() {
  const [leads, setLeads] = useState(leadSeed);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const visible = leads.filter((lead) => (filter === 'All' || lead.status === filter) && `${lead.name} ${lead.courseName} ${lead.email}`.toLowerCase().includes(search.toLowerCase()));
  const statuses = ['All', 'New', 'Contacted', 'Demo Scheduled', 'Converted', 'Lost'];
  return (
    <div className="reference-screen">
      <ScreenTitle eyebrow="Admissions" title="Leads & enquiries" description="Track website enquiries, walk-ins and referrals from first contact to admission." />
      <PreviewBanner />
      <div className="lead-toolbar"><div className="lead-tabs">{statuses.map((status) => <button key={status} onClick={() => setFilter(status)} className={filter === status ? 'active' : ''}>{status}<small>{status === 'All' ? leads.length : leads.filter((lead) => lead.status === status).length}</small></button>)}</div><label className="reference-search"><Search size={17} /><input placeholder="Search leads" value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>
      <div className="lead-card-grid">{visible.map((lead) => <article className="lead-card" key={lead.email}>
        <div className="lead-card-head"><div><h2>{lead.name}</h2><p>{lead.date} · {lead.source}</p></div><StatusPill>{lead.status}</StatusPill></div>
        <div className="lead-contact"><a href={`tel:${lead.phone}`}><Phone size={15} />{lead.phone}</a><a href={`mailto:${lead.email}`}><Mail size={15} />{lead.email}</a></div>
        <div className="lead-course"><b>{lead.course}</b> · {lead.courseName}</div>
        <p className="lead-note">"{lead.note}"</p>
        <div className="lead-card-actions"><select aria-label={`Update status for ${lead.name}`} value={lead.status} onChange={(event) => setLeads((current) => current.map((item) => item.email === lead.email ? { ...item, status: event.target.value } : item))}>{statuses.slice(1).map((status) => <option key={status}>{status}</option>)}</select><button className="reference-button reference-primary" onClick={() => setLeads((current) => current.map((item) => item.email === lead.email ? { ...item, status: 'Converted' } : item))}><UserRoundPlus size={15} /> Convert</button></div>
      </article>)}</div>
      {visible.length === 0 ? <div className="preview-panel empty-preview">No enquiries match this filter.</div> : null}
    </div>
  );
}

export function ReferenceAdminBatches() {
  const [mode, setMode] = useState('All modes');
  const [slot, setSlot] = useState('All slots');
  const visible = batchRows.filter((batch) => (mode === 'All modes' || batch.mode === mode) && (slot === 'All slots' || (slot === 'Weekday' ? batch.code.includes('WD') : batch.code.includes('WE'))));
  return (
    <div className="reference-screen">
      <ScreenTitle eyebrow="Academics" title="Batches" description="Weekly schedules, trainers and seat availability for every batch." />
      <PreviewBanner />
      <div className="batch-filter-row"><select value={mode} onChange={(event) => setMode(event.target.value)}><option>All modes</option><option>Online</option><option>Offline</option><option>Hybrid</option></select><select value={slot} onChange={(event) => setSlot(event.target.value)}><option>All slots</option><option>Weekday</option><option>Weekend</option></select><span>Read-only access for counsellors</span></div>
      <div className="batch-card-grid">{visible.map((batch) => <article className="batch-card" key={batch.code}>
        <div className="batch-card-head"><div><strong className="mono">{batch.code}</strong><h2>{batch.name}</h2></div><StatusPill>{batch.status}</StatusPill></div>
        <p><UserRound size={16} />{batch.trainer}</p><p><Clock3 size={16} />{batch.schedule}</p><p><Laptop size={16} />{batch.mode}</p><p><CalendarDays size={16} />Starts {batch.starts}</p>
        <div className="batch-capacity"><span>Seats filled</span><strong>{batch.filled}/{batch.capacity}</strong></div><div className="capacity-track"><i style={{ width: `${(batch.filled / batch.capacity) * 100}%` }} /></div>
      </article>)}</div>
    </div>
  );
}

export function ReferenceAdminCourses() {
  return (
    <div className="reference-screen">
      <ScreenTitle eyebrow="Academics" title="Courses" description="Read-only course catalogue." />
      <PreviewBanner />
      <div className="preview-table-wrap course-table-wrap"><table className="preview-table"><thead><tr><th>Course</th><th>Duration</th><th>Fee</th><th>Batches</th><th>Status</th></tr></thead><tbody>{courseRows.map((course) => <tr key={course.code}><td><span className="course-code">{course.code}</span><strong className="course-name">{course.name}</strong></td><td>{course.duration}</td><td>{formatPrice(course.fee)}</td><td>{course.batches}</td><td><StatusPill>Active</StatusPill></td></tr>)}</tbody></table></div>
    </div>
  );
}

const classParts = [
  { name: 'Revision', length: '15m', description: 'Previous class revision & doubts', color: 'purple', width: '15%' },
  { name: 'Concept', length: '45m', description: 'Core concept instruction', color: 'cyan', width: '30%' },
  { name: 'Break', length: '10m', description: 'Mental refresh break', color: 'slate', width: '10%' },
  { name: 'Practical', length: '40m', description: 'Live hands-on coding lab', color: 'green', width: '30%' },
  { name: 'Q&A', length: '10m', description: 'Questions & assignment', color: 'amber', width: '15%' },
];

function ClassPlan() {
  return <><div className="class-plan-bar">{classParts.map((part) => <span className={`plan-${part.color}`} key={part.name}>{part.length}</span>)}</div><div className="class-plan-labels">{classParts.map((part) => <div key={part.name}><strong><i className={`dot ${part.color}`} />{part.name}&nbsp; {part.length}</strong><span>{part.description}</span></div>)}</div></>;
}

export function ReferenceTrainerDashboard() {
  const navigate = useNavigate();
  const [classStarted, setClassStarted] = useState(false);
  const [attendanceSaved, setAttendanceSaved] = useState(false);
  return (
    <div className="reference-screen">
      <ScreenTitle eyebrow="Trainer workspace" title="Welcome, Arjun" description="Your assigned batches, today's class plan and pending work." />
      <PreviewBanner>UI preview — you only see your own assigned batches and their students (sample data).</PreviewBanner>
      <div className="dashboard-stats trainer-stats"><Metric label="Assigned batches" value="2" caption="" icon={Layers3} tone="violet" /><Metric label="My students" value="8" caption="" icon={Users} tone="cyan" /><Metric label="Open assignments" value="2" caption="" icon={FileText} tone="amber" /></div>
      <div className="trainer-work-grid">
        <section className="preview-panel today-class-panel">
          <div className="today-class-head"><div><h2>Today's class · PFS-WD-01</h2><p>7:00 PM – 9:00 PM · Hybrid</p></div><button className="reference-button reference-primary" onClick={() => { setAttendanceSaved(false); navigate(routes.trainer.attendance); }}><CalendarCheck size={16} /> Mark attendance</button></div>
          <ClassPlan />
          <div className="class-timer"><span><strong>{classStarted ? '00:01' : '00:00'}</strong> / 02:00 · {classStarted ? 'Concept' : 'Revision'}</span><button onClick={() => setClassStarted((value) => !value)}><Play size={14} />{classStarted ? 'Pause class' : 'Start class'}</button><button aria-label="Reset class timer" onClick={() => setClassStarted(false)}><RotateCcw size={14} /></button></div>
          {attendanceSaved ? <p className="preview-notice" role="status">Attendance saved for this preview.</p> : null}
        </section>
        <div className="assigned-batch-list">{batchRows.slice(0, 1).concat(batchRows.slice(2, 3)).map((batch) => <article className="preview-panel assigned-batch-card" key={batch.code}><div className="assigned-head"><div><strong className="mono">{batch.code}</strong><h2>{batch.name}</h2></div><StatusPill>Running</StatusPill></div><div className="assigned-details"><span><Clock3 size={15} />{batch.schedule}</span><span><Laptop size={15} />{batch.mode}</span><span><Users size={15} />4 students</span><span>Since {batch.starts}</span></div></article>)}</div>
      </div>
    </div>
  );
}

type AttendanceStatus = 'Present' | 'Late' | 'Absent';
const attendanceSeed = [
  { name: 'Rahul Sharma', college: 'JNTU Hyderabad', status: 'Late' as AttendanceStatus },
  { name: 'Priya Nair', college: 'CBIT', status: 'Present' as AttendanceStatus },
  { name: 'Aditya Verma', college: 'VNR VJIET', status: 'Present' as AttendanceStatus },
  { name: 'Nisha Patel', college: 'CBIT', status: 'Present' as AttendanceStatus },
];

export function ReferenceTrainerAttendance() {
  const [students, setStudents] = useState(attendanceSeed);
  const [saved, setSaved] = useState(false);
  const counts = useMemo(() => students.reduce((result, student) => ({ ...result, [student.status]: result[student.status] + 1 }), { Present: 0, Late: 0, Absent: 0 }), [students]);
  function setAll(status: AttendanceStatus) {
    setStudents((current) => current.map((student) => ({ ...student, status })));
    setSaved(false);
  }
  return (
    <div className="reference-screen">
      <ScreenTitle eyebrow="Trainer" title="Attendance" description="Mark attendance for your assigned batches only." action={<button className="reference-button reference-primary" onClick={() => setSaved(true)}><Save size={16} /> Save attendance</button>} />
      <PreviewBanner />
      {saved ? <p className="preview-notice" role="status">Attendance saved in this preview. No backend record was created.</p> : null}
      <div className="attendance-controls"><select aria-label="Batch"><option>PFS-WD-01 · 7:00 PM – 9:00 PM</option><option>DA-WD-02 · 6:30 PM – 8:30 PM</option></select><input type="date" defaultValue="2026-11-04" aria-label="Attendance date" /><div className="attendance-bulk"><button onClick={() => setAll('Present')}>All present</button><button onClick={() => setAll('Absent')}>All absent</button></div></div>
      <p className="attendance-counts">Present: <strong>{counts.Present}</strong> &nbsp; Late: <strong>{counts.Late}</strong> &nbsp; Absent: <strong>{counts.Absent}</strong></p>
      <div className="attendance-list">{students.map((student) => <article className="attendance-student" key={student.name}><span className="student-initials">{student.name.split(' ').map((part) => part[0]).join('')}</span><div className="attendance-student-name"><strong>{student.name}</strong><span>{student.college}</span></div><div className="attendance-options">{(['Present', 'Late', 'Absent'] as const).map((status) => <button key={status} className={`${student.status === status ? `selected ${status.toLowerCase()}` : ''}`} onClick={() => { setStudents((current) => current.map((item) => item.name === student.name ? { ...item, status } : item)); setSaved(false); }}>{status}</button>)}</div></article>)}</div>
    </div>
  );
}

type Resource = { title: string; kind: string; batch: string; date: string };
const assignmentSeed = [
  { title: 'Build a Django REST API', batch: 'PFS-WD-01', due: 'Due 24 Feb 2026', count: '6 submissions' },
  { title: 'SQL analytics challenge', batch: 'DA-WD-02', due: 'Due 26 Feb 2026', count: '4 submissions' },
];
const evaluationSeed = [
  { title: 'Django REST API project', batch: 'PFS-WD-01', due: 'Review pending', count: '3 to evaluate' },
  { title: 'Data cleaning lab', batch: 'DA-WD-02', due: 'Review pending', count: '2 to evaluate' },
];

function saveResourceFile(resource: Resource) {
  const content = `KSR IT SOLUTIONS — ${resource.title}\nBatch: ${resource.batch}\nType: ${resource.kind}\nPublished: ${resource.date}\n\nPreview resource placeholder.`;
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
  anchor.download = `${resource.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

export function ReferenceTrainerMaterials() {
  const [tab, setTab] = useState('Materials');
  const [resources, setResources] = useState(materialSeed);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [batch, setBatch] = useState('PFS-WD-01');
  const [kind, setKind] = useState('PDF');
  const [notice, setNotice] = useState('');
  const [fileName, setFileName] = useState('');
  function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResources((current) => [{ title, kind, batch, date: '04 Nov 2026' }, ...current]);
    setTitle('');
    setFileName('');
    setUploadOpen(false);
    setNotice('Added to this preview only. Nothing was uploaded to a server.');
  }
  const workItems = tab === 'Assignments' ? assignmentSeed : evaluationSeed;
  return (
    <div className="reference-screen">
      <ScreenTitle eyebrow="Trainer" title="Materials & assignments" description="Share class materials, publish assignments and review evaluations for your batches." />
      <PreviewBanner />
      {notice ? <p className="preview-notice" role="status">{notice}</p> : null}
      <div className="resource-tabs">{['Materials', 'Assignments', 'Evaluations'].map((item) => <button className={tab === item ? 'active' : ''} key={item} onClick={() => setTab(item)}>{item}</button>)}</div>
      <div className="resource-actions">{tab === 'Materials' ? <button className="reference-button reference-primary" onClick={() => { setUploadOpen(true); setNotice(''); }}><Upload size={16} /> Upload material</button> : null}</div>
      <div className="resource-grid">{tab === 'Materials' ? resources.map((resource) => {
        const Icon = resource.kind === 'Slides' ? Presentation : resource.kind === 'Video' ? Video : resource.kind === 'PDF' ? FileText : FileCode2;
        return <article className="resource-card" key={`${resource.title}-${resource.date}`}><span className="resource-icon"><Icon size={19} /></span><div><h2>{resource.title}</h2><p>{resource.batch} · {resource.kind} · {resource.date}</p></div><button aria-label={`Download ${resource.title}`} onClick={() => saveResourceFile(resource)}><Download size={17} /></button></article>;
      }) : workItems.map((item) => <article className="resource-card work-card" key={item.title}><span className="resource-icon"><FileText size={19} /></span><div><h2>{item.title}</h2><p>{item.batch} · {item.due} · {item.count}</p></div><button onClick={() => setNotice(`${tab} are a preview only; submissions and grading are not connected to a backend.`)}>{tab === 'Assignments' ? 'Review' : 'Evaluate'}</button></article>)}</div>
      {uploadOpen ? <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setUploadOpen(false); }}><section className="upload-dialog" role="dialog" aria-modal="true" aria-labelledby="upload-title"><div className="upload-dialog-heading"><div><h2 id="upload-title">Upload material</h2><p>Visible only to students in the selected batch.</p></div><button aria-label="Close upload dialog" onClick={() => setUploadOpen(false)}><X size={20} /></button></div><form onSubmit={upload}><label>Batch<select value={batch} onChange={(event) => setBatch(event.target.value)}><option>PFS-WD-01</option><option>DA-WD-02</option></select></label><label>Title<input required value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>Type<select value={kind} onChange={(event) => setKind(event.target.value)}><option>PDF</option><option>Slides</option><option>Code</option><option>Video</option></select></label><label>File (.pdf, .pptx, .zip, .mp4, .ipynb)<input type="file" accept=".pdf,.pptx,.zip,.mp4,.ipynb" onChange={(event) => { const selected = event.target.files?.[0]; setFileName(selected?.name || ''); }} /></label><p className="upload-file-name">{fileName || 'Choose a file to add a preview entry.'}</p><div className="upload-dialog-footer"><button type="button" className="reference-button reference-outline" onClick={() => setUploadOpen(false)}>Cancel</button><button type="submit" className="reference-button reference-primary">Upload</button></div></form></section></div> : null}
    </div>
  );
}

function StudentCourseBanner({ onJoin }: { onJoin: () => void }) {
  return <section className="student-course-banner"><span className="student-course-code">PFS · PFS-WD-01</span><h2>Python Full Stack</h2><p>Mon – Fri · 7:00 PM – 9:00 PM IST · Hybrid · 5 months</p><div className="course-progress-label"><span>Course progress</span><strong>42%</strong></div><div className="course-progress-track"><i /></div><button className="reference-button reference-primary" onClick={onJoin}><Video size={16} /> Join today's class</button></section>;
}

export function ReferenceStudentDashboard() {
  const [notice, setNotice] = useState('');
  return (
    <div className="reference-screen">
      <ScreenTitle eyebrow="Student portal" title="Hi Rahul 👋" description="Your course, classes and progress at a glance." />
      <PreviewBanner>UI preview — you only see your own records (sample data).</PreviewBanner>
      {notice ? <p className="preview-notice" role="status">{notice}</p> : null}
      <StudentCourseBanner onJoin={() => setNotice("This sample class doesn't have a live meeting link yet. Check with your trainer.")} />
      <div className="dashboard-stats student-stats"><Metric label="Attendance" value="88%" caption="22 of 25 classes" icon={CalendarCheck} tone="green" /><Metric label="Pending assignments" value="1" caption="" icon={FileText} tone="amber" /><Metric label="Next fee due" value="₹11,400" caption="Due 10 Mar 2026" icon={Wallet} tone="cyan" /></div>
      <div className="student-overview-grid"><section className="preview-panel student-plan-panel"><h2>Your 2-hour class plan</h2><ClassPlan /></section><section className="preview-panel attendance-history"><div className="panel-title-row"><h2>Last 25 classes</h2><div className="attendance-legend"><span>● Present</span><span>● Late</span><span>● Absent</span></div></div><div className="attendance-dots">{Array.from({ length: 25 }, (_, index) => <i key={index} className={index === 3 || index === 11 || index === 22 ? 'absent' : index === 6 || index === 16 ? 'late' : ''} />)}</div></section></div>
    </div>
  );
}

const learningMaterials = [
  { title: 'Django ORM deep-dive — slides', kind: 'Slides', date: '17 Feb 2026' },
  { title: 'REST API with DRF — starter repo', kind: 'Code', date: '18 Feb 2026' },
  { title: 'Class recording: Authentication & JWT', kind: 'Video', date: '19 Feb 2026' },
];

export function ReferenceStudentLearning() {
  const [tab, setTab] = useState('Materials');
  const [notice, setNotice] = useState('');
  const visibleResources: Array<{ title: string; kind: string; date: string }> = tab === 'Materials' ? learningMaterials : assignmentSeed.map((item) => ({ title: item.title, kind: 'Assignment', date: item.due }));
  return (
    <div className="reference-screen">
      <ScreenTitle eyebrow="Student portal" title="My learning" description="Class materials and assignments for your batch." />
      <PreviewBanner />
      {notice ? <p className="preview-notice" role="status">{notice}</p> : null}
      <div className="resource-tabs"><button className={tab === 'Materials' ? 'active' : ''} onClick={() => setTab('Materials')}>Materials</button><button className={tab === 'Assignments' ? 'active' : ''} onClick={() => setTab('Assignments')}>Assignments</button></div>
      <div className="resource-grid student-resource-grid">{visibleResources.map((item) => {
        const Icon = item.kind === 'Slides' ? Presentation : item.kind === 'Video' ? Video : item.kind === 'Code' ? FileCode2 : FileText;
        return <article className="resource-card" key={item.title}><span className="resource-icon"><Icon size={19} /></span><div><h2>{item.title}</h2><p>{item.kind} · {item.date}</p></div><button aria-label={`Download ${item.title}`} onClick={() => { const resource = { ...item, batch: 'PFS-WD-01' }; saveResourceFile(resource); setNotice('Downloaded a text preview file. Full lesson files are not connected in this preview.'); }}><Download size={17} /></button></article>;
      })}</div>
    </div>
  );
}

const instalments = [
  { number: '#1', amount: 15200, due: '10 Jan 2026', paid: '10 Jan 2026', mode: 'Bank Transfer · TXN1000', status: 'Paid' },
  { number: '#2', amount: 11400, due: '10 Feb 2026', paid: '10 Feb 2026', mode: 'UPI · TXN1001', status: 'Paid' },
  { number: '#3', amount: 11400, due: '10 Mar 2026', paid: '—', mode: '—', status: 'Due' },
];

export function ReferenceStudentFees() {
  return (
    <div className="reference-screen">
      <ScreenTitle eyebrow="Student portal" title="Fees" description="Your instalment plan and payment history." />
      <PreviewBanner />
      <section className="fee-summary"><div><span>Total course fee</span><strong>₹38,000</strong></div><div><span>Paid so far</span><strong>₹26,600</strong></div><div className="fee-progress"><i /></div><small>Balance ₹11,400</small></section>
      <div className="preview-table-wrap fee-table-wrap"><table className="preview-table"><thead><tr><th>Instalment</th><th>Amount</th><th>Due date</th><th>Paid on</th><th>Mode · Ref</th><th>Status</th></tr></thead><tbody>{instalments.map((item) => <tr key={item.number}><td><strong>{item.number}</strong></td><td>{formatPrice(item.amount)}</td><td>{item.due}</td><td>{item.paid}</td><td>{item.mode}</td><td><StatusPill>{item.status}</StatusPill></td></tr>)}</tbody></table></div>
      <p className="fees-footnote"><Wallet size={15} /> Pay at the institute desk by cash, UPI, bank transfer or cheque. Online payments are coming soon.</p>
    </div>
  );
}

export function ReferenceStudentCertificates() {
  const [notice, setNotice] = useState('');
  return (
    <div className="reference-screen">
      <ScreenTitle eyebrow="Student portal" title="Certificates" description="Download certificates you've earned." />
      <PreviewBanner />
      {notice ? <p className="preview-notice" role="status">{notice}</p> : null}
      <div className="certificate-grid"><article className="certificate-card"><span className="certificate-icon earned"><Award size={22} /></span><div><h2>Python Foundations Module</h2><p>Issued 15 Dec 2025 · JKIT-PFS-2025-0142</p><button className="reference-button reference-outline" onClick={() => window.print()}>View certificate</button></div></article><article className="certificate-card"><span className="certificate-icon locked"><Award size={22} /></span><div><h2>Python Full Stack — Completion</h2><p>Unlocks when you finish the course and final project</p></div></article></div>
      <div className="sr-only" aria-live="polite">{notice}</div>
    </div>
  );
}
