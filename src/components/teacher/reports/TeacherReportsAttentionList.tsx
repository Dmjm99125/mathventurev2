import { Card } from '@/components/ui';
import type { TeacherSingleClassroomReportPayload } from '@/lib/teacher-reports';

const ATTENTION_LABELS = {
  low_average: 'Average score below 75%',
  inactive_while_class_active: 'No recent activity while classmates are active',
  low_completion: 'Completion below 10%',
} as const;

function formatPct(value: number | null) {
  return value == null ? '--' : `${value}%`;
}

export function TeacherReportsAttentionList({
  rows,
}: {
  rows: TeacherSingleClassroomReportPayload['attentionStudents'];
}) {
  return (
    <Card className="rounded-[24px] p-6">
      <h2 className="text-2xl font-display font-bold">Students Needing Attention</h2>
      <div className="mt-4 grid gap-3">
        {rows.length === 0 && (
          <p className="font-bold text-muted-foreground">
            No students are currently flagged in this window.
          </p>
        )}
        {rows.map((row) => (
          <div
            key={row.studentId}
            className="rounded-2xl border border-border/70 p-4"
          >
            <div className="flex flex-col gap-3">
              <div>
                <p className="font-display text-lg font-bold">{row.fullName}</p>
                <p className="text-sm font-bold text-muted-foreground">
                  Avg {formatPct(row.averageScorePct)} | Completion {formatPct(row.completionPct)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {row.reasonCodes.map((reason) => (
                    <span
                      key={reason}
                      className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900"
                    >
                      {ATTENTION_LABELS[reason]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
