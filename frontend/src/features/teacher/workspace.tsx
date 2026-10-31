import { TeacherAssignmentsPage } from '@features/teacher/assignments';
import { TeacherReportsPage } from '@features/teacher/reports';
import { TeacherStudentsPage } from '@features/teacher/students';
import { TeacherTodayPage } from '@features/teacher/today';
import type { TeacherClassSection } from '@features/teacher/model/classes';

export function TeacherClassWorkspacePage({
  classId,
  section = 'today',
}: {
  classId: string;
  section?: TeacherClassSection;
}) {
  if (section === 'students') return <TeacherStudentsPage classId={classId} />;
  if (section === 'assignments') return <TeacherAssignmentsPage classId={classId} />;
  if (section === 'reports') return <TeacherReportsPage classId={classId} />;
  return <TeacherTodayPage classId={classId} />;
}
