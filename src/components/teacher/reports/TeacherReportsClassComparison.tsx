import { Button, Card } from '@/components/ui';
import type { TeacherReportsOverviewPayload } from '@/lib/teacher/reports';

function formatPct(value: number | null) {
  return value == null ? '--' : `${value}%`;
}

function formatDate(value: string | null) {
  return value ? value.slice(0, 10) : '--';
}

export function TeacherReportsClassComparison({
  rows,
  onOpenClass,
}: {
  rows: TeacherReportsOverviewPayload['classSummaries'];
  onOpenClass(classId: string): void;
}) {
  return (
    <Card className="overflow-hidden rounded-[24px] p-0">
      <div className="border-b border-border/60 px-4 py-4 sm:px-6">
        <h2 className="text-xl font-display font-bold sm:text-2xl">Class Performance</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-border bg-muted/40">
              <th className="whitespace-nowrap p-4 font-bold text-muted-foreground">Class</th>
              <th className="whitespace-nowrap p-4 font-bold text-muted-foreground">Students</th>
              <th className="whitespace-nowrap p-4 font-bold text-muted-foreground">Active</th>
              <th className="whitespace-nowrap p-4 font-bold text-muted-foreground">Avg Score</th>
              <th className="whitespace-nowrap p-4 font-bold text-muted-foreground">Completion</th>
              <th className="whitespace-nowrap p-4 font-bold text-muted-foreground">Last Activity</th>
              <th className="whitespace-nowrap p-4 font-bold text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center font-bold text-muted-foreground">
                  No class report data is available for this window.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border/60">
                <td className="whitespace-nowrap p-4 font-bold">{row.name}</td>
                <td className="whitespace-nowrap p-4 font-bold">{row.studentCount}</td>
                <td className="whitespace-nowrap p-4 font-bold">{row.activeStudentCount}</td>
                <td className="whitespace-nowrap p-4 font-bold">{formatPct(row.averageScorePct)}</td>
                <td className="whitespace-nowrap p-4 font-bold">{formatPct(row.completionPct)}</td>
                <td className="whitespace-nowrap p-4 font-bold">{formatDate(row.lastActivityAt)}</td>
                <td className="whitespace-nowrap p-4">
                  <Button size="sm" onClick={() => onOpenClass(row.id)}>
                    View class report
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
