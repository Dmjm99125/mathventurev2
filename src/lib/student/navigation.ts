export const STUDENT_NAV_ITEMS = [
  { href: "/student", labelKey: "student.dashboard" },
] as const;

export function isStudentNavActive(pathname: string, href: string): boolean {
  const cleanPath = pathname.split("?")[0].split("#")[0];

  if (href === "/student") {
    return cleanPath === "/student"
      || cleanPath === "/student/lessons"
      || cleanPath.startsWith("/student/lessons/")
      || cleanPath === "/student/classroom";
  }

  return cleanPath === href;
}
