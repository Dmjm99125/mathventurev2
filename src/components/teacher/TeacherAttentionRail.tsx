import { Button } from '@/components/ui';
import type { TeacherSingleClassroomReportPayload } from '@/lib/teacher/reports';

type AttentionStudent = TeacherSingleClassroomReportPayload['attentionStudents'][number];

const REASON_LABELS: Record<AttentionStudent['reasonCodes'][number], string> = {
  low_average: 'Low average score',
  inactive_while_class_active: 'Has not started',
  low_completion: 'Low completion',
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
  return (
    <section aria-labelledby="teacher-attention" className="teacher-section teacher-trail-step">
      <div className="flex items-end justify-between gap-4 border-b border-[var(--teacher-moss)]/20 pb-3">
        <div>
          <p className="teacher-eyebrow">Start here</p>
          <h2 id="teacher-attention" className="mt-1 font-display text-2xl font-bold text-[var(--teacher-ink)]">
            Students needing attention
          </h2>
        </div>
        <span className="font-display text-3xl font-bold tabular-nums text-[var(--teacher-terracotta)]">
          {attentionStudents.length}
        </span>
      </div>

      {attentionStudents.length === 0 ? (
        <p className="py-8 text-base font-semibold text-[var(--teacher-ink)]/65">
          No students need attention right now.
        </p>
      ) : (
        <ol className="mt-2 divide-y divide-[var(--teacher-moss)]/15">
          {attentionStudents.map((student, index) => (
            <li key={student.studentId} className="grid gap-4 py-5 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-center">
              <span className="font-display text-2xl font-bold tabular-nums text-[var(--teacher-terracotta)]/75">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-xl font-bold text-[var(--teacher-ink)]">{student.fullName}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {student.reasonCodes.map((reason) => (
                    <span key={reason} className="rounded-full bg-[var(--teacher-ochre)]/18 px-2.5 py-1 text-xs font-bold text-[var(--teacher-ink)]">
                      {REASON_LABELS[reason]}
                    </span>
                  ))}
                  <span className="text-sm font-semibold text-[var(--teacher-ink)]/65">{formatPercent(student.averageScorePct)}</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
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
