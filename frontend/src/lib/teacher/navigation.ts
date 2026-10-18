import { teacherClassPath } from './classes';

export const TEACHER_NAV_ITEMS = [
  { href: "/teacher", labelKey: "teacher.classes" },
  { href: "/teacher/settings", labelKey: "teacher.settings" },
] as const;

export function getTeacherWorkspaceNavItems(classId: string) {
  return [
    { href: teacherClassPath(classId), labelKey: "teacher.today" },
    { href: teacherClassPath(classId, 'students'), labelKey: "teacher.students" },
    { href: teacherClassPath(classId, 'assignments'), labelKey: "teacher.assignments" },
    { href: teacherClassPath(classId, 'reports'), labelKey: "teacher.reports" },
    ...TEACHER_NAV_ITEMS,
  ] as const;
}

export function isTeacherNavActive(pathname: string, href: string): boolean {
  const cleanPath = pathname.split("?")[0].split("#")[0];

  if (href === "/teacher") {
    return cleanPath === "/teacher";
  }

  if (href === "/teacher") return cleanPath === "/teacher";
  if (href.startsWith("/teacher/classes/")) {
    return cleanPath === href || cleanPath.startsWith(`${href}/`);
  }
  return cleanPath === href;
}
