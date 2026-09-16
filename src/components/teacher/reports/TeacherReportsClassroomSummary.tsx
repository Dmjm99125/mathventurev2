import { Card } from '@/components/ui';
import type { TeacherSingleClassroomReportPayload } from '@/lib/teacher/reports';

function formatPct(value: number | null) {
  return value == null ? '--' : `${value}%`;
}

function formatDate(value: string | null) {
  return value ? value.slice(0, 10) : '--';
}

export function TeacherReportsClassroomSummary({
  summary,
}: {
  summary: TeacherSingleClassroomReportPayload['classroomSummary'];
}) {
  return (
    <Card className="teacher-section border border-[var(--teacher-moss)]/20 bg-[var(--teacher-oat)]/45 p-6 shadow-none">
      <h2 className="text-2xl font-display font-bold">Classroom Summary</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="teacher-metric border-l-2 border-[var(--teacher-sage)] p-4">
          <p className="text-sm font-bold text-[var(--teacher-ink)]/65">Students</p>
          <p className="mt-2 text-3xl font-extrabold tabular-nums text-[var(--teacher-ink)]">{summary.studentCount}</p>
        </div>
        <div className="teacher-metric border-l-2 border-[var(--teacher-sage)] p-4">
          <p className="text-sm font-bold text-[var(--teacher-ink)]/65">Active Students</p>
          <p className="mt-2 text-3xl font-extrabold tabular-nums text-[var(--teacher-ink)]">{summary.activeStudentCount}</p>
        </div>
        <div className="teacher-metric border-l-2 border-[var(--teacher-sage)] p-4">
          <p className="text-sm font-bold text-[var(--teacher-ink)]/65">Average Score</p>
          <p className="mt-2 text-3xl font-extrabold tabular-nums text-[var(--teacher-ink)]">{formatPct(summary.averageScorePct)}</p>
        </div>
        <div className="teacher-metric border-l-2 border-[var(--teacher-sage)] p-4">
          <p className="text-sm font-bold text-[var(--teacher-ink)]/65">Completion</p>
          <p className="mt-2 text-3xl font-extrabold tabular-nums text-[var(--teacher-ink)]">{formatPct(summary.completionPct)}</p>
        </div>
        <div className="teacher-metric border-l-2 border-[var(--teacher-sage)] p-4">
          <p className="text-sm font-bold text-[var(--teacher-ink)]/65">Last Activity</p>
          <p className="mt-2 text-3xl font-extrabold tabular-nums text-[var(--teacher-ink)]">{formatDate(summary.lastActivityAt)}</p>
        </div>
      </div>
    </Card>
  );
}
