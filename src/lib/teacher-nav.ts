export const TEACHER_NAV_ITEMS = [
  { href: "/teacher", labelKey: "teacher.classes" },
  { href: "/teacher/reports", labelKey: "teacher.reports" },
  { href: "/teacher/settings", labelKey: "teacher.settings" },
] as const;

export function isTeacherNavActive(pathname: string, href: string): boolean {
  const cleanPath = pathname.split("?")[0].split("#")[0];

  if (href === "/teacher") {
    return cleanPath === "/teacher"
      || cleanPath === "/teacher/classes"
      || cleanPath.startsWith("/teacher/classes/");
  }

  if (href === "/teacher/reports") {
    return cleanPath === "/teacher/reports"
      || cleanPath.startsWith("/teacher/reports/");
  }

  return cleanPath === href;
}
