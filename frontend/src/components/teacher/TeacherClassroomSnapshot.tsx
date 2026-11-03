import { Activity, Award, CheckCircle2, ClipboardList, Users } from 'lucide-react';
import type { TeacherSingleClassroomReportPayload } from '@/lib/teacher/reports';

type ClassroomSummary = TeacherSingleClassroomReportPayload['classroomSummary'];

function formatPercent(value: number | null) {
  return value == null ? '—' : `${value}%`;
}

const METRIC_ICONS = [
  <Users className="h-4 w-4" />,
  <Activity className="h-4 w-4" />,
  <CheckCircle2 className="h-4 w-4" />,
  <Award className="h-4 w-4" />,
  <ClipboardList className="h-4 w-4" />,
];

function scoreColor(value: number | null): string {
  if (value == null) return 'text-[var(--teacher-ink)]';
  if (value >= 80) return 'text-[var(--teacher-moss)]';
  if (value >= 60) return 'text-[var(--teacher-ochre)]';
  return 'text-[var(--teacher-terracotta)]';
}

export function TeacherClassroomSnapshot({
  summary,
  studentCount,
  assignmentCount,
}: {
  summary: ClassroomSummary;
  studentCount: number;
  assignmentCount: number;
}) {
  const metrics = [
    { label: 'Students', value: studentCount, raw: null },
    { label: 'Active recently', value: summary.activeStudentCount, raw: null },
    { label: 'Completion', value: formatPercent(summary.completionPct), raw: summary.completionPct },
    { label: 'Avg score', value: formatPercent(summary.averageScorePct), raw: summary.averageScorePct },
    { label: 'Assignments', value: assignmentCount, raw: null },
  ];

  return (
    <section aria-labelledby="teacher-classroom-snapshot" className="teacher-section">
      <div className="flex items-end justify-between gap-4 border-b border-[var(--teacher-moss)]/20 pb-3">
        <div>
          <p className="teacher-eyebrow">Classroom snapshot</p>
          <h2 id="teacher-classroom-snapshot" className="mt-1 font-display text-2xl font-bold text-[var(--teacher-ink)]">
            Your classroom
          </h2>
        </div>
        <p className="text-right text-sm font-semibold text-[var(--teacher-ink)]/65">Last 30 days</p>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {metrics.map((metric, i) => (
          <div
            key={metric.label}
            className="rounded-2xl border border-[var(--teacher-moss)]/15 bg-[var(--teacher-oat)]/30 px-4 py-4 transition-shadow hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <dt className="text-xs font-bold uppercase tracking-wide text-[var(--teacher-ink)]/55">
                {metric.label}
              </dt>
              <span className="text-[var(--teacher-sage)]/70">{METRIC_ICONS[i]}</span>
            </div>
            <dd className={`mt-2 font-display text-3xl font-bold tabular-nums ${scoreColor(metric.raw)}`}>
              {metric.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
