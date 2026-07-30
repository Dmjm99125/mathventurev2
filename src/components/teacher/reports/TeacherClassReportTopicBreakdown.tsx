import { useState } from 'react';
import { Card } from '@/components/ui';
import type { TeacherClassReportPayload } from '@/lib/teacher/reports';

function formatPct(value: number | null) {
  return value == null ? '--' : `${value}%`;
}

export function TeacherClassReportTopicBreakdown({
  rows,
}: {
  rows: TeacherClassReportPayload['topicBreakdown'];
}) {
  const [openTopics, setOpenTopics] = useState<Record<string, boolean>>({});

  return (
    <div className="grid gap-4">
      {rows.length === 0 && (
        <Card className="rounded-[24px] p-6 font-bold text-muted-foreground">
          No topic breakdown is available for this window.
        </Card>
      )}
      {rows.map((row) => (
        <Card key={row.topicId} className="overflow-hidden rounded-[24px] p-0">
          <button
            type="button"
            className="flex w-full items-center justify-between px-6 py-4 text-left"
            onClick={() =>
              setOpenTopics((current) => ({ ...current, [row.topicId]: !current[row.topicId] }))
            }
          >
            <span className="font-display text-xl font-bold">{row.topicId}</span>
            <span className="font-bold text-muted-foreground">
              {formatPct(row.averageScorePct)} | {row.passCount}/{row.attemptCount} passes
            </span>
          </button>
          {openTopics[row.topicId] && (
            <div className="border-t border-border/60 px-6 py-4">
              <div className="grid gap-3">
                {row.games.map((game) => (
                  <div key={game.gameId} className="rounded-2xl border border-border/60 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <p className="font-bold">{game.title}</p>
                      <p className="font-bold text-muted-foreground">
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
