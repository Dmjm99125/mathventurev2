import { Button } from '@/components/ui';
import type { TeacherClassStudent } from '@/lib/api';

export function TeacherStudentListTable({
  students,
  onRemove,
}: {
  students: TeacherClassStudent[];
  onRemove(student: TeacherClassStudent): void;
}) {
  return (
    <div className="overflow-x-auto rounded-[24px] border-2 border-border bg-white">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-border bg-muted/40">
            <th className="p-4 font-bold text-muted-foreground">Last Name</th>
            <th className="p-4 font-bold text-muted-foreground">First Name</th>
            <th className="p-4 font-bold text-muted-foreground">Added/Joined</th>
            <th className="p-4 text-right font-bold text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 && (
            <tr>
              <td colSpan={4} className="p-8 text-center font-bold text-muted-foreground">
                No students have joined this class yet.
              </td>
            </tr>
          )}
          {students.map((student) => (
            <tr key={student.id} className="border-b border-border/60">
              <td className="p-4 font-bold">{student.lastName ?? '--'}</td>
              <td className="p-4 font-bold">{student.firstName}</td>
              <td className="p-4 font-bold text-muted-foreground">
                {new Date(student.joinedAt).toLocaleDateString()}
              </td>
              <td className="p-4 text-right">
                <Button variant="danger" size="sm" onClick={() => onRemove(student)}>
                  Remove
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
