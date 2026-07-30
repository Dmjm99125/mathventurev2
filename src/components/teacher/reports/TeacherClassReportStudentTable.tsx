import { useMemo, useState } from 'react';
import type { TeacherClassReportPayload } from '@/lib/teacher/reports';

function formatPct(value: number | null) {
  return value == null ? '--' : `${value}%`;
}

type SortKey = 'lastName' | 'averageScorePct' | 'completionPct' | 'lastPlayedPct';

export function TeacherClassReportStudentTable({
  rows,
}: {
  rows: TeacherClassReportPayload['studentRows'];
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
    <div className="overflow-x-auto rounded-[24px] border-2 border-border bg-white">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-border bg-muted/40">
            <th className="p-4 font-bold text-muted-foreground">
              <button type="button" onClick={() => setSortKey('lastName')}>Last Name</button>
            </th>
            <th className="p-4 font-bold text-muted-foreground">First Name</th>
            <th className="p-4 font-bold text-muted-foreground">
              <button type="button" onClick={() => setSortKey('averageScorePct')}>Avg Score</button>
            </th>
            <th className="p-4 font-bold text-muted-foreground">
              <button type="button" onClick={() => setSortKey('completionPct')}>Completion</button>
            </th>
            <th className="p-4 font-bold text-muted-foreground">
              <button type="button" onClick={() => setSortKey('lastPlayedPct')}>Last Played</button>
            </th>
            <th className="p-4 font-bold text-muted-foreground">Last Activity</th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => (
            <tr key={row.studentId} className="border-b border-border/60">
              <td className="p-4 font-bold">{row.lastName ?? '--'}</td>
              <td className="p-4 font-bold">{row.firstName}</td>
              <td className="p-4 font-bold">{formatPct(row.averageScorePct)}</td>
              <td className="p-4 font-bold">{formatPct(row.completionPct)}</td>
              <td className="p-4 font-bold">{formatPct(row.lastPlayedPct)}</td>
              <td className="p-4 font-bold">{row.lastActivityAt?.slice(0, 10) ?? '--'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
