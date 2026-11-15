import { type ReactNode, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { listAttendance } from '../../api/attendance';
import { listBatches, listSessions } from '../../api/batches';
import { listCourses } from '../../api/courses';
import { listEnrolments, listPayments } from '../../api/fees';
import { formatPrice } from '../../lib/format';
import { normalizeList } from '../../lib/normalizeList';

type ReportCourse = {
  id: number;
  code: string;
  name: string;
};

type ReportEnrolment = {
  id: number;
  course: number;
  batch: number;
  final_fee: number | string;
  status: string;
};

type ReportPayment = {
  id: number;
  enrolment: number;
  amount: number | string;
  status: string;
};

type ReportBatch = {
  id: number;
  batch_code: string;
  course: number;
  status: string;
  trainer_name?: string;
};

type ReportSession = {
  id: number;
  batch: number;
  date: string;
};

type ReportAttendance = {
  id: number;
  session: number;
  status: string;
};

type CourseRevenue = {
  code: string;
  name: string;
  collected: number;
  outstanding: number;
  enrolments: number;
};

type AttendancePoint = {
  week: string;
  date: string;
  percentage: number | null;
  attended: number;
  records: number;
};

type AttendanceSeries = {
  code: string;
  points: AttendancePoint[];
};

type TrainerLoad = {
  name: string;
  batches: number;
  students: number;
  batchCodes: string[];
};

type ChartTooltipDetail = {
  label: string;
  value: string;
  color?: string;
};

type ChartTooltipState = {
  left: number;
  top: number;
  placement: 'above' | 'below';
  title: string;
  details: ChartTooltipDetail[];
};

const chartColors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

function formatCompact(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 ? 1 : 0)}m`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value % 1_000 ? 1 : 0)}k`;
  return String(Math.round(value));
}

function getRevenueAxisMax(maxValue: number) {
  const rawStep = maxValue / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const scaledStep = rawStep / magnitude;
  const niceStep = scaledStep <= 1 ? 1 : scaledStep <= 2 ? 2 : scaledStep <= 2.5 ? 2.5 : scaledStep <= 5 ? 5 : 10;
  return niceStep * magnitude * 4;
}

function getLoadError(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return 'Something went wrong while loading reports. Please try again.';
  }
  if (!error.response) {
    return 'Unable to reach the reporting services. Check that the backend is running, then retry.';
  }
  return `Reports could not be loaded (HTTP ${error.response.status}).`;
}

function useChartTooltip() {
  const [tooltip, setTooltip] = useState<ChartTooltipState | null>(null);

  function showTooltip(element: SVGElement, title: string, details: ChartTooltipDetail[]) {
    const surface = element.closest('.report-chart-content');
    if (!surface) return;
    const surfaceRect = surface.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const left = elementRect.left + elementRect.width / 2 - surfaceRect.left;
    const top = elementRect.top - surfaceRect.top;
    const maxLeft = Math.max(110, surfaceRect.width - 110);
    setTooltip({
      left: Math.min(maxLeft, Math.max(110, left)),
      top: top < 95 ? elementRect.bottom - surfaceRect.top : top,
      placement: top < 95 ? 'below' : 'above',
      title,
      details,
    });
  }

  const tooltipElement = tooltip ? (
    <div
      className={`report-chart-tooltip is-${tooltip.placement}`}
      style={{ left: tooltip.left, top: tooltip.top }}
      role="status"
      aria-live="polite"
    >
      <strong>{tooltip.title}</strong>
      {tooltip.details.map((detail) => (
        <span key={detail.label}>
          <i style={detail.color ? { backgroundColor: detail.color } : undefined} />
          <span>{detail.label}</span>
          <b>{detail.value}</b>
        </span>
      ))}
    </div>
  ) : null;

  return {
    showTooltip,
    hideTooltip: () => setTooltip(null),
    tooltipElement,
  };
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}

