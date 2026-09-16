import type { TeacherSingleClassroomReportPayload } from '@/lib/teacher/reports';

type ClassroomSummary = TeacherSingleClassroomReportPayload['classroomSummary'];

function formatPercent(value: number | null) {
  return value == null ? '—' : `${value}%`;
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
    { label: 'Students', value: studentCount },
    { label: 'Active recently', value: summary.activeStudentCount },
    { label: 'Completion', value: formatPercent(summary.completionPct) },
    { label: 'Average score', value: formatPercent(summary.averageScorePct) },
    { label: 'Assignments', value: assignmentCount },
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

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
        {metrics.map((metric) => (
          <div key={metric.label} className="border-l-2 border-[var(--teacher-sage)] pl-3">
            <dt className="text-sm font-semibold text-[var(--teacher-ink)]/65">{metric.label}</dt>
            <dd className="mt-1 font-display text-3xl font-bold tabular-nums text-[var(--teacher-ink)]">{metric.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
