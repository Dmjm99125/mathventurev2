import { Button } from '@/components/ui';
import type { TeacherClassStudent } from '@/lib/api';

export function TeacherStudentListTable({
  students,
  onRemove,
  onView,
  viewingStudentId = null,
}: {
  students: TeacherClassStudent[];
  onRemove(student: TeacherClassStudent): void;
  onView(student: TeacherClassStudent): void;
  viewingStudentId?: string | null;
}) {
  return (
    <div className="teacher-table min-w-0 overflow-x-auto rounded-2xl border border-[var(--teacher-moss)]/20 bg-[var(--teacher-oat)]/45">
      <table aria-label="Student roster" className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-b border-[var(--teacher-moss)]/20 bg-[var(--teacher-sage)]/18">
            <th className="whitespace-nowrap p-4 text-sm font-bold text-[var(--teacher-ink)]/65">Last Name</th>
            <th className="whitespace-nowrap p-4 text-sm font-bold text-[var(--teacher-ink)]/65">First Name</th>
            <th className="whitespace-nowrap p-4 text-sm font-bold text-[var(--teacher-ink)]/65">Added/Joined</th>
            <th className="whitespace-nowrap p-4 text-right text-sm font-bold text-[var(--teacher-ink)]/65">Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 && (
            <tr>
              <td colSpan={4} className="p-8 text-center font-semibold text-[var(--teacher-ink)]/65">
                No students have joined this class yet.
              </td>
            </tr>
          )}
          {students.map((student) => (
            <tr key={student.id} className="border-b border-[var(--teacher-moss)]/15 last:border-b-0">
              <td className="whitespace-nowrap p-4 font-bold text-[var(--teacher-ink)]">{student.lastName ?? '--'}</td>
              <td className="whitespace-nowrap p-4 font-bold text-[var(--teacher-ink)]">{student.firstName}</td>
              <td className="whitespace-nowrap p-4 font-semibold tabular-nums text-[var(--teacher-ink)]/65">
                {new Date(student.joinedAt).toLocaleDateString()}
              </td>
              <td className="whitespace-nowrap p-4 text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[var(--teacher-moss)]/30 text-[var(--teacher-ink)]"
                    onClick={() => onView(student)}
                    disabled={viewingStudentId === student.id}
                  >
                    {viewingStudentId === student.id ? 'Viewing' : 'View Account'}
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => onRemove(student)}>
                    Remove
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