function buildRevenue(
  courses: ReportCourse[],
  enrolments: ReportEnrolment[],
  payments: ReportPayment[],
): CourseRevenue[] {
  return courses.map((course) => {
    const courseEnrolments = enrolments.filter((enrolment) => enrolment.course === course.id);
    const paidAmounts = courseEnrolments.map((enrolment) => {
      const collectedForEnrolment = payments
        .filter((payment) => payment.enrolment === enrolment.id && payment.status.toUpperCase() === 'SUCCESS')
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      return { enrolment, collected: collectedForEnrolment };
    });
    const collected = paidAmounts.reduce((sum, item) => sum + item.collected, 0);
    const outstanding = paidAmounts.reduce((sum, item) => (
      sum + Math.max(Number(item.enrolment.final_fee || 0) - item.collected, 0)
    ), 0);
    return { code: course.code, name: course.name, collected, outstanding, enrolments: courseEnrolments.length };
  });
}

function buildAttendanceSeries(
  courses: ReportCourse[],
  batches: ReportBatch[],
  sessions: ReportSession[],
  attendance: ReportAttendance[],
  now: Date,
): AttendanceSeries[] {
  const weekStarts = Array.from({ length: 6 }, (_, index) => {
    const start = startOfWeek(now);
    start.setDate(start.getDate() - (5 - index) * 7);
    return start;
  });
  const batchById = new Map(batches.map((batch) => [batch.id, batch]));
  const sessionById = new Map(sessions.map((session) => [session.id, session]));

  return courses.map((course) => ({
    code: course.code,
    points: weekStarts.map((weekStart, index) => {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const sessionIds = new Set(sessions.filter((session) => {
        const batch = batchById.get(session.batch);
        const sessionDate = new Date(`${session.date}T00:00:00`);
        return batch?.course === course.id && sessionDate >= weekStart && sessionDate < weekEnd;
      }).map((session) => session.id));
      const records = attendance.filter((record) => {
        const session = sessionById.get(record.session);
        return Boolean(session && sessionIds.has(session.id));
      }).filter((record) => record.status.toUpperCase() !== 'EXCUSED');
      const attended = records.filter((record) => ['PRESENT', 'LATE'].includes(record.status.toUpperCase())).length;

      return {
        week: `W${index + 1}`,
        date: weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        percentage: records.length ? (attended / records.length) * 100 : null,
        attended,
        records: records.length,
      };
    }),
  }));
}

function buildTrainerLoad(batches: ReportBatch[], enrolments: ReportEnrolment[]): TrainerLoad[] {
  const activeBatches = batches.filter((batch) => batch.status.toUpperCase() === 'ACTIVE');
  const activeBatchIds = new Set(activeBatches.map((batch) => batch.id));
  const studentsByBatch = new Map<number, number>();
  enrolments.forEach((enrolment) => {
    if (enrolment.status.toUpperCase() === 'ACTIVE' && activeBatchIds.has(enrolment.batch)) {
      studentsByBatch.set(enrolment.batch, (studentsByBatch.get(enrolment.batch) ?? 0) + 1);
    }
  });
  return Array.from(
    activeBatches.reduce((trainers, batch) => {
      const name = batch.trainer_name || 'Unassigned';
      const load = trainers.get(name) ?? { name, batches: 0, students: 0, batchCodes: [] };
      load.batches += 1;
      load.students += studentsByBatch.get(batch.id) ?? 0;
      load.batchCodes.push(batch.batch_code);
      trainers.set(name, load);
      return trainers;
    }, new Map<string, TrainerLoad>()).values(),
  ).sort((left, right) => right.students - left.students);
}

