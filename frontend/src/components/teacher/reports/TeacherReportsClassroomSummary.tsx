import { Activity, Award, Calendar, CheckCircle2, Users } from 'lucide-react';
import { Card } from '@/components/ui';
import type { TeacherSingleClassroomReportPayload } from '@/lib/teacher/reports';

function formatPct(value: number | null) {
  return value == null ? '—' : `${value}%`;
}

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function scoreColorClass(value: number | null): string {
  if (value == null) return 'text-[var(--teacher-ink)]';
  if (value >= 80) return 'text-[var(--teacher-moss)]';
  if (value >= 60) return 'text-[var(--teacher-ochre)]';
  return 'text-[var(--teacher-terracotta)]';
}

export function TeacherReportsClassroomSummary({
  summary,
}: {
  summary: TeacherSingleClassroomReportPayload['classroomSummary'];
}) {
  const metrics = [
    {
      label: 'Students',
      value: summary.studentCount,
      displayValue: String(summary.studentCount),
      icon: <Users className="h-4 w-4" />,
      colorClass: 'text-[var(--teacher-ink)]',
    },
    {
      label: 'Active students',
      value: summary.activeStudentCount,
      displayValue: String(summary.activeStudentCount),
      icon: <Activity className="h-4 w-4" />,
      colorClass: 'text-[var(--teacher-ink)]',
    },
    {
      label: 'Avg score',
      value: summary.averageScorePct,
      displayValue: formatPct(summary.averageScorePct),
      icon: <Award className="h-4 w-4" />,
      colorClass: scoreColorClass(summary.averageScorePct),
    },
    {
      label: 'Completion',
      value: summary.completionPct,
      displayValue: formatPct(summary.completionPct),
      icon: <CheckCircle2 className="h-4 w-4" />,
      colorClass: scoreColorClass(summary.completionPct),
    },
    {
      label: 'Last activity',
      value: null,
      displayValue: formatDate(summary.lastActivityAt),
      icon: <Calendar className="h-4 w-4" />,
      colorClass: 'text-[var(--teacher-ink)]',
    },
  ];

  return (
    <Card className="teacher-section border border-[var(--teacher-moss)]/20 bg-[var(--teacher-oat)]/45 p-6 shadow-none">
      <h2 className="font-display text-2xl font-bold text-[var(--teacher-ink)]">Classroom Summary</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-[var(--teacher-moss)]/15 bg-[var(--teacher-sand)]/50 px-4 py-4 transition-shadow hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--teacher-ink)]/55">{m.label}</p>
              <span className="text-[var(--teacher-sage)]/70">{m.icon}</span>
            </div>
            <p className={`mt-2 font-display text-3xl font-extrabold tabular-nums ${m.colorClass}`}>
              {m.displayValue}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
