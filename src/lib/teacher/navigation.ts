export const TEACHER_NAV_ITEMS = [
  { href: "/teacher", labelKey: "teacher.today" },
  { href: "/teacher/students", labelKey: "teacher.students" },
  { href: "/teacher/assignments", labelKey: "teacher.assignments" },
  { href: "/teacher/reports", labelKey: "teacher.reports" },
  { href: "/teacher/settings", labelKey: "teacher.settings" },
] as const;

export function isTeacherNavActive(pathname: string, href: string): boolean {
  const cleanPath = pathname.split("?")[0].split("#")[0];

  if (href === "/teacher") {
    return cleanPath === "/teacher";
  }

  if (href === "/teacher/students") {
    return cleanPath === "/teacher/students";
  }

  if (href === "/teacher/assignments") {
    return cleanPath === "/teacher/assignments";
  }

  if (href === "/teacher/reports") {
    return cleanPath === "/teacher/reports"
      || cleanPath.startsWith("/teacher/reports/");
  }

  return cleanPath === href;
}
