import type { TeacherClassSummary } from '@/lib/api/client';

export type TeacherClassSection = 'today' | 'students' | 'assignments' | 'reports';

export function teacherClassPath(
  classId: string,
  section: Exclude<TeacherClassSection, 'today'> | TeacherClassSection = 'today',
): string {
  const suffix = section === 'today' ? '' : `/${section}`;
  return `/teacher/classes/${encodeURIComponent(classId)}${suffix}`;
}

export function isArchivedClass(classroom: TeacherClassSummary): boolean {
  return classroom.archivedAt !== null;
}

export function splitTeacherClasses(classes: TeacherClassSummary[], archivedClasses: TeacherClassSummary[]) {
  return {
    active: classes.filter((classroom) => !isArchivedClass(classroom)),
    archived: archivedClasses.filter(isArchivedClass),
  };
}
