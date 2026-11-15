import { useEffect, useMemo, useState } from 'react';
import { LockKeyhole, RotateCcw } from 'lucide-react';
import { listEnrolments, listInstalments, listPayments } from '../../api/fees';
import { apiErrorMessage } from '../auth/apiErrorMessage';
import { formatPrice } from '../../lib/format';
import { normalizeList } from '../../lib/normalizeList';

type StudentEnrolment = {
  id: number;
  final_fee: number | string;
};

type StudentPayment = {
  id: number;
  enrolment: number;
  amount: number | string;
  payment_date: string;
  status: string;
  mode: string;
  transaction_id?: string;
  receipt_number?: string;
};

type StudentInstalment = {
  id: number;
  enrolment: number;
  due_date: string;
  amount: number | string;
  status: string;
};

function formatDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
}

function getInstalmentStatus(instalment: StudentInstalment, today: string) {
  if (instalment.status.toUpperCase() === 'PAID') return 'Paid';
  if (instalment.status.toUpperCase() === 'OVERDUE' || instalment.due_date < today) return 'Overdue';
  return 'Due';
}

export function StudentFeesPage() {
  const [enrolments, setEnrolments] = useState<StudentEnrolment[]>([]);
  const [payments, setPayments] = useState<StudentPayment[]>([]);
  const [instalments, setInstalments] = useState<StudentInstalment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([listEnrolments(), listPayments(), listInstalments()])
      .then(([enrolmentResponse, paymentResponse, instalmentResponse]) => {
        if (!active) return;
        setEnrolments(normalizeList<StudentEnrolment>(enrolmentResponse.data));
        setPayments(normalizeList<StudentPayment>(paymentResponse.data));
        setInstalments(normalizeList<StudentInstalment>(instalmentResponse.data));
      })
      .catch((loadError: unknown) => {
        if (active) setError(apiErrorMessage(loadError, 'Could not load your fee records.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [retryKey]);

  const feeSummary = useMemo(() => {
    const enrolmentIds = new Set(enrolments.map((enrolment) => enrolment.id));
    const studentPayments = payments.filter((payment) => enrolmentIds.has(payment.enrolment));
    const successfulPayments = studentPayments.filter((payment) => payment.status.toUpperCase() === 'SUCCESS');
    const totalFee = enrolments.reduce((total, enrolment) => total + Number(enrolment.final_fee || 0), 0);
    const paid = successfulPayments.reduce((total, payment) => total + Number(payment.amount || 0), 0);
    const studentInstalments = instalments
      .filter((instalment) => enrolmentIds.has(instalment.enrolment))
      .sort((left, right) => left.due_date.localeCompare(right.due_date));
    return {
      studentPayments: [...studentPayments].sort((left, right) => right.payment_date.localeCompare(left.payment_date)),
      studentInstalments,
      totalFee,
      paid,
      balance: Math.max(totalFee - paid, 0),
      progress: totalFee > 0 ? Math.min((paid / totalFee) * 100, 100) : 0,
    };
  }, [enrolments, instalments, payments]);

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <section className="student-fees-page">
      <header className="student-fees-heading">
        <p className="student-eyebrow">STUDENT PORTAL</p>
        <h1>Fees</h1>
        <p>Your instalment plan and payment history.</p>
      </header>

      <div className="student-fees-notice">
        <span>YOUR RECORDS</span>
        <p>Fees and payments shown here are limited to your own enrolments.</p>
      </div>

      {error ? (
        <div className="student-fees-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setRetryKey((key) => key + 1)}><RotateCcw size={15} /> Try again</button>
        </div>
      ) : null}

      <article className="student-fees-summary" aria-label="Fee balance summary">
        <div className="student-fees-summary-values">
          <div>
            <span>Total course fee</span>
            <strong>{loading ? '—' : formatPrice(feeSummary.totalFee)}</strong>
          </div>
          <div className="student-fees-paid">
            <span>Paid so far</span>
            <strong>{loading ? '—' : formatPrice(feeSummary.paid)}</strong>
          </div>
        </div>
        <div
          className="student-fees-progress"
          role="progressbar"
          aria-label="Course fee paid"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(feeSummary.progress)}
        >
          <span style={{ width: `${feeSummary.progress}%` }} />
        </div>
        <p>Balance {loading ? '—' : formatPrice(feeSummary.balance)}</p>
      </article>

      <section className="student-fees-section" aria-labelledby="student-instalments-heading">
        <h2 id="student-instalments-heading">Instalment plan</h2>
        <div className="student-fees-table-wrap">
          <table className="student-fees-table" aria-labelledby="student-instalments-heading">
            <thead>
              <tr>
                <th scope="col">Instalment</th>
                <th scope="col">Amount</th>
                <th scope="col">Due date</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="student-fees-empty" colSpan={4} role="status">Loading your fee records…</td></tr>
              ) : error ? (
                <tr><td className="student-fees-empty" colSpan={4}>Fee records are unavailable.</td></tr>
              ) : feeSummary.studentInstalments.length ? (
                feeSummary.studentInstalments.map((instalment, index) => {
                  const status = getInstalmentStatus(instalment, todayKey);
                  return (
                    <tr key={instalment.id}>
                      <td>#{index + 1}</td>
                      <td>{formatPrice(instalment.amount)}</td>
                      <td>{formatDate(instalment.due_date)}</td>
                      <td><span className={`student-fee-status ${status.toLowerCase()}`}><i />{status}</span></td>
                    </tr>
                  );
                })
              ) : (
                <tr><td className="student-fees-empty" colSpan={4}>No instalment records are available yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="student-fees-section" aria-labelledby="student-payment-history-heading">
        <h2 id="student-payment-history-heading">Payment history</h2>
        <div className="student-fees-table-wrap">
          <table className="student-fees-table student-payment-table" aria-labelledby="student-payment-history-heading">
            <thead>
              <tr>
                <th scope="col">Paid on</th>
                <th scope="col">Amount</th>
                <th scope="col">Mode · Ref</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="student-fees-empty" colSpan={4} role="status">Loading your payment history…</td></tr>
              ) : error ? (
                <tr><td className="student-fees-empty" colSpan={4}>Payment history is unavailable.</td></tr>
              ) : feeSummary.studentPayments.length ? (
                feeSummary.studentPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{formatDate(payment.payment_date)}</td>
                    <td>{formatPrice(payment.amount)}</td>
                    <td>
                      <span className="student-fee-reference">
                        {payment.mode || '—'}
                        {payment.receipt_number || payment.transaction_id
                          ? ` · ${payment.receipt_number || payment.transaction_id}`
                          : ''}
                      </span>
                    </td>
                    <td>
                      <span className={`student-fee-status ${payment.status.toLowerCase()}`}>
                        <i />{payment.status === 'SUCCESS' ? 'Paid' : payment.status.toLowerCase()}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td className="student-fees-empty" colSpan={4}>No payment records are available yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="student-fees-payment-note"><LockKeyhole size={15} /> Pay at the institute desk by cash, UPI, bank transfer or cheque. Online payments are coming soon.</p>
    </section>
  );
}
