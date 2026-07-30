import { Card } from '@/components/ui';
import type { TeacherReportsOverviewPayload } from '@/lib/teacher/reports';

function formatDate(value: string) {
  return value.slice(0, 10);
}

export function TeacherReportsRecentActivity({
  data,
}: {
  data: TeacherReportsOverviewPayload['recentActivity'];
}) {
  return (
    <Card className="rounded-[24px] p-6">
      <h2 className="text-2xl font-display font-bold">Recent Activity</h2>
      <div className="mt-4 grid gap-6 xl:grid-cols-3">
        <div>
          <h3 className="font-bold text-muted-foreground">Recently active classes</h3>
          <ul className="mt-3 grid gap-2">
            {data.activeClasses.length === 0 && (
              <li className="rounded-2xl border border-border/60 p-3 font-bold text-muted-foreground">
                No active classes in this window.
              </li>
            )}
            {data.activeClasses.map((row) => (
              <li key={row.classId} className="rounded-2xl border border-border/60 p-3 font-bold">
                {row.className} | {formatDate(row.lastActivityAt)}
              </li>
            ))}
          </ul>
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
                key={`${row.classId}-${row.studentId}-${row.gameId}-${row.completedAt}`}
                className="rounded-2xl border border-border/60 p-3 font-bold"
              >
                {row.fullName} | {row.className} | {row.scorePct}%
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-muted-foreground">Quiet classes</h3>
          <ul className="mt-3 grid gap-2">
            {data.quietClasses.length === 0 && (
              <li className="rounded-2xl border border-border/60 p-3 font-bold text-muted-foreground">
                No quiet classes in this window.
              </li>
            )}
            {data.quietClasses.map((row) => (
              <li key={row.classId} className="rounded-2xl border border-border/60 p-3 font-bold">
                {row.className} | {row.studentCount} students
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
