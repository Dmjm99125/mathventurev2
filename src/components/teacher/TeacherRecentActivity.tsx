import type { TeacherSingleClassroomReportPayload } from '@/lib/teacher/reports';

type RecentActivity = TeacherSingleClassroomReportPayload['recentActivity'];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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
            <div key={`${pass.studentId}-${pass.gameId}-${pass.completedAt}`} className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="min-w-0">
                <p className="truncate font-bold text-[var(--teacher-ink)]">{pass.fullName}</p>
                <p className="text-sm font-semibold text-[var(--teacher-ink)]/65">Completed {pass.gameId}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="font-display text-xl font-bold tabular-nums text-[var(--teacher-moss)]">{pass.scorePct}%</p>
                <p className="text-xs font-semibold text-[var(--teacher-ink)]/60">{formatDate(pass.completedAt)}</p>
              </div>
            </div>
          ))}
          {recentActivity.lastPlayedAt && (
            <p className="py-4 text-sm font-semibold text-[var(--teacher-ink)]/65">
              Last classroom activity: {formatDate(recentActivity.lastPlayedAt)}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
