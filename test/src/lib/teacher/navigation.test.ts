import { assertEquals } from "jsr:@std/assert";
import { TEACHER_NAV_ITEMS, isTeacherNavActive } from "../../../../src/lib/teacher/navigation.ts";

Deno.test("teacher nav exposes one canonical route per feature", () => {
  assertEquals(TEACHER_NAV_ITEMS, [
    { href: "/teacher", labelKey: "teacher.today" },
    { href: "/teacher/students", labelKey: "teacher.students" },
    { href: "/teacher/assignments", labelKey: "teacher.assignments" },
    { href: "/teacher/reports", labelKey: "teacher.reports" },
    { href: "/teacher/settings", labelKey: "teacher.settings" },
  ]);
});

Deno.test("teacher nav keeps legacy routes inside their canonical section", () => {
  assertEquals(isTeacherNavActive("/teacher", "/teacher"), true);
  assertEquals(isTeacherNavActive("/teacher/classes", "/teacher"), false);
  assertEquals(isTeacherNavActive("/teacher/students", "/teacher/students"), true);
  assertEquals(isTeacherNavActive("/teacher/classes/class-1", "/teacher/students"), false);
  assertEquals(isTeacherNavActive("/teacher/reports?window=30d", "/teacher/reports"), true);
  assertEquals(isTeacherNavActive("/teacher/reports/classes/class-1", "/teacher/reports"), true);
  assertEquals(isTeacherNavActive("/teacher/settings", "/teacher/reports"), false);
});
