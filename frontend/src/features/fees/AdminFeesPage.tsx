import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { AlertTriangle, LockKeyhole, Search, Wallet } from 'lucide-react';
import { listCourses } from '../../api/courses';
import { listEnrolments, listInstalments, listPayments } from '../../api/fees';
import { listStudents } from '../../api/students';
import { formatPrice } from '../../lib/format';
import { normalizeList } from '../../lib/normalizeList';

type FeeEnrolment = {
  id: number;
  student: number;
  course: number;
  course_fee: number | string;
  final_fee: number | string;
};

type FeePayment = {
  id: number;
  enrolment: number;
  amount: number | string;
  status: string;
  payment_date: string;
  receipt_number?: string;
};

type FeeInstalment = {
  id: number;
  enrolment: number;
  amount: number | string;
  due_date: string;
  status: string;
};

type FeeStudent = {
  id: number;
  full_name: string;
  student_code: string;
};

type FeeCourse = {
  id: number;
  code: string;
};

type FeeRow = {
  enrolment: FeeEnrolment;
  student: FeeStudent | undefined;
  course: FeeCourse | undefined;
  payments: FeePayment[];
  instalments: FeeInstalment[];
  paid: number;
};

function getLoadError(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return 'Something went wrong while loading fee records. Please try again.';
  }
  if (!error.response) {
    return 'Unable to reach the fee service. Check that the backend is running, then retry.';
  }
  return `Fee records could not be loaded (HTTP ${error.response.status}).`;
}

function getInstalmentStatus(instalment: FeeInstalment) {
  if (instalment.status.toUpperCase() === 'PAID') return 'Paid';
  if (instalment.status.toUpperCase() === 'OVERDUE' || instalment.due_date < new Date().toISOString().slice(0, 10)) {
    return 'Overdue';
  }
  return 'Due';
}

export function AdminFeesPage() {
  const [enrolments, setEnrolments] = useState<FeeEnrolment[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [instalments, setInstalments] = useState<FeeInstalment[]>([]);
  const [students, setStudents] = useState<FeeStudent[]>([]);
  const [courses, setCourses] = useState<FeeCourse[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    Promise.all([
      listEnrolments(),
      listPayments(),
      listInstalments(),
      listStudents(),
      listCourses({ signal: controller.signal }),
    ])
      .then(([enrolmentResponse, paymentResponse, instalmentResponse, studentResponse, courseResponse]) => {
        if (controller.signal.aborted) return;
        setEnrolments(normalizeList<FeeEnrolment>(enrolmentResponse.data));
        setPayments(normalizeList<FeePayment>(paymentResponse.data));
        setInstalments(normalizeList<FeeInstalment>(instalmentResponse.data));
        setStudents(normalizeList<FeeStudent>(studentResponse.data));
        setCourses(normalizeList<FeeCourse>(courseResponse.data));
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        setError(getLoadError(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [retryCount]);

  const rows = useMemo<FeeRow[]>(() => enrolments.map((enrolment) => {
    const rowPayments = payments.filter((payment) => payment.enrolment === enrolment.id);
    return {
      enrolment,
      student: students.find((item) => item.id === enrolment.student),
      course: courses.find((item) => item.id === enrolment.course),
      payments: rowPayments,
      instalments: instalments
        .filter((instalment) => instalment.enrolment === enrolment.id)
        .sort((left, right) => left.due_date.localeCompare(right.due_date)),
      paid: rowPayments
        .filter((payment) => payment.status.toUpperCase() === 'SUCCESS')
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    };
  }), [courses, enrolments, instalments, payments, students]);

  const visibleRows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return rows;
    return rows.filter(({ student, course }) => (
      `${student?.full_name ?? ''} ${student?.student_code ?? ''} ${course?.code ?? ''}`
        .toLocaleLowerCase()
        .includes(query)
    ));
  }, [rows, search]);

  const collected = rows.reduce((sum, row) => sum + row.paid, 0);
  const outstanding = rows.reduce((sum, row) => (
    sum + Math.max(Number(row.enrolment.final_fee || 0) - row.paid, 0)
  ), 0);
  const overdueCount = instalments.filter((instalment) => getInstalmentStatus(instalment) === 'Overdue').length;

  return (
    <section className="admin-fees-page">
      <header className="admin-fees-heading">
        <p className="admin-fees-eyebrow">Finance · Admin only</p>
        <h1>Fees</h1>
        <p>Instalment plans and manually recorded payments.</p>
      </header>

      <div className="admin-fees-summary">
        <article className="admin-fee-metric">
          <div><span>Collected</span><Wallet className="collected-icon" size={40} /></div>
          <strong>{formatPrice(collected)}</strong>
        </article>
        <article className="admin-fee-metric">
          <div><span>Outstanding</span><Wallet className="outstanding-icon" size={40} /></div>
          <strong>{formatPrice(outstanding)}</strong>
        </article>
        <article className="admin-fee-metric">
          <div><span>Overdue instalments</span><AlertTriangle className="overdue-icon" size={40} /></div>
          <strong>{overdueCount}</strong>
        </article>
      </div>

      <div className="admin-fees-toolbar">
        <label className="admin-fees-search">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            aria-label="Search fee records by student"
            placeholder="Search student"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <span className="admin-fees-phase"><LockKeyhole size={13} /> Online payments (Razorpay) — Phase 2</span>
      </div>

      {error ? (
        <div className="admin-fees-message is-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setRetryCount((count) => count + 1)}>Try again</button>
        </div>
      ) : (
        <div className="admin-fees-table-wrap">
          <table className="admin-fees-table">
            <thead>
              <tr><th scope="col">Student</th><th scope="col">Total</th><th scope="col">Instalments</th><th scope="col">Paid</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="admin-fees-empty" colSpan={4} role="status">Loading fee records...</td></tr>
              ) : visibleRows.length ? (
                visibleRows.map(({ enrolment, student, course, instalments: rowInstalments, paid }) => {
                  const total = Number(enrolment.final_fee || 0);
                  const progress = total ? Math.min((paid / total) * 100, 100) : 0;
                  return (
                    <tr key={enrolment.id}>
                      <td>
                        <strong>{student?.full_name || `Student #${enrolment.student}`}</strong>
                        <small>{course?.code || 'Course'}</small>
                      </td>
                      <td>{formatPrice(total)}</td>
                      <td>
                        <div className="admin-fee-instalments">
                          {rowInstalments.length ? rowInstalments.map((instalment, index) => {
                            const status = getInstalmentStatus(instalment);
                            return (
                              <span className="admin-fee-instalment" key={instalment.id}>
                                <span>#{index + 1} · {formatPrice(instalment.amount)}</span>
                                <b className={`is-${status.toLocaleLowerCase()}`}><i />{status}</b>
                              </span>
                            );
                          }) : <span className="admin-fee-no-instalments">No instalments</span>}
                        </div>
                      </td>
                      <td>
                        <div className="admin-fee-paid-cell">
                          <span>{formatPrice(paid)}</span>
                          <div className="admin-fee-progress" role="progressbar" aria-label={`${student?.full_name || 'Student'} fees paid`} aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
                            <i style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td className="admin-fees-empty" colSpan={4}>
                  {rows.length ? 'No fee records match your search.' : 'No fee records are available.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
