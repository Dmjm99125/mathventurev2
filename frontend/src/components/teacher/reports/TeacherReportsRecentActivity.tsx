import { Card } from '@/components/ui';
import type { TeacherSingleClassroomReportPayload } from '@/lib/teacher/reports';

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function scoreColorClass(pct: number): string {
  if (pct >= 80) return 'text-[var(--teacher-moss)]';
  if (pct >= 60) return 'text-[var(--teacher-ochre)]';
  return 'text-[var(--teacher-terracotta)]';
}

export function TeacherReportsRecentActivity({
  data,
}: {
  data: TeacherSingleClassroomReportPayload['recentActivity'];
}) {
  return (
    <Card className="teacher-section border border-[var(--teacher-moss)]/20 bg-[var(--teacher-oat)]/45 p-6 shadow-none">
      <h2 className="font-display text-2xl font-bold text-[var(--teacher-ink)]">Recent Activity</h2>
      <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(220px,0.7fr)_minmax(0,1fr)]">
        {/* Stats column */}
        <div className="grid gap-3">
          <div className="rounded-2xl border border-[var(--teacher-moss)]/15 bg-[var(--teacher-sand)]/50 px-4 py-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--teacher-ink)]/55">Last classroom activity</p>
            <p className="mt-2 font-display text-2xl font-extrabold tabular-nums text-[var(--teacher-ink)]">
              {formatDate(data.lastPlayedAt)}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--teacher-moss)]/15 bg-[var(--teacher-sand)]/50 px-4 py-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--teacher-ink)]/55">Students without activity</p>
            <p className="mt-2 font-display text-2xl font-extrabold tabular-nums text-[var(--teacher-ink)]">
              {data.inactiveStudentCount}
            </p>
          </div>
        </div>

        {/* Passes column */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--teacher-ink)]/55">Recent passes</h3>
          <ul className="mt-3 divide-y divide-[var(--teacher-moss)]/12">
            {data.recentPasses.length === 0 && (
              <li className="rounded-2xl border border-[var(--teacher-moss)]/15 bg-[var(--teacher-oat)]/30 px-4 py-4 font-semibold text-[var(--teacher-ink)]/65">
                No recent passes in this window.
              </li>
            )}
            {data.recentPasses.map((row) => (
              <li
                key={`${row.studentId}-${row.gameId}-${row.completedAt}`}
                className="flex items-center gap-4 py-3"
              >
                <span className={`w-12 shrink-0 text-right font-display text-xl font-bold tabular-nums ${scoreColorClass(row.scorePct)}`}>
                  {row.scorePct}%
                </span>
                <div className="h-7 w-px shrink-0 bg-[var(--teacher-moss)]/20" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-[var(--teacher-ink)]">{row.fullName}</p>
                  <p className="truncate text-sm font-semibold text-[var(--teacher-ink)]/60">{row.gameTitle}</p>
                </div>
                <p className="shrink-0 text-xs font-semibold text-[var(--teacher-ink)]/45">
                  {formatDate(row.completedAt)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
