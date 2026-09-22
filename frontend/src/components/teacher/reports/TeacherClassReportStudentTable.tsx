import { useMemo, useState } from 'react';
import { Card } from '@/components/ui';
import type { TeacherSingleClassroomReportPayload } from '@/lib/teacher/reports';

function formatPct(value: number | null) {
  return value == null ? '--' : `${value}%`;
}

type SortKey = 'lastName' | 'averageScorePct' | 'completionPct' | 'lastPlayedPct';

export function TeacherClassReportStudentTable({
  rows,
}: {
  rows: TeacherSingleClassroomReportPayload['studentRows'];
}) {
  const [sortKey, setSortKey] = useState<SortKey>('averageScorePct');
  const sortedRows = useMemo(() => {
    return [...rows].sort((left, right) => {
      if (sortKey === 'lastName') {
        return `${left.lastName ?? ''}${left.firstName}`.localeCompare(`${right.lastName ?? ''}${right.firstName}`);
      }
      return (right[sortKey] ?? -1) - (left[sortKey] ?? -1);
    });
  }, [rows, sortKey]);

  return (
    <Card className="teacher-section overflow-hidden border border-[var(--teacher-moss)]/20 bg-[var(--teacher-oat)]/45 p-0 shadow-none">
      <div className="border-b border-[var(--teacher-moss)]/20 px-4 py-4 sm:px-6">
        <h2 className="text-xl font-display font-bold text-[var(--teacher-ink)] sm:text-2xl">Student Performance</h2>
      </div>
      <div className="overflow-x-auto">
        <table aria-label="Student performance" className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--teacher-moss)]/20 bg-[var(--teacher-sage)]/18">
                <th className="whitespace-nowrap p-4 font-bold text-[var(--teacher-ink)]/65">
                <button
                  type="button"
                  className="rounded-md px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onClick={() => setSortKey('lastName')}
                >
                  Last Name
                </button>
              </th>
              <th className="whitespace-nowrap p-4 font-bold text-[var(--teacher-ink)]/65">First Name</th>
              <th className="whitespace-nowrap p-4 font-bold text-[var(--teacher-ink)]/65">
                <button
                  type="button"
                  className="rounded-md px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onClick={() => setSortKey('averageScorePct')}
                >
                  Avg Score
                </button>
              </th>
              <th className="whitespace-nowrap p-4 font-bold text-[var(--teacher-ink)]/65">
                <button
                  type="button"
                  className="rounded-md px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onClick={() => setSortKey('completionPct')}
                >
                  Completion
                </button>
              </th>
              <th className="whitespace-nowrap p-4 font-bold text-[var(--teacher-ink)]/65">
                <button
                  type="button"
                  className="rounded-md px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onClick={() => setSortKey('lastPlayedPct')}
                >
                  Last Played
                </button>
              </th>
              <th className="whitespace-nowrap p-4 font-bold text-[var(--teacher-ink)]/65">Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center font-semibold text-[var(--teacher-ink)]/65">
                  No students are enrolled in this classroom yet.
                </td>
              </tr>
            )}
            {sortedRows.map((row) => (
              <tr key={row.studentId} className="border-b border-[var(--teacher-moss)]/15">
                <td className="whitespace-nowrap p-4 font-bold text-[var(--teacher-ink)]">{row.lastName ?? '--'}</td>
                <td className="whitespace-nowrap p-4 font-bold text-[var(--teacher-ink)]">{row.firstName}</td>
                <td className="whitespace-nowrap p-4 font-bold tabular-nums text-[var(--teacher-ink)]">{formatPct(row.averageScorePct)}</td>
                <td className="whitespace-nowrap p-4 font-bold tabular-nums text-[var(--teacher-ink)]">{formatPct(row.completionPct)}</td>
                <td className="whitespace-nowrap p-4 font-bold tabular-nums text-[var(--teacher-ink)]">{formatPct(row.lastPlayedPct)}</td>
                <td className="whitespace-nowrap p-4 font-bold tabular-nums text-[var(--teacher-ink)]">{row.lastActivityAt?.slice(0, 10) ?? '--'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
