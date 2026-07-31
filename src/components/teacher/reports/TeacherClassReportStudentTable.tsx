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
    <Card className="overflow-hidden rounded-[24px] p-0">
      <div className="border-b border-border/60 px-6 py-4">
        <h2 className="text-2xl font-display font-bold">Student Performance</h2>
      </div>
      <div className="overflow-x-auto">
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
            {sortedRows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center font-bold text-muted-foreground">
                  No students are enrolled in this classroom yet.
                </td>
              </tr>
            )}
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
    </Card>
  );
}
