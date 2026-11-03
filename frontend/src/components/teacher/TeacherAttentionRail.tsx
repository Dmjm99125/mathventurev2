import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui';
import type { TeacherSingleClassroomReportPayload } from '@/lib/teacher/reports';

type AttentionStudent = TeacherSingleClassroomReportPayload['attentionStudents'][number];

const REASON_LABELS: Record<AttentionStudent['reasonCodes'][number], string> = {
  low_average: 'Low average score',
  inactive_while_class_active: 'Has not started',
  low_completion: 'Low completion',
};

const REASON_BADGE_CLASS: Record<AttentionStudent['reasonCodes'][number], string> = {
  low_average: 'teacher-badge-alert',
  inactive_while_class_active: 'teacher-badge-warning',
  low_completion: 'teacher-badge-warning',
};

function formatPercent(value: number | null) {
  return value == null ? 'No score yet' : `${value}% average`;
}

export function TeacherAttentionRail({
  attentionStudents,
  onViewStudent,
}: {
  attentionStudents: AttentionStudent[];
  onViewStudent(studentId: string): void;
}) {
  const hasStudents = attentionStudents.length > 0;

  return (
    <section aria-labelledby="teacher-attention" className="teacher-section teacher-trail-step">
      <div className="flex items-end justify-between gap-4 border-b border-[var(--teacher-moss)]/20 pb-3">
        <div>
          <p className="teacher-eyebrow">Start here</p>
          <h2 id="teacher-attention" className="mt-1 font-display text-2xl font-bold text-[var(--teacher-ink)]">
            Students needing attention
          </h2>
        </div>
        {hasStudents ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--teacher-terracotta)]/15 font-display text-lg font-bold tabular-nums text-[var(--teacher-terracotta)]">
            {attentionStudents.length}
          </span>
        ) : (
          <span className="font-display text-3xl font-bold tabular-nums text-[var(--teacher-moss)]/60">0</span>
        )}
      </div>

      {!hasStudents ? (
        <p className="py-8 text-base font-semibold text-[var(--teacher-ink)]/65">
          No students need attention right now.
        </p>
      ) : (
        <ol className="mt-2 divide-y divide-[var(--teacher-moss)]/15">
          {attentionStudents.map((student, index) => (
            <li
              key={student.studentId}
              className="grid gap-4 py-5 transition-colors sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-center"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--teacher-terracotta)]/30 font-display text-sm font-bold tabular-nums text-[var(--teacher-terracotta)]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-bold text-[var(--teacher-ink)]">
                  {student.fullName}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {student.reasonCodes.map((reason) => (
                    <span
                      key={reason}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${REASON_BADGE_CLASS[reason]}`}
                    >
                      <AlertTriangle className="h-3 w-3" />
                      {REASON_LABELS[reason]}
                    </span>
                  ))}
                  <span className="text-sm font-semibold text-[var(--teacher-ink)]/55">
                    {formatPercent(student.averageScorePct)}
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-[var(--teacher-moss)]/30 text-[var(--teacher-ink)] sm:w-auto"
                aria-label={`View student ${student.fullName}`}
                onClick={() => onViewStudent(student.studentId)}
              >
                View student
              </Button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
