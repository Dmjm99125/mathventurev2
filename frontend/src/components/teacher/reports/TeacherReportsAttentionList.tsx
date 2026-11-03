import { AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui';
import type { TeacherSingleClassroomReportPayload } from '@/lib/teacher/reports';

const ATTENTION_LABELS = {
  low_average: 'Average score below 75%',
  inactive_while_class_active: 'No recent activity while classmates are active',
  low_completion: 'Completion below 10%',
} as const;

const REASON_BADGE_CLASS: Record<string, string> = {
  low_average: 'teacher-badge-alert',
  inactive_while_class_active: 'teacher-badge-warning',
  low_completion: 'teacher-badge-warning',
};

function formatPct(value: number | null) {
  return value == null ? '—' : `${value}%`;
}

export function TeacherReportsAttentionList({
  rows,
}: {
  rows: TeacherSingleClassroomReportPayload['attentionStudents'];
}) {
  return (
    <Card className="teacher-section border border-[var(--teacher-moss)]/20 bg-[var(--teacher-oat)]/45 p-6 shadow-none">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-bold text-[var(--teacher-ink)]">Students Needing Attention</h2>
        {rows.length > 0 && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--teacher-terracotta)]/15 font-display text-base font-bold text-[var(--teacher-terracotta)]">
            {rows.length}
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-3">
        {rows.length === 0 && (
          <p className="rounded-2xl border border-[var(--teacher-moss)]/15 bg-[var(--teacher-sage)]/10 px-4 py-5 font-semibold text-[var(--teacher-ink)]/65">
            No students are currently flagged in this window.
          </p>
        )}
        {rows.map((row) => (
          <div
            key={row.studentId}
            className="rounded-2xl border border-[var(--teacher-terracotta)]/20 bg-[var(--teacher-oat)]/30 p-4 transition-shadow hover:shadow-sm"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-display text-lg font-bold text-[var(--teacher-ink)]">{row.fullName}</p>
                <p className="mt-0.5 text-sm font-bold tabular-nums text-[var(--teacher-ink)]/60">
                  Score: {formatPct(row.averageScorePct)} &middot; Completion: {formatPct(row.completionPct)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {row.reasonCodes.map((reason) => (
                  <span
                    key={reason}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${REASON_BADGE_CLASS[reason]}`}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {ATTENTION_LABELS[reason]}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
