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
    <Card className="rounded-[24px] p-6">
      <h2 className="text-2xl font-display font-bold">Classroom Summary</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl bg-muted/35 p-4">
          <p className="text-sm font-bold text-muted-foreground">Students</p>
          <p className="mt-2 text-3xl font-extrabold">{summary.studentCount}</p>
        </div>
        <div className="rounded-2xl bg-muted/35 p-4">
          <p className="text-sm font-bold text-muted-foreground">Active Students</p>
          <p className="mt-2 text-3xl font-extrabold">{summary.activeStudentCount}</p>
        </div>
        <div className="rounded-2xl bg-muted/35 p-4">
          <p className="text-sm font-bold text-muted-foreground">Average Score</p>
          <p className="mt-2 text-3xl font-extrabold">{formatPct(summary.averageScorePct)}</p>
        </div>
        <div className="rounded-2xl bg-muted/35 p-4">
          <p className="text-sm font-bold text-muted-foreground">Completion</p>
          <p className="mt-2 text-3xl font-extrabold">{formatPct(summary.completionPct)}</p>
        </div>
        <div className="rounded-2xl bg-muted/35 p-4">
          <p className="text-sm font-bold text-muted-foreground">Last Activity</p>
          <p className="mt-2 text-3xl font-extrabold">{formatDate(summary.lastActivityAt)}</p>
        </div>
      </div>
    </Card>
  );
}
