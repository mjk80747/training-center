import { type FormEvent, lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  Archive,
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Ellipsis,
  GraduationCap,
  Layers3,
  LoaderCircle,
  Mail,
  MapPin,
  ExternalLink,
  Pencil,
  Phone,
  Plus,
  Search,
  Sparkles,
  ShieldBan,
  ShieldCheck,
  Users,
  UserRoundPlus,
  Wallet,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { listBatches } from './api/batches';
import { listCourses } from './api/courses';
import { getDashboardSummary } from './api/dashboard';
import { convertLead, createPublicEnquiry, listLeads, updateLead } from './api/leads';
import { archiveStudent, createStudent, listStudents, updateStudent } from './api/students';
import { instituteName } from './lib/config';
import { formatPrice } from './lib/format';
import { normalizeList } from './lib/normalizeList';
import { PublicLayout } from './layouts/PublicLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { StudentLayout } from './layouts/StudentLayout';
import { TrainerLayout } from './layouts/TrainerLayout';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { VerifyEmailPage } from './features/auth/VerifyEmailPage';
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage';
import { apiErrorMessage } from './features/auth/apiErrorMessage';
import { CourseCard } from './features/courses/CourseCard';
import { CourseCatalogSection } from './features/courses/CourseCatalogSection';
import { CourseFinderQuiz } from './features/courses/CourseFinderQuiz';
import { AdminCoursesPage } from './features/courses/AdminCoursesPage';
import { AdminFeesPage } from './features/fees/AdminFeesPage';
import { StudentFeesPage } from './features/fees/StudentFeesPage';
import { usePublicCourses } from './features/courses/usePublicCourses';
import type { CourseItem } from './features/courses/types';
import { FaqSection } from './features/faq/FaqSection';
import { PracticeSessionCard } from './features/home/PracticeSessionCard';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { routes } from './routes/paths';
import { getAuthSession } from './store/auth';

const AdminReportsPage = lazy(() => import('./features/reports/AdminReportsPage').then(({ AdminReportsPage: Page }) => ({ default: Page })));
const TrainerAttendancePage = lazy(() => import('./features/portals/TrainerAttendancePage').then(({ TrainerAttendancePage: Page }) => ({ default: Page })));
const TrainerDashboardPage = lazy(() => import('./features/portals/TrainerDashboardPage').then(({ TrainerDashboardPage: Page }) => ({ default: Page })));
const TrainerLearningPage = lazy(() => import('./features/portals/TrainerLearningPage').then(({ TrainerLearningPage: Page }) => ({ default: Page })));
const StudentDashboardPage = lazy(() => import('./features/portals/StudentDashboardPage').then(({ StudentDashboardPage: Page }) => ({ default: Page })));
const StudentLearningPage = lazy(() => import('./features/portals/StudentLearningPage').then(({ StudentLearningPage: Page }) => ({ default: Page })));
const StudentCertificatesPage = lazy(() => import('./features/portals/StudentCertificatesPage').then(({ StudentCertificatesPage: Page }) => ({ default: Page })));

type SummaryItem = {
  total_students: number;
  total_courses: number;
  active_batches: number;
  total_enrolments: number;
  new_leads: number;
  course_breakdown: Array<{ code: string; student_count: number }>;
};

type BatchItem = {
  id: number;
  batch_code: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  course: number;
  course_name: string;
  max_students: number;
  enrolled_students?: number;
  trainer?: number | null;
  trainer_name?: string;
  class_days: string;
  start_time: string;
  end_time: string;
  mode?: string;
};

type LeadItem = {
  id: number;
  name: string;
  mobile?: string;
  email?: string;
  interested_course?: string;
  status: string;
  source_name?: string;
  college_name?: string;
  branch?: string;
  message?: string;
  created_at?: string;
  next_follow_up_date?: string | null;
};

type StudentItem = {
  id: number;
  student_code: string;
  full_name: string;
  email: string;
  mobile: string;
  status: string;
  is_active: boolean;
  email_verified: boolean;
  city?: string;
  college?: string;
  branch?: string;
  created_at?: string;
};

function HomePage() {
  const { courses, loading, error, retry } = usePublicCourses();
  const reduceMotion = useReducedMotion();

  const learningStats = [
    { label: 'Theory-based learning', value: '30%', icon: BookOpenCheck },
    { label: 'Practical learning', value: '70%', icon: GraduationCap },
    { label: 'Online, offline & hybrid', value: '3 modes', icon: Clock3 },
  ];

  const whyChooseUs = [
    {
      title: 'Career-focused training',
      body: 'Every course is designed to help students gain practical skills that are useful in real job roles and internships.',
      icon: GraduationCap,
    },
    {
      title: 'Hands-on learning',
      body: 'We focus on practical assignments, guided exercises, and live project experience rather than just theory.',
      icon: BookOpen,
    },
    {
      title: 'Support that keeps students moving',
      body: 'From admission guidance to course mentoring, our team helps students stay confident and focused.',
      icon: Users,
    },
  ];

  return (
    <div className="home-page pb-12">
      <div className="home-page-content mx-auto max-w-[1276px] px-4 pt-7 sm:px-7">
        <motion.section
          className="public-hero"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.52, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="public-hero-copy">
            <span className="public-hero-kicker"><Sparkles size={13} /> KSR IT SOLUTIONS</span>
            <h1>Launch a strong IT career with practical training that works.</h1>
            <p>
              Learn in-demand technology skills, build confidence with real projects, and grow through guided coaching
              tailored for students and aspiring professionals.
            </p>
            <div className="public-hero-actions">
              <NavLink to="/courses" className="public-primary-action">Get course details <ArrowRight size={15} /></NavLink>
              <NavLink to="/contact" className="public-secondary-action">Talk to admissions</NavLink>
            </div>
            <div className="public-trust-row">
              <span><CheckCircle2 size={14} /> Practical classroom learning</span>
              <span><CheckCircle2 size={14} /> Expert mentors</span>
              <span><CheckCircle2 size={14} /> Career-ready training</span>
            </div>
          </div>
          <PracticeSessionCard />
        </motion.section>

        <section className="home-stats mt-8 grid gap-4 md:grid-cols-3">
          {learningStats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="home-stat-card rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <div className="home-stat-icon mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Icon size={20} />
              </div>
              <p className="text-2xl font-extrabold tracking-[-0.05em] text-slate-900">{value}</p>
              <p className="mt-1 text-sm text-slate-600">{label}</p>
            </div>
          ))}
        </section>

        <section className="home-why mt-8 rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-8">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">Why choose us</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.05em] text-slate-900">Building brighter futures through better learning</h2>
            </div>
            <NavLink to="/courses" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
              View courses <ArrowRight size={15} />
            </NavLink>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {whyChooseUs.map(({ title, body, icon: Icon }) => (
              <div key={title} className="home-why-card rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm">
                  <Icon size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <CourseCatalogSection
          courses={courses}
          loading={loading}
          error={error}
          onRetry={retry}
        />

        <CourseFinderQuiz courses={courses} />
        <FaqSection />
      </div>
    </div>
  );
}

function AboutPage() {
  return (
    <div className="public-info-page about-page">
      <p className="page-eyebrow">Our story</p>
      <h1>About {instituteName}</h1>
      <p className="public-info-intro">
        We are a modern training institute focused on technology careers, practical learning, and student growth.
      </p>

      <div className="about-card-grid">
        {[
          ['Our mission', 'To make high-quality digital skills accessible to learners and working professionals.'],
          ['Our approach', 'Project-based training, mentors, and feedback loops that prepare learners for real jobs.'],
          ['Our promise', 'Career-focused education with consistent support at every stage of the journey.'],
        ].map(([title, body]) => (
          <div key={title} className="about-card">
            <h2>{title}</h2>
            <p>{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CoursesPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseError, setCourseError] = useState('');

  useEffect(() => {
    listCourses()
      .then((response) => setCourses(normalizeList<CourseItem>(response.data)))
      .catch(() => {
        setCourseError('We could not load the course catalog. Please try again later.');
        setCourses([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="courses-page">
      <div className="courses-page-heading">
        <p className="page-eyebrow">Learn. Build. Grow.</p>
        <h1>Explore our courses</h1>
        <p>Compare programs, browse each course syllabus, and find the right track for your goals.</p>
      </div>
      {loading ? (
        <div className="syllabus-course-grid">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="syllabus-course-skeleton" aria-label="Loading course" />)}
        </div>
      ) : courseError ? (
        <p className="syllabus-catalog-message" role="alert">{courseError}</p>
      ) : courses.length ? (
        <div className="syllabus-course-grid">
          {courses.map((course) => <CourseCard key={course.id} course={course} />)}
        </div>
      ) : (
        <p className="syllabus-catalog-message">No courses are available right now. Please check back soon.</p>
      )}
    </div>
  );
}

function ContactPage() {
  const [searchParams] = useSearchParams();
  const selectedCourse = searchParams.get('course') || '';
  const initialMessage = searchParams.get('message') || '';
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    email: '',
    interested_course: selectedCourse,
    message: initialMessage,
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await createPublicEnquiry({
        name: form.name,
        mobile: form.mobile,
        email: form.email,
        interested_course: form.interested_course,
        message: form.message,
      });
      setSubmitted(true);
      setForm({ name: '', mobile: '', email: '', interested_course: '', message: '' });
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Unable to send your enquiry right now.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="public-info-page public-contact-page">
      <p className="page-eyebrow">We’re here to help</p>
      <h1>Contact &amp; Enrolment</h1>
      <p className="public-info-intro">Tell us what you want to learn. Our admissions team will help you find the right next step.</p>
      <div className="public-contact-grid">
        <div className="contact-information">
          <p className="contact-card-eyebrow">Start a conversation</p>
          <h2>Talk to our admissions team</h2>
          <p>Get guidance on programs, schedules, and the enrolment process.</p>
          <ul className="mt-6 space-y-4 text-slate-200">
            <li><MapPin size={16} aria-hidden="true" /> Lakshmi Puram Circle, Tirupati, Andhra Pradesh</li>
            <li>📞 +91 9550579055</li>
            <li>✉️ ksr95505@gmail.com</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="public-contact-form">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Full name
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-600"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Phone
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-600"
                value={form.mobile}
                onChange={(event) => setForm({ ...form, mobile: event.target.value })}
                required
              />
            </label>
          </div>
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-600"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </label>
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Course interest
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-600"
              value={form.interested_course}
              onChange={(event) => setForm({ ...form, interested_course: event.target.value })}
            />
          </label>
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Message
            <textarea
              className="mt-1 min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-600"
              value={form.message}
              onChange={(event) => setForm({ ...form, message: event.target.value })}
            />
          </label>

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

          <button type="submit" disabled={loading} className="mt-6 w-full rounded-lg bg-brand-700 px-4 py-3 font-semibold text-white hover:bg-brand-800 disabled:opacity-70">
            {loading ? 'Sending enquiry...' : 'Send enquiry'}
          </button>

          {submitted ? <p className="mt-4 text-sm text-green-600">Your enquiry has been recorded. Our team will contact you soon.</p> : null}
        </form>
      </div>
      <section className="contact-map-section" aria-labelledby="contact-map-title">
        <div className="contact-map-heading">
          <div>
            <p className="contact-card-eyebrow">Find us in Tirupati</p>
            <h2 id="contact-map-title">Visit us at Lakshmi Puram Circle</h2>
            <p>Lakshmi Puram Circle, Tirupati, Andhra Pradesh</p>
          </div>
          <a
            href="https://www.google.com/maps/search/lakshmi+puram+circle/@13.6198718,79.4219996,15.19z?entry=ttu&g_ep=EgoyMDI2MTAyOC4wIKXMDSoASAFQAw%3D%3D"
            target="_blank"
            rel="noreferrer"
            className="contact-map-directions"
          >
            Open directions <ExternalLink size={15} aria-hidden="true" />
          </a>
        </div>
        <iframe
          className="contact-map-frame"
          title="Google Map showing Lakshmi Puram Circle in Tirupati"
          src="https://www.google.com/maps?q=Lakshmi+Puram+Circle,+Tirupati,+Andhra+Pradesh&output=embed"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </section>
    </div>
  );
}

function AdminDashboardPage() {
  const [summary, setSummary] = useState<SummaryItem | null>(null);
  const firstName = getAuthSession()?.full_name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    getDashboardSummary()
      .then((response) => setSummary(response.data))
      .catch(() => setSummary(null));
  }, []);

  const stats = [
    { label: 'Total students', value: summary?.total_students ?? 0, icon: Users, tone: 'blue' },
    { label: 'Active batches', value: summary?.active_batches ?? 0, icon: BookOpen, tone: 'green' },
    { label: 'New leads', value: summary?.new_leads ?? 0, icon: UserRoundPlus, tone: 'orange' },
    { label: 'Enrolments', value: summary?.total_enrolments ?? 0, icon: GraduationCap, tone: 'purple' },
  ];
  const courses = summary?.course_breakdown ?? [];
  const highestCourseCount = Math.max(1, ...courses.map((course) => course.student_count));

  return (
    <div className="admin-dashboard">
      <div className="page-heading">
        <div>
          <p className="page-eyebrow">Operations</p>
          <h1>{greeting}, {firstName}</h1>
          <p className="page-subtitle">Here&apos;s what&apos;s happening at {instituteName} today.</p>
        </div>
        <NavLink to={routes.admin.leads} className="admin-dashboard-cta">
          <UserRoundPlus size={16} /> New enquiries
        </NavLink>
      </div>

      <div className="dashboard-stats">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <article key={label} className="metric-card">
            <div className="metric-top">
              <span>{label}</span>
              <span className={`metric-icon ${tone}`}><Icon size={17} /></span>
            </div>
            <p className="metric-value">{value.toLocaleString()}</p>
            <div className="metric-caption"><ArrowDownRight size={13} /> From current institute records</div>
          </article>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <div><h2>Enrolment by course</h2><p>Current students across your course catalog</p></div>
            <NavLink to={routes.admin.reports} className="panel-link">Reports <ArrowRight size={13} /></NavLink>
          </div>
          <div className="course-bars">
            {courses.length ? courses.slice(0, 6).map((course) => (
              <div key={course.code} className="course-bar-row">
                <span className="course-bar-title">{course.code}</span>
                <div className="course-bar-track" role="progressbar" aria-label={`${course.code} students`} aria-valuenow={course.student_count} aria-valuemin={0} aria-valuemax={highestCourseCount}>
                  <div className="course-bar-fill" style={{ width: `${(course.student_count / highestCourseCount) * 100}%` }} />
                </div>
                <span className="course-bar-value">{course.student_count}</span>
              </div>
            )) : <p className="empty-state">Course enrolment data will appear here when available.</p>}
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div><h2>At a glance</h2><p>A quick snapshot of your operations</p></div>
            <span className="metric-icon blue"><Layers3 size={17} /></span>
          </div>
          <div className="operation-list">
            {[
              { label: 'Courses available', value: summary?.total_courses ?? 0, icon: BookOpen },
              { label: 'Students enrolled', value: summary?.total_students ?? 0, icon: GraduationCap },
              { label: 'Active learning groups', value: summary?.active_batches ?? 0, icon: Users },
              { label: 'Enquiries to follow up', value: summary?.new_leads ?? 0, icon: Clock3 },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="operation-row">
                <span className="operation-label"><Icon size={15} />{label}</span>
                <span className="operation-value">{value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="quick-actions">
        <NavLink to={routes.admin.students} className="quick-action">
          <span className="quick-action-icon"><GraduationCap size={17} /></span>
          <span><strong>Manage students</strong><span>Review student records</span></span>
          <ArrowRight size={14} className="ml-auto text-slate-400" />
        </NavLink>
        <NavLink to={routes.admin.batches} className="quick-action">
          <span className="quick-action-icon"><CalendarDays size={17} /></span>
          <span><strong>Manage batches</strong><span>View groups and schedules</span></span>
          <ArrowRight size={14} className="ml-auto text-slate-400" />
        </NavLink>
        <NavLink to={routes.admin.leads} className="quick-action">
          <span className="quick-action-icon"><UserRoundPlus size={17} /></span>
          <span><strong>Follow up leads</strong><span>Stay on top of enquiries</span></span>
          <ArrowRight size={14} className="ml-auto text-slate-400" />
        </NavLink>
      </div>
    </div>
  );
}

function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [actionMenuStudentId, setActionMenuStudentId] = useState<number | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editCity, setEditCity] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const isAdmin = getAuthSession()?.role === 'ADMIN';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [collegeFilter, setCollegeFilter] = useState('ALL');

  useEffect(() => {
    if (actionMenuStudentId === null) return undefined;

    function closeActionMenu(event: MouseEvent | KeyboardEvent) {
      if (event instanceof KeyboardEvent && event.key === 'Escape') {
        setActionMenuStudentId(null);
      } else if (event instanceof MouseEvent && !actionMenuRef.current?.contains(event.target as Node)) {
        setActionMenuStudentId(null);
      }
    }

    document.addEventListener('pointerdown', closeActionMenu);
    document.addEventListener('keydown', closeActionMenu);
    return () => {
      document.removeEventListener('pointerdown', closeActionMenu);
      document.removeEventListener('keydown', closeActionMenu);
    };
  }, [actionMenuStudentId]);

  const colleges = useMemo(
    () => [...new Set(students.map(({ college }) => college?.trim()).filter((college): college is string => Boolean(college)))].sort(),
    [students],
  );
  const visibleStudents = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return students.filter((student) => {
      const isArchived = student.status === 'ARCHIVED';
      const studentStatus = isArchived
        ? 'ARCHIVED'
        : !student.email_verified
          ? 'PENDING'
          : student.is_active
            ? 'ACTIVE'
            : 'BLOCKED';
      const matchesSearch = !query
        || `${student.full_name} ${student.email} ${student.student_code} ${student.college ?? ''}`
          .toLocaleLowerCase()
          .includes(query);
      const matchesStatus = statusFilter === 'ALL'
        ? !isArchived
        : statusFilter === studentStatus;
      const matchesCollege = collegeFilter === 'ALL' || student.college === collegeFilter;
      return matchesSearch && matchesStatus && matchesCollege;
    });
  }, [collegeFilter, search, statusFilter, students]);

  function exportStudents() {
    const rows = [
      ['Student', 'Email', 'Student ID', 'College', 'Branch', 'Joined', 'Status'],
      ...visibleStudents.map((student) => [
        student.full_name,
        student.email,
        student.student_code,
        student.college ?? '',
        student.branch ?? '',
        student.created_at ?? '',
        student.status,
      ]),
    ];
    const csv = rows.map((row) => row.map((field) => `"${field.replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'students.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    listStudents()
      .then((response) => {
        setStudents(normalizeList<StudentItem>(response.data));
        setError('');
      })
      .catch((requestError: unknown) => {
        setError(apiErrorMessage(requestError, 'Unable to load students. Please try again.'));
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleCreateStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const { data } = await createStudent({
        full_name: fullName.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        password,
      });
      setStudents((current) => [...current, data]);
      setFullName('');
      setEmail('');
      setMobile('');
      setPassword('');
      setFormOpen(false);
    } catch (requestError: unknown) {
      setFormError(apiErrorMessage(requestError, 'Unable to add this student. Please check the details and try again.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleArchiveStudent(student: StudentItem) {
    if (!window.confirm(`Delete ${student.full_name || student.email}? Their account will be disabled, while historical records are retained.`)) return;
    setError('');
    try {
      await archiveStudent(student.id);
      setStudents((current) => current.filter(({ id }) => id !== student.id));
    } catch (requestError: unknown) {
      setError(apiErrorMessage(requestError, 'Unable to archive this student. Please try again.'));
    }
  }

  function startEditingStudent(student: StudentItem) {
    setEditingStudent(student);
    setEditFullName(student.full_name);
    setEditEmail(student.email);
    setEditMobile(student.mobile);
    setEditCity(student.city ?? '');
    setFormError('');
  }

  async function handleUpdateStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingStudent) return;
    setSavingEdit(true);
    setError('');
    try {
      const { data } = await updateStudent(editingStudent.id, {
        full_name: editFullName.trim(),
        email: editEmail.trim(),
        mobile: editMobile.trim(),
        city: editCity.trim(),
      });
      setStudents((current) => current.map((student) => student.id === data.id ? data : student));
      setEditingStudent(null);
    } catch (requestError: unknown) {
      setError(apiErrorMessage(requestError, 'Unable to save student changes. Please check the details and try again.'));
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleToggleStudent(student: StudentItem) {
    const shouldActivate = !student.is_active;
    const action = shouldActivate ? 'activate' : 'block';
    const emailNotice = shouldActivate && !student.email_verified
      ? ' This will also confirm their email address.'
      : '';
    if (!window.confirm(`${shouldActivate ? 'Activate' : 'Block'} ${student.full_name || student.email}?${emailNotice}`)) return;
    setError('');
    try {
      const { data } = await updateStudent(student.id, { is_active: shouldActivate });
      setStudents((current) => current.map((item) => item.id === data.id ? data : item));
    } catch (requestError: unknown) {
      setError(apiErrorMessage(requestError, `Unable to ${action} this student. Please try again.`));
    }
  }

  return (
    <div className="admin-students-page">
      <div className="student-page-heading">
        <div>
          <p className="student-page-eyebrow">Admissions</p>
          <h1>Students</h1>
          <p>Register admitted students and view student records.</p>
        </div>
        <div className="student-page-actions">
          <button type="button" className="student-export-button" onClick={exportStudents}>
            <Download size={16} /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => { setFormOpen((open) => !open); setFormError(''); }}
            className="student-register-button"
          >
            <UserRoundPlus size={16} /> Register student
          </button>
        </div>
      </div>

      {formOpen ? (
        <form onSubmit={(event) => { void handleCreateStudent(event); }} className="student-edit-form grid gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:grid-cols-2">
          <h2 className="text-lg font-semibold text-slate-900 sm:col-span-2">New student account</h2>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Full name
            <input required maxLength={255} autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="min-h-10 rounded-lg border border-slate-300 px-3 font-normal" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Email address
            <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-10 rounded-lg border border-slate-300 px-3 font-normal" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Mobile number
            <input required type="tel" maxLength={20} autoComplete="tel" value={mobile} onChange={(event) => setMobile(event.target.value)} className="min-h-10 rounded-lg border border-slate-300 px-3 font-normal" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Temporary password
            <input required type="password" minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-10 rounded-lg border border-slate-300 px-3 font-normal" />
          </label>
          <p className="text-xs leading-5 text-slate-500 sm:col-span-2">The student can sign in with this password and change it later. Share it with them securely.</p>
          {formError ? <p role="alert" className="text-sm text-red-600 sm:col-span-2">{formError}</p> : null}
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />}
              {saving ? 'Adding...' : 'Create student'}
            </button>
            <button type="button" disabled={saving} onClick={() => setFormOpen(false)} className="min-h-10 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {editingStudent ? (
        <form onSubmit={(event) => { void handleUpdateStudent(event); }} className="student-edit-form grid gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900">Edit student</h2>
            <p className="mt-1 text-xs text-slate-500">{editingStudent.student_code}</p>
          </div>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Full name
            <input required maxLength={255} autoComplete="name" value={editFullName} onChange={(event) => setEditFullName(event.target.value)} className="min-h-10 rounded-lg border border-slate-300 px-3 font-normal" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Email address
            <input required type="email" autoComplete="email" value={editEmail} onChange={(event) => setEditEmail(event.target.value)} className="min-h-10 rounded-lg border border-slate-300 px-3 font-normal" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Mobile number
            <input type="tel" maxLength={20} autoComplete="tel" value={editMobile} onChange={(event) => setEditMobile(event.target.value)} className="min-h-10 rounded-lg border border-slate-300 px-3 font-normal" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            City
            <input maxLength={100} autoComplete="address-level2" value={editCity} onChange={(event) => setEditCity(event.target.value)} className="min-h-10 rounded-lg border border-slate-300 px-3 font-normal" />
          </label>
          {error ? <p role="alert" className="text-sm text-red-600 sm:col-span-2">{error}</p> : null}
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={savingEdit} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {savingEdit ? <LoaderCircle size={16} className="animate-spin" /> : <Pencil size={15} />}
              {savingEdit ? 'Saving...' : 'Save changes'}
            </button>
            <button type="button" disabled={savingEdit} onClick={() => setEditingStudent(null)} className="min-h-10 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="student-filters">
        <label className="student-search">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            aria-label="Search students"
            placeholder="Search by name, email or college"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label className="student-filter-select">
          <span className="sr-only">Filter students by account status</span>
          <select aria-label="Filter students by account status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="ALL">All (excl. archived)</option>
            <option value="ACTIVE">Active</option>
            <option value="BLOCKED">Blocked</option>
            <option value="PENDING">Pending verification</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>
        <label className="student-filter-select">
          <span className="sr-only">Filter students by college</span>
          <select aria-label="Filter students by college" value={collegeFilter} onChange={(event) => setCollegeFilter(event.target.value)}>
            <option value="ALL">All colleges</option>
            {colleges.map((college) => <option key={college} value={college}>{college}</option>)}
          </select>
        </label>
      </div>

      {error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <div className="student-table-wrap">
        <table className="student-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>College</th>
              <th>Student ID</th>
              <th>Joined</th>
              <th>Status</th>
              {isAdmin ? <th>Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="student-table-message" colSpan={isAdmin ? 6 : 5}>Loading students...</td></tr>
            ) : error && students.length === 0 ? (
              <tr><td className="student-table-message" colSpan={isAdmin ? 6 : 5}>Student list is unavailable.</td></tr>
            ) : visibleStudents.length === 0 ? (
              <tr><td className="student-table-message" colSpan={isAdmin ? 6 : 5}>No students match these filters.</td></tr>
            ) : (
              visibleStudents.map((student) => (
                <tr key={student.id}>
                  <td>
                    <strong>{student.full_name || student.student_code}</strong>
                    <small>{student.email}</small>
                  </td>
                  <td>
                    <strong>{student.college || '—'}</strong>
                    {student.branch ? <small>{student.branch}</small> : null}
                  </td>
                  <td className="student-id-cell">{student.student_code}</td>
                  <td className="student-date-cell">
                    {student.created_at
                      ? new Date(student.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                  <td>
                    <span className={`student-status ${
                      student.status === 'ARCHIVED'
                        ? 'archived'
                        : !student.email_verified
                          ? 'pending'
                          : student.is_active
                            ? 'active'
                            : 'blocked'
                    }`}>
                      <i />
                      {student.status === 'ARCHIVED'
                        ? 'Archived'
                        : !student.email_verified
                          ? 'Pending'
                          : student.is_active
                            ? student.status === 'ACTIVE' ? 'Active' : student.status
                            : 'Blocked'}
                    </span>
                  </td>
                  {isAdmin ? (
                    <td className="student-actions-cell">
                      {student.status === 'ARCHIVED' ? (
                        <span>Archived</span>
                      ) : (
                        <div className="student-row-actions">
                          <div className="student-row-menu-wrap" ref={actionMenuStudentId === student.id ? actionMenuRef : null}>
                            <button
                              type="button"
                              aria-label={`More actions for ${student.full_name || student.email}`}
                              aria-haspopup="menu"
                              aria-expanded={actionMenuStudentId === student.id}
                              className="student-row-menu-trigger"
                              onClick={() => setActionMenuStudentId((current) => current === student.id ? null : student.id)}
                            >
                              <Ellipsis size={18} />
                            </button>
                            {actionMenuStudentId === student.id ? (
                              <div className="student-row-menu" role="menu" aria-label={`Actions for ${student.full_name || student.email}`}>
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => { setActionMenuStudentId(null); startEditingStudent(student); }}
                                  className="student-row-edit"
                                >
                                  <Pencil size={15} /> Edit
                                </button>
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => { setActionMenuStudentId(null); void handleToggleStudent(student); }}
                                  className={student.is_active ? 'student-row-block' : 'student-row-activate'}
                                >
                                  {student.is_active ? <ShieldBan size={15} /> : <ShieldCheck size={15} />}
                                  {student.is_active ? 'Block' : 'Activate'}
                                </button>
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => { setActionMenuStudentId(null); void handleArchiveStudent(student); }}
                                  className="student-row-delete"
                                >
                                  <Archive size={15} /> Archive
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminBatchesPage() {
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modeFilter, setModeFilter] = useState('ALL');
  const [slotFilter, setSlotFilter] = useState('ALL');
  const isCounsellor = getAuthSession()?.role === 'COUNSELLOR';

  const filteredBatches = useMemo(() => batches.filter((batch) => {
    const matchesMode = modeFilter === 'ALL' || batch.mode?.toUpperCase() === modeFilter;
    const weekend = /sat|sun|weekend/i.test(batch.class_days);
    const matchesSlot = slotFilter === 'ALL'
      || (slotFilter === 'WEEKENDS' ? weekend : !weekend);
    return matchesMode && matchesSlot;
  }), [batches, modeFilter, slotFilter]);

  useEffect(() => {
    listBatches()
      .then((response) => {
        setBatches(normalizeList<BatchItem>(response.data));
        setError('');
      })
      .catch(() => setError('Unable to load batches. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="admin-batches-page">
      <header className="admin-batches-heading">
        <div>
          <p className="admin-batches-eyebrow">ACADEMIC MANAGEMENT</p>
          <h1>Batches</h1>
          <p className="admin-batches-subtitle">Manage schedules, trainers, and seat availability.</p>
        </div>
        {isCounsellor && <span className="admin-batches-access">Read-only access</span>}
      </header>

      <div className="admin-batches-filters">
        <label>
          <span>Delivery mode</span>
          <select aria-label="Filter batches by delivery mode" value={modeFilter} onChange={(event) => setModeFilter(event.target.value)}>
            <option value="ALL">All modes</option>
            <option value="ONLINE">Online</option>
            <option value="OFFLINE">Offline</option>
            <option value="HYBRID">Hybrid</option>
          </select>
        </label>
        <label>
          <span>Class schedule</span>
          <select aria-label="Filter batches by schedule" value={slotFilter} onChange={(event) => setSlotFilter(event.target.value)}>
            <option value="ALL">All slots</option>
            <option value="WEEKDAYS">Weekdays</option>
            <option value="WEEKENDS">Weekends</option>
          </select>
        </label>
      </div>

      {error ? (
        <p className="admin-batches-message admin-batches-error" role="alert">{error}</p>
      ) : loading ? (
        <p className="admin-batches-message" role="status">Loading batches...</p>
      ) : filteredBatches.length === 0 ? (
        <p className="admin-batches-message">No batches match the selected filters.</p>
      ) : (
        <div className="admin-batches-grid">
          {filteredBatches.map((batch) => {
            const enrolled = batch.enrolled_students ?? 0;
            const capacity = Math.max(batch.max_students, 0);
            const fill = capacity ? Math.min((enrolled / capacity) * 100, 100) : 0;
            const status = batch.status.toUpperCase();
            const statusLabel = status === 'ACTIVE' ? 'Running'
              : status === 'UPCOMING' ? 'Upcoming'
                : status === 'COMPLETED' ? 'Completed'
                  : status === 'CANCELLED' ? 'Cancelled' : batch.status;
            const modeLabel = batch.mode
              ? `${batch.mode.charAt(0)}${batch.mode.slice(1).toLowerCase()}`
              : 'Mode not set';
            const startDate = new Date(`${batch.start_date}T00:00:00`);
            const formattedDate = Number.isNaN(startDate.getTime())
              ? batch.start_date
              : startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            const formatTime = (time: string) => {
              const [hours, minutes] = time.split(':').map(Number);
              if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return time;
              const period = hours >= 12 ? 'PM' : 'AM';
              return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${period}`;
            };

            return (
              <article className="admin-batch-card" key={batch.id}>
                <div className="admin-batch-card-top">
                  <span className="admin-batch-code">{batch.batch_code}</span>
                  <span className={`admin-batch-status is-${status.toLowerCase()}`}>{statusLabel}</span>
                </div>
                <h2>{batch.course_name || batch.name}</h2>
                {batch.course_name && <p className="admin-batch-name">{batch.name}</p>}

                <dl className="admin-batch-details">
                  <div>
                    <dt>Trainer</dt>
                    <dd>{batch.trainer_name || (batch.trainer ? `Trainer #${batch.trainer}` : 'Unassigned')}</dd>
                  </div>
                  <div>
                    <dt>Schedule</dt>
                    <dd>{batch.class_days} · {formatTime(batch.start_time)}–{formatTime(batch.end_time)}</dd>
                  </div>
                  <div>
                    <dt>Delivery</dt>
                    <dd>{modeLabel}</dd>
                  </div>
                  <div>
                    <dt>Starts</dt>
                    <dd>{formattedDate}</dd>
                  </div>
                </dl>

                <div className="admin-batch-capacity">
                  <div className="admin-batch-capacity-label">
                    <span>Seat availability</span>
                    <strong>{enrolled} / {capacity}</strong>
                  </div>
                  <div className="admin-batch-capacity-track" role="progressbar" aria-label={`${batch.name} seats filled`} aria-valuenow={Math.min(enrolled, capacity)} aria-valuemin={0} aria-valuemax={capacity}>
                    <span style={{ width: `${fill}%` }} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function AdminLeadsPage() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const statusTabs = [
    { value: 'ALL', label: 'All' },
    { value: 'NEW', label: 'New' },
    { value: 'CONTACTED', label: 'Contacted' },
    { value: 'DEMO_SCHEDULED', label: 'Demo Scheduled' },
    { value: 'CONVERTED', label: 'Converted' },
    { value: 'LOST', label: 'Lost' },
  ];
  const statusOptions = [
    { value: 'NEW', label: 'New' },
    { value: 'CONTACTED', label: 'Contacted' },
    { value: 'INTERESTED', label: 'Interested' },
    { value: 'COUNSELLING_SCHEDULED', label: 'Counselling Scheduled' },
    { value: 'DEMO_SCHEDULED', label: 'Demo Scheduled' },
    { value: 'DEMO_COMPLETED', label: 'Demo Completed' },
    { value: 'FOLLOW_UP', label: 'Follow Up' },
    { value: 'CONVERTED', label: 'Converted' },
    { value: 'NOT_INTERESTED', label: 'Not Interested' },
    { value: 'LOST', label: 'Lost' },
  ];

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return leads.filter((lead) => {
      const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter;
      const matchesSearch = !query
        || `${lead.name} ${lead.email ?? ''} ${lead.mobile ?? ''} ${lead.interested_course ?? ''} ${lead.source_name ?? ''}`
          .toLocaleLowerCase()
          .includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [leads, search, statusFilter]);

  useEffect(() => {
    listLeads()
      .then((response) => {
        setLeads(normalizeList<LeadItem>(response.data));
        setError('');
      })
      .catch((requestError: unknown) => {
        setError(apiErrorMessage(requestError, 'Unable to load enquiries. Please try again.'));
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleStatusChange(leadId: number, status: string) {
    setError('');
    try {
      await updateLead(leadId, { status });
      setLeads((current) => current.map((lead) => lead.id === leadId ? { ...lead, status } : lead));
    } catch (requestError: unknown) {
      setError(apiErrorMessage(requestError, 'Unable to update this enquiry. Please try again.'));
    }
  }

  async function handleConvert(lead: LeadItem) {
    if (!window.confirm(`Convert ${lead.name} into a student account?`)) return;
    setError('');
    try {
      await convertLead(lead.id);
      setLeads((current) => current.map((item) => item.id === lead.id ? { ...item, status: 'CONVERTED' } : item));
    } catch (requestError: unknown) {
      setError(apiErrorMessage(requestError, 'Unable to convert this enquiry. Please try again.'));
    }
  }

  function formatLeadDate(value?: string) {
    if (!value) return 'Date unavailable';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Date unavailable';
    return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function getStatusLabel(status: string) {
    return statusOptions.find((option) => option.value === status)?.label ?? status;
  }

  return (
    <div className="admin-leads-page">
      <header className="leads-page-heading">
        <p className="leads-page-eyebrow">Admissions</p>
        <h1>Leads &amp; enquiries</h1>
        <p>Track website enquiries, walk-ins and referrals from first contact to admission.</p>
      </header>

      {error ? <p className="leads-error" role="alert">{error}</p> : null}

      <div className="leads-toolbar">
        <div className="lead-status-tabs" role="group" aria-label="Filter leads by status">
          {statusTabs.map(({ value, label }) => {
            const count = value === 'ALL' ? leads.length : leads.filter((lead) => lead.status === value).length;
            return (
              <button
                type="button"
                key={value}
                className={`lead-status-tab${statusFilter === value ? ' selected' : ''}`}
                aria-pressed={statusFilter === value}
                onClick={() => setStatusFilter(value)}
              >
                {label} <span>{count}</span>
              </button>
            );
          })}
        </div>
        <label className="leads-search">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            aria-label="Search leads"
            placeholder="Search leads"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>

      {loading ? (
        <p className="leads-empty-state">Loading enquiries...</p>
      ) : filteredLeads.length === 0 ? (
        <p className="leads-empty-state">{leads.length ? 'No enquiries match your filters.' : 'No enquiries available yet.'}</p>
      ) : (
        <div className="leads-card-grid">
          {filteredLeads.map((lead) => (
            <article className="lead-card" key={lead.id}>
              <div className="lead-card-heading">
                <div className="lead-card-identity">
                  <h2>{lead.name}</h2>
                  <p>{formatLeadDate(lead.created_at)} · {lead.source_name || 'Direct'}</p>
                </div>
                <span className={`lead-status-badge ${lead.status.toLocaleLowerCase().replace(/_/g, '-')}`}>
                  <i />{getStatusLabel(lead.status)}
                </span>
              </div>

              <div className="lead-contact-details">
                {lead.mobile ? (
                  <a href={`tel:${lead.mobile}`}><Phone size={15} aria-hidden="true" />{lead.mobile}</a>
                ) : <span><Phone size={15} aria-hidden="true" />Phone unavailable</span>}
                {lead.email ? (
                  <a href={`mailto:${lead.email}`}><Mail size={15} aria-hidden="true" />{lead.email}</a>
                ) : <span><Mail size={15} aria-hidden="true" />Email unavailable</span>}
              </div>

              <p className="lead-course">
                <strong>{lead.interested_course || 'Course'}</strong>
                {lead.college_name ? <span> · {lead.college_name}</span> : null}
                {lead.branch ? <span> · {lead.branch}</span> : null}
              </p>
              {lead.message ? <p className="lead-message">“{lead.message}”</p> : null}

              <div className="lead-card-actions">
                <label className="lead-status-select">
                  <span className="sr-only">Update status for {lead.name}</span>
                  <select
                    aria-label={`Update status for ${lead.name}`}
                    value={lead.status}
                    onChange={(event) => { void handleStatusChange(lead.id, event.target.value); }}
                  >
                    {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <button
                  type="button"
                  className="lead-convert-button"
                  disabled={lead.status === 'CONVERTED'}
                  onClick={() => { void handleConvert(lead); }}
                >
                  <UserRoundPlus size={15} aria-hidden="true" />
                  {lead.status === 'CONVERTED' ? 'Converted' : 'Convert'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    function handleExpiredSession() {
      navigate(routes.login, { replace: true });
    }

    window.addEventListener('auth:session-expired', handleExpiredSession);
    return () => window.removeEventListener('auth:session-expired', handleExpiredSession);
  }, [navigate]);

  return (
      <Routes location={location}>
      <Route element={<PublicLayout />}>
        <Route path={routes.home} element={<HomePage />} />
        <Route path={routes.about} element={<AboutPage />} />
        <Route path={routes.courses} element={<CoursesPage />} />
        <Route path={routes.contact} element={<ContactPage />} />
        <Route path={routes.login} element={<LoginPage />} />
        <Route path={routes.register} element={<RegisterPage />} />
        <Route path={routes.verifyEmail} element={<VerifyEmailPage />} />
        <Route path={routes.forgotPassword} element={<ForgotPasswordPage />} />
      </Route>

      <Route
        path={routes.admin.dashboard}
        element={<ProtectedRoute allowedRoles={['ADMIN', 'COUNSELLOR']}><AdminLayout /></ProtectedRoute>}
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="students" element={<AdminStudentsPage />} />
        <Route path="batches" element={<AdminBatchesPage />} />
        <Route path="leads" element={<AdminLeadsPage />} />
        <Route path="courses" element={<AdminCoursesPage />} />
        <Route
          path="fees"
          element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminFeesPage /></ProtectedRoute>}
        />
        <Route
          path="reports"
          element={<ProtectedRoute allowedRoles={['ADMIN']}><Suspense fallback={<div className="admin-report-grid" aria-label="Loading analytics">{Array.from({ length: 4 }, (_, index) => <div className="report-chart-panel report-chart-skeleton" key={index} />)}</div>}><AdminReportsPage /></Suspense></ProtectedRoute>}
        />
      </Route>

      <Route
        path={routes.trainer.dashboard}
        element={<ProtectedRoute allowedRoles={['TRAINER']}><TrainerLayout /></ProtectedRoute>}
      >
        <Route index element={<Suspense fallback={<p className="trainer-attendance-empty">Loading trainer dashboard…</p>}><TrainerDashboardPage /></Suspense>} />
        <Route path="attendance" element={<Suspense fallback={<p className="trainer-attendance-empty">Loading attendance…</p>}><TrainerAttendancePage /></Suspense>} />
        <Route path="materials" element={<Suspense fallback={<p className="trainer-attendance-empty">Loading materials and assignments…</p>}><TrainerLearningPage /></Suspense>} />
      </Route>

      <Route
        path={routes.student.dashboard}
        element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentLayout /></ProtectedRoute>}
      >
        <Route index element={<Suspense fallback={<div className="student-dashboard-loading">Loading your learning dashboard…</div>}><StudentDashboardPage /></Suspense>} />
        <Route path="courses" element={<Suspense fallback={<p className="student-learning-empty">Loading your learning resources…</p>}><StudentLearningPage /></Suspense>} />
        <Route path="fees" element={<StudentFeesPage />} />
        <Route path="certificates" element={<Suspense fallback={<p className="student-certificates-empty">Loading your certificates…</p>}><StudentCertificatesPage /></Suspense>} />
      </Route>

      <Route path="*" element={<Navigate to={routes.home} replace />} />
      </Routes>
  );
}
