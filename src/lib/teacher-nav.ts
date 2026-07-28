export const TEACHER_NAV_ITEMS = [
  { href: "/teacher", labelKey: "teacher.classes" },
  { href: "/teacher/reports", labelKey: "teacher.reports" },
  { href: "/teacher/settings", labelKey: "teacher.settings" },
] as const;

export function isTeacherNavActive(pathname: string, href: string): boolean {
  if (href === "/teacher") {
    return pathname === "/teacher"
      || pathname === "/teacher/classes"
      || pathname.startsWith("/teacher/classes/");
  }

  return pathname === href;
}
