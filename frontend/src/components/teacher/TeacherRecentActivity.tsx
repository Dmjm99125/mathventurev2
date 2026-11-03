import type { TeacherSingleClassroomReportPayload } from '@/lib/teacher/reports';

type RecentActivity = TeacherSingleClassroomReportPayload['recentActivity'];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function scoreColorClass(pct: number): string {
  if (pct >= 80) return 'teacher-score-high';
  if (pct >= 60) return 'teacher-score-mid';
  return 'teacher-score-low';
}

export function TeacherRecentActivity({
  recentActivity,
}: {
  recentActivity: RecentActivity;
}) {
  const hasActivity = recentActivity.recentPasses.length > 0 || recentActivity.lastPlayedAt !== null;

  return (
    <section aria-labelledby="teacher-recent-activity" className="teacher-section teacher-trail-step">
      <div className="border-b border-[var(--teacher-moss)]/20 pb-3">
        <p className="teacher-eyebrow">Keep the trail moving</p>
        <h2 id="teacher-recent-activity" className="mt-1 font-display text-2xl font-bold text-[var(--teacher-ink)]">
          Recent activity
        </h2>
      </div>

      {!hasActivity ? (
        <p className="py-8 text-base font-semibold text-[var(--teacher-ink)]/65">
          No recent activity in this classroom.
        </p>
      ) : (
        <div className="mt-2 divide-y divide-[var(--teacher-moss)]/15">
          {recentActivity.recentPasses.map((pass) => (
            <div
              key={`${pass.studentId}-${pass.gameId}-${pass.completedAt}`}
              className="flex items-center gap-4 py-3.5"
            >
              {/* Score chip */}
              <div className={`w-14 shrink-0 text-right font-display text-xl font-bold tabular-nums ${scoreColorClass(pass.scorePct)}`}>
                {pass.scorePct}%
              </div>

              {/* Divider */}
              <div className="h-8 w-px shrink-0 bg-[var(--teacher-moss)]/20" />

              {/* Student + game */}
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-[var(--teacher-ink)]">{pass.fullName}</p>
                <p className="truncate text-sm font-semibold text-[var(--teacher-ink)]/60">{pass.gameTitle}</p>
              </div>

              {/* Date */}
              <p className="shrink-0 text-xs font-semibold text-[var(--teacher-ink)]/50">
                {formatDate(pass.completedAt)}
              </p>
            </div>
          ))}
          {recentActivity.lastPlayedAt && (
            <p className="py-4 text-sm font-semibold text-[var(--teacher-ink)]/55">
              Last classroom activity: {formatDate(recentActivity.lastPlayedAt)}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
