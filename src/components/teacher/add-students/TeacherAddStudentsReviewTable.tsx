import { Button } from '@/components/ui';
import type { TeacherAddStudentDraft } from '@/lib/teacher-add-students';

export function TeacherAddStudentsReviewTable({
  rows,
  isSubmitting,
  error,
  onBack,
  onConfirm,
}: {
  rows: TeacherAddStudentDraft[];
  isSubmitting: boolean;
  error: string | null;
  onBack(): void;
  onConfirm(): void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-bold text-muted-foreground">
          Review {rows.length} student{rows.length === 1 ? '' : 's'} before
          creation.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-[24px] border-2 border-border bg-white">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-border bg-muted/40">
              <th className="p-4 font-bold text-muted-foreground">Last Name</th>
              <th className="p-4 font-bold text-muted-foreground">First Name</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={`${row.lastName}-${row.firstName}-${index}`}
                className="border-b border-border/60"
              >
                <td className="p-4 font-bold">{row.lastName}</td>
                <td className="p-4 font-bold">{row.firstName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && <p className="mt-4 text-sm font-bold text-destructive">{error}</p>}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button disabled={isSubmitting} onClick={onConfirm}>
          {isSubmitting ? 'Adding Students...' : 'Confirm And Create'}
        </Button>
      </div>
    </div>
  );
}
