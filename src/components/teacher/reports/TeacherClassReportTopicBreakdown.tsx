import { useState } from 'react';
import { Card } from '@/components/ui';
import type { TeacherSingleClassroomReportPayload } from '@/lib/teacher/reports';

function formatPct(value: number | null) {
  return value == null ? '--' : `${value}%`;
}

export function TeacherClassReportTopicBreakdown({
  rows,
}: {
  rows: TeacherSingleClassroomReportPayload['topicBreakdown'];
}) {
  const [openTopics, setOpenTopics] = useState<Record<string, boolean>>({});

  return (
    <div className="grid gap-4">
      <Card className="teacher-section border border-[var(--teacher-moss)]/20 bg-[var(--teacher-oat)]/45 p-6 shadow-none">
        <h2 className="text-2xl font-display font-bold text-[var(--teacher-ink)]">Topic Breakdown</h2>
        <p className="mt-2 font-semibold text-[var(--teacher-ink)]/65">
          Drill into topic and game performance for the selected report window.
        </p>
      </Card>
      {rows.length === 0 && (
        <Card className="teacher-section border border-[var(--teacher-moss)]/20 bg-[var(--teacher-oat)]/45 p-6 font-semibold text-[var(--teacher-ink)]/65 shadow-none">
          No topic breakdown is available for this window.
        </Card>
      )}
      {rows.map((row) => (
        <Card key={row.topicId} className="teacher-section overflow-hidden border border-[var(--teacher-moss)]/20 bg-[var(--teacher-oat)]/45 p-0 shadow-none">
          <button
            type="button"
            className="flex w-full items-center justify-between px-6 py-4 text-left"
            onClick={() =>
              setOpenTopics((current) => ({ ...current, [row.topicId]: !current[row.topicId] }))
            }
          >
            <span className="font-display text-xl font-bold text-[var(--teacher-ink)]">{row.topicId}</span>
            <span className="font-bold tabular-nums text-[var(--teacher-ink)]/65">
              {formatPct(row.averageScorePct)} | {row.passCount}/{row.attemptCount} passes
            </span>
          </button>
          {openTopics[row.topicId] && (
            <div className="border-t border-[var(--teacher-moss)]/20 px-6 py-4">
              <div className="grid gap-3">
                {row.games.map((game) => (
                  <div key={game.gameId} className="rounded-2xl border border-[var(--teacher-moss)]/20 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <p className="font-bold">{game.title}</p>
                      <p className="font-bold tabular-nums text-[var(--teacher-ink)]/65">
                        {formatPct(game.averageScorePct)} | {game.passCount}/{game.attemptCount} passes
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
