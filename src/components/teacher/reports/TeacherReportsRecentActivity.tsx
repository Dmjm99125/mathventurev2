import { Card } from '@/components/ui';
import type { TeacherSingleClassroomReportPayload } from '@/lib/teacher/reports';

function formatDate(value: string | null) {
  return value ? value.slice(0, 10) : '--';
}

export function TeacherReportsRecentActivity({
  data,
}: {
  data: TeacherSingleClassroomReportPayload['recentActivity'];
}) {
  return (
    <Card className="rounded-[24px] p-6">
      <h2 className="text-2xl font-display font-bold">Recent Activity</h2>
      <div className="mt-4 grid gap-6 xl:grid-cols-[minmax(240px,0.75fr)_minmax(0,1fr)]">
        <div className="grid gap-4">
          <div className="rounded-2xl bg-muted/35 p-4">
            <p className="text-sm font-bold text-muted-foreground">Last classroom activity</p>
            <p className="mt-2 text-2xl font-extrabold">{formatDate(data.lastPlayedAt)}</p>
          </div>
          <div className="rounded-2xl bg-muted/35 p-4">
            <p className="text-sm font-bold text-muted-foreground">Students without activity</p>
            <p className="mt-2 text-2xl font-extrabold">{data.inactiveStudentCount}</p>
          </div>
        </div>
        <div>
          <h3 className="font-bold text-muted-foreground">Recent passes</h3>
          <ul className="mt-3 grid gap-2">
            {data.recentPasses.length === 0 && (
              <li className="rounded-2xl border border-border/60 p-3 font-bold text-muted-foreground">
                No recent passes in this window.
              </li>
            )}
            {data.recentPasses.map((row) => (
              <li
                key={`${row.studentId}-${row.gameId}-${row.completedAt}`}
                className="rounded-2xl border border-border/60 p-3 font-bold"
              >
                {row.fullName} | {row.scorePct}% | {formatDate(row.completedAt)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
