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
    <Card className="teacher-section border border-[var(--teacher-moss)]/20 bg-[var(--teacher-oat)]/45 p-6 shadow-none">
      <h2 className="text-2xl font-display font-bold text-[var(--teacher-ink)]">Recent Activity</h2>
      <div className="mt-4 grid gap-6 xl:grid-cols-[minmax(240px,0.75fr)_minmax(0,1fr)]">
        <div className="grid gap-4">
          <div className="border-l-2 border-[var(--teacher-sage)] p-4">
            <p className="text-sm font-bold text-[var(--teacher-ink)]/65">Last classroom activity</p>
            <p className="mt-2 text-2xl font-extrabold tabular-nums text-[var(--teacher-ink)]">{formatDate(data.lastPlayedAt)}</p>
          </div>
          <div className="border-l-2 border-[var(--teacher-sage)] p-4">
            <p className="text-sm font-bold text-[var(--teacher-ink)]/65">Students without activity</p>
            <p className="mt-2 text-2xl font-extrabold tabular-nums text-[var(--teacher-ink)]">{data.inactiveStudentCount}</p>
          </div>
        </div>
        <div>
          <h3 className="font-bold text-[var(--teacher-ink)]/65">Recent passes</h3>
          <ul className="mt-3 grid gap-2">
            {data.recentPasses.length === 0 && (
              <li className="rounded-2xl border border-[var(--teacher-moss)]/20 p-3 font-semibold text-[var(--teacher-ink)]/65">
                No recent passes in this window.
              </li>
            )}
            {data.recentPasses.map((row) => (
              <li
                key={`${row.studentId}-${row.gameId}-${row.completedAt}`}
                className="rounded-2xl border border-[var(--teacher-moss)]/20 p-3 font-bold tabular-nums text-[var(--teacher-ink)]"
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