function ChartPanel({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`report-chart-panel ${className}`}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function RevenueChart({ data }: { data: CourseRevenue[] }) {
  const tooltip = useChartTooltip();
  const width = 620;
  const height = 270;
  const plot = { left: 50, top: 16, right: 12, bottom: 45 };
  const plotWidth = width - plot.left - plot.right;
  const plotHeight = height - plot.top - plot.bottom;
  const maxValue = Math.max(1, ...data.map((item) => item.collected + item.outstanding));
  const axisMax = getRevenueAxisMax(maxValue);
  const ticks = [0, 1, 2, 3, 4].map((step) => (axisMax * step) / 4);
  const groupWidth = data.length ? plotWidth / data.length : plotWidth;
  const barWidth = Math.min(80, groupWidth * 0.62);

  return data.length ? (
    <div className="report-chart-content">
      <svg className="report-chart-svg" viewBox={`0 0 ${width} ${height}`} role="group" aria-label="Collected and outstanding fees by course">
        {ticks.map((tick) => {
          const y = plot.top + plotHeight - (tick / axisMax) * plotHeight;
          return (
            <g key={tick}>
              <line className="report-grid-line" x1={plot.left} y1={y} x2={width - plot.right} y2={y} />
              <text className="report-axis-label" x={plot.left - 8} y={y + 4} textAnchor="end">{formatCompact(tick)}</text>
            </g>
          );
        })}
        {data.map((item, index) => {
          const x = plot.left + groupWidth * index + (groupWidth - barWidth) / 2;
          const collectedHeight = (item.collected / axisMax) * plotHeight;
          const outstandingHeight = (item.outstanding / axisMax) * plotHeight;
          const baseline = plot.top + plotHeight;
          return (
            <g
              key={item.code}
              className="report-chart-interactive"
              role="group"
              tabIndex={0}
              aria-label={`${item.code} revenue details`}
              onMouseEnter={(event) => tooltip.showTooltip(event.currentTarget, item.name, [
                { label: 'Collected', value: formatPrice(item.collected), color: '#10b981' },
                { label: 'Pending', value: formatPrice(item.outstanding), color: '#f59e0b' },
                { label: 'Total enrolled', value: String(item.enrolments) },
              ])}
              onFocus={(event) => tooltip.showTooltip(event.currentTarget, item.name, [
                { label: 'Collected', value: formatPrice(item.collected), color: '#10b981' },
                { label: 'Pending', value: formatPrice(item.outstanding), color: '#f59e0b' },
                { label: 'Total enrolled', value: String(item.enrolments) },
              ])}
              onMouseLeave={tooltip.hideTooltip}
              onBlur={tooltip.hideTooltip}
            >
              <rect x={x} y={baseline - collectedHeight} width={barWidth} height={collectedHeight} rx="5" fill="#10b981">
                <title>{`${item.name}: collected ${formatPrice(item.collected)}`}</title>
              </rect>
              <rect x={x} y={baseline - collectedHeight - outstandingHeight} width={barWidth} height={outstandingHeight} rx="5" fill="#f59e0b">
                <title>{`${item.name}: outstanding ${formatPrice(item.outstanding)}`}</title>
              </rect>
              <text className="report-axis-label" x={x + barWidth / 2} y={baseline + 22} textAnchor="middle">{item.code}</text>
            </g>
          );
        })}
      </svg>
      <div className="report-chart-legend">
        <span><i className="legend-collected" />Collected</span>
        <span><i className="legend-outstanding" />Outstanding</span>
      </div>
      {tooltip.tooltipElement}
    </div>
  ) : <p className="report-chart-empty">No course data available yet.</p>;
}

function AttendanceChart({ series }: { series: AttendanceSeries[] }) {
  const tooltip = useChartTooltip();
  const width = 620;
  const height = 270;
  const plot = { left: 43, top: 16, right: 12, bottom: 42 };
  const plotWidth = width - plot.left - plot.right;
  const plotHeight = height - plot.top - plot.bottom;
  const ticks = [0, 25, 50, 75, 100];
  const weekLabels = series[0]?.points ?? [];
  const x = (index: number) => plot.left + (index / Math.max(weekLabels.length - 1, 1)) * plotWidth;
  const y = (percentage: number) => plot.top + (1 - percentage / 100) * plotHeight;

  return series.some((item) => item.points.some((point) => point.percentage !== null)) ? (
    <div className="report-chart-content">
      <svg className="report-chart-svg" viewBox={`0 0 ${width} ${height}`} role="group" aria-label="Weekly attendance percentage by course">
        {ticks.map((tick) => {
          const lineY = y(tick);
          return (
            <g key={tick}>
              <line className="report-grid-line" x1={plot.left} y1={lineY} x2={width - plot.right} y2={lineY} />
              <text className="report-axis-label" x={plot.left - 8} y={lineY + 4} textAnchor="end">{tick}%</text>
            </g>
          );
        })}
        {weekLabels.map((point, index) => (
          <text className="report-axis-label" key={point.week} x={x(index)} y={height - 13} textAnchor="middle">{point.week}</text>
        ))}
        {series.map((item, seriesIndex) => {
          const segments: string[][] = [];
          let currentSegment: string[] = [];
          item.points.forEach((point, index) => {
            if (point.percentage === null) {
              if (currentSegment.length) segments.push(currentSegment);
              currentSegment = [];
              return;
            }
            currentSegment.push(`${x(index)},${y(point.percentage)}`);
          });
          if (currentSegment.length) segments.push(currentSegment);
          const color = chartColors[seriesIndex % chartColors.length];
          return (
            <g key={item.code}>
              {segments.map((points, index) => points.length > 1 ? (
                <polyline className="report-attendance-line" key={index} points={points.join(' ')} stroke={color} />
              ) : null)}
              {item.points.map((point, index) => point.percentage === null ? null : (
                <circle
                  key={point.week}
                  className="report-chart-point"
                  cx={x(index)}
                  cy={y(point.percentage)}
                  r="4.5"
                  fill={color}
                  role="img"
                  tabIndex={0}
                  aria-label={`${item.code}, ${point.date}: ${Math.round(point.percentage)} percent attendance`}
                  onMouseEnter={(event) => tooltip.showTooltip(event.currentTarget, `${item.code} · ${point.date}`, [
                    { label: 'Attendance', value: `${Math.round(point.percentage ?? 0)}%`, color },
                    { label: 'Present or late', value: String(point.attended) },
                    { label: 'Attendance records', value: String(point.records) },
                  ])}
                  onFocus={(event) => tooltip.showTooltip(event.currentTarget, `${item.code} · ${point.date}`, [
                    { label: 'Attendance', value: `${Math.round(point.percentage ?? 0)}%`, color },
                    { label: 'Present or late', value: String(point.attended) },
                    { label: 'Attendance records', value: String(point.records) },
                  ])}
                  onMouseLeave={tooltip.hideTooltip}
                  onBlur={tooltip.hideTooltip}
                >
                  <title>{`${item.code} ${point.week}: ${Math.round(point.percentage)}%`}</title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>
      <div className="report-chart-legend">
        {series.map((item, index) => <span key={item.code}><i style={{ backgroundColor: chartColors[index % chartColors.length] }} />{item.code}</span>)}
      </div>
      {tooltip.tooltipElement}
    </div>
  ) : <p className="report-chart-empty">Attendance records will appear here when available.</p>;
}

function describeArc(radius: number, startAngle: number, endAngle: number) {
  const toPoint = (angle: number) => {
    const radians = ((angle - 90) * Math.PI) / 180;
    return { x: 120 + radius * Math.cos(radians), y: 120 + radius * Math.sin(radians) };
  };
  const start = toPoint(startAngle);
  const end = toPoint(endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function EnrolmentMixChart({ data }: { data: Array<{ code: string; count: number }> }) {
  const tooltip = useChartTooltip();
  const total = data.reduce((sum, item) => sum + item.count, 0);
  let currentAngle = 0;
  const slices = data.map((item, index) => {
    if (item.count <= 0) return null;
    const start = currentAngle;
    const sweep = (item.count / total) * 360;
    currentAngle += sweep;
    const gap = Math.min(1, sweep / 4);
    return {
      ...item,
      color: chartColors[index % chartColors.length],
      share: (item.count / total) * 100,
      path: describeArc(76, start + gap, start + sweep - gap),
    };
  }).filter((slice) => slice !== null);

  return total ? (
    <div className="report-chart-content">
      <div className="report-donut-layout">
        <div className="report-donut-wrap">
          <svg viewBox="0 0 240 240" role="group" aria-label="Active enrolment mix by course">
            {slices.map((slice) => (
              <path
                key={slice.code}
                className="report-chart-interactive report-donut-slice"
                d={slice.path}
                fill="none"
                stroke={slice.color}
                strokeWidth="31"
                strokeLinecap="butt"
                role="img"
                tabIndex={0}
                aria-label={`${slice.code}: ${slice.count} active enrolments, ${Math.round(slice.share)} percent`}
                onMouseEnter={(event) => tooltip.showTooltip(event.currentTarget, `${slice.code} enrolments`, [
                  { label: 'Active students', value: String(slice.count), color: slice.color },
                  { label: 'Share of active enrolments', value: `${Math.round(slice.share)}%` },
                ])}
                onFocus={(event) => tooltip.showTooltip(event.currentTarget, `${slice.code} enrolments`, [
                  { label: 'Active students', value: String(slice.count), color: slice.color },
                  { label: 'Share of active enrolments', value: `${Math.round(slice.share)}%` },
                ])}
                onMouseLeave={tooltip.hideTooltip}
                onBlur={tooltip.hideTooltip}
              >
                <title>{`${slice.code}: ${slice.count} active enrolments`}</title>
              </path>
            ))}
          </svg>
          <div className="report-donut-center"><strong>{total}</strong><span>Active</span></div>
        </div>
        <div className="report-donut-legend">
          {data.map((item, index) => (
            <div key={item.code}>
              <span><i style={{ backgroundColor: chartColors[index % chartColors.length] }} />{item.code}</span>
              <strong>{item.count}</strong>
            </div>
          ))}
        </div>
      </div>
      {tooltip.tooltipElement}
    </div>
  ) : <p className="report-chart-empty">Active enrolments will appear here when available.</p>;
}

function TrainerLoadChart({ data }: { data: TrainerLoad[] }) {
  const tooltip = useChartTooltip();
  const width = 620;
  const height = 270;
  const plot = { left: 42, top: 16, right: 12, bottom: 45 };
  const plotWidth = width - plot.left - plot.right;
  const plotHeight = height - plot.top - plot.bottom;
  const maxValue = Math.max(1, ...data.map((trainer) => trainer.students));
  const axisMax = Math.max(5, Math.ceil(maxValue / 20) * 20);
  const ticks = [0, 1, 2, 3, 4].map((step) => (axisMax * step) / 4);
  const groupWidth = data.length ? plotWidth / data.length : plotWidth;
  const barWidth = Math.min(35, groupWidth * 0.28);

  return data.length ? (
    <div className="report-chart-content">
      <svg className="report-chart-svg" viewBox={`0 0 ${width} ${height}`} role="group" aria-label="Active batch and student load by trainer">
        {ticks.map((tick) => {
          const lineY = plot.top + plotHeight - (tick / axisMax) * plotHeight;
          return (
            <g key={tick}>
              <line className="report-grid-line" x1={plot.left} y1={lineY} x2={width - plot.right} y2={lineY} />
              <text className="report-axis-label" x={plot.left - 8} y={lineY + 4} textAnchor="end">{Math.round(tick)}</text>
            </g>
          );
        })}
        {data.map((trainer, index) => {
          const center = plot.left + groupWidth * index + groupWidth / 2;
          const batchHeight = (trainer.batches / axisMax) * plotHeight;
          const studentHeight = (trainer.students / axisMax) * plotHeight;
          const baseline = plot.top + plotHeight;
          return (
            <g
              key={trainer.name}
              className="report-chart-interactive"
              role="group"
              tabIndex={0}
              aria-label={`${trainer.name} trainer load details`}
              onMouseEnter={(event) => tooltip.showTooltip(event.currentTarget, trainer.name, [
                { label: 'Active batches', value: String(trainer.batches), color: '#6366f1' },
                { label: 'Active students', value: String(trainer.students), color: '#06b6d4' },
                { label: 'Batch IDs', value: trainer.batchCodes.join(', ') || '—' },
              ])}
              onFocus={(event) => tooltip.showTooltip(event.currentTarget, trainer.name, [
                { label: 'Active batches', value: String(trainer.batches), color: '#6366f1' },
                { label: 'Active students', value: String(trainer.students), color: '#06b6d4' },
                { label: 'Batch IDs', value: trainer.batchCodes.join(', ') || '—' },
              ])}
              onMouseLeave={tooltip.hideTooltip}
              onBlur={tooltip.hideTooltip}
            >
              <rect x={center - barWidth - 2} y={baseline - batchHeight} width={barWidth} height={batchHeight} rx="4" fill="#6366f1">
                <title>{`${trainer.name}: ${trainer.batches} active batches`}</title>
              </rect>
              <rect x={center + 2} y={baseline - studentHeight} width={barWidth} height={studentHeight} rx="4" fill="#06b6d4">
                <title>{`${trainer.name}: ${trainer.students} active students`}</title>
              </rect>
              <text className="report-axis-label" x={center} y={baseline + 22} textAnchor="middle">{trainer.name}</text>
            </g>
          );
        })}
      </svg>
      <div className="report-chart-legend">
        <span><i className="legend-batches" />Batches</span>
        <span><i className="legend-students" />Students</span>
      </div>
      {tooltip.tooltipElement}
    </div>
  ) : <p className="report-chart-empty">Active batch assignments will appear here when available.</p>;
}

export function AdminReportsPage() {
  const [courses, setCourses] = useState<ReportCourse[]>([]);
  const [enrolments, setEnrolments] = useState<ReportEnrolment[]>([]);
  const [payments, setPayments] = useState<ReportPayment[]>([]);
  const [batches, setBatches] = useState<ReportBatch[]>([]);
  const [sessions, setSessions] = useState<ReportSession[]>([]);
  const [attendance, setAttendance] = useState<ReportAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    Promise.all([
      listCourses({ signal: controller.signal }),
      listEnrolments(),
      listPayments(),
      listBatches(),
      listSessions(),
      listAttendance(),
    ])
      .then(([courseResponse, enrolmentResponse, paymentResponse, batchResponse, sessionResponse, attendanceResponse]) => {
        if (controller.signal.aborted) return;
        setCourses(normalizeList<ReportCourse>(courseResponse.data));
        setEnrolments(normalizeList<ReportEnrolment>(enrolmentResponse.data));
        setPayments(normalizeList<ReportPayment>(paymentResponse.data));
        setBatches(normalizeList<ReportBatch>(batchResponse.data));
        setSessions(normalizeList<ReportSession>(sessionResponse.data));
        setAttendance(normalizeList<ReportAttendance>(attendanceResponse.data));
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

  const revenue = useMemo(
    () => buildRevenue(courses, enrolments, payments),
    [courses, enrolments, payments],
  );
  const activeMix = useMemo(() => courses.map((course) => ({
    code: course.code,
    count: enrolments.filter((enrolment) => enrolment.course === course.id && enrolment.status.toUpperCase() === 'ACTIVE').length,
  })), [courses, enrolments]);
  const attendanceSeries = useMemo(
    () => buildAttendanceSeries(courses, batches, sessions, attendance, new Date()),
    [attendance, batches, courses, sessions],
  );
  const trainerLoad = useMemo(
    () => buildTrainerLoad(batches, enrolments),
    [batches, enrolments],
  );

  return (
    <section className="admin-reports-page">
      <header className="admin-reports-heading">
        <p className="admin-reports-eyebrow">Analytics · Admin only</p>
        <h1>Reports</h1>
        <p>Revenue, enrolment mix, attendance and trainer load.</p>
      </header>

      {error ? (
        <div className="admin-reports-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setRetryCount((count) => count + 1)}>Try again</button>
        </div>
      ) : loading ? (
        <div className="admin-report-grid" aria-label="Loading analytics">
          {Array.from({ length: 4 }, (_, index) => <div className="report-chart-panel report-chart-skeleton" key={index} />)}
        </div>
      ) : (
        <div className="admin-report-grid">
          <ChartPanel title="Revenue by course">
            <RevenueChart data={revenue} />
          </ChartPanel>
          <ChartPanel title="Weekly attendance % by course">
            <AttendanceChart series={attendanceSeries} />
          </ChartPanel>
          <ChartPanel title="Active enrolment mix">
            <EnrolmentMixChart data={activeMix} />
          </ChartPanel>
          <ChartPanel title="Trainer load (active batches)">
            <TrainerLoadChart data={trainerLoad} />
          </ChartPanel>
        </div>
      )}
    </section>
  );
}
