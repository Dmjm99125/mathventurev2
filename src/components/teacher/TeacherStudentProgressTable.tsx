import type { TeacherClassStudent } from '@/lib/api';

function formatPct(value: number | null) {
  return value == null ? '--' : `${value}%`;
}

export function TeacherStudentProgressTable({
  students,
}: {
  students: TeacherClassStudent[];
}) {
  return (
    <div className="overflow-x-auto rounded-[24px] border-2 border-border bg-white">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-border bg-muted/40">
            <th className="p-4 font-bold text-muted-foreground">Last Name</th>
            <th className="p-4 font-bold text-muted-foreground">First Name</th>
            <th className="p-4 font-bold text-muted-foreground">% of app completed</th>
            <th className="p-4 font-bold text-muted-foreground">% on last played</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 && (
            <tr>
              <td colSpan={4} className="p-8 text-center font-bold text-muted-foreground">
                No detailed progress yet.
              </td>
            </tr>
          )}
          {students.map((student) => (
            <tr key={student.id} className="border-b border-border/60">
              <td className="p-4 font-bold">{student.lastName ?? '--'}</td>
              <td className="p-4 font-bold">{student.firstName}</td>
              <td className="p-4 font-bold">{formatPct(student.appCompletionPct)}</td>
              <td className="p-4 font-bold">{formatPct(student.lastPlayedPct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
