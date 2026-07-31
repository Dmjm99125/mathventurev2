import { assertEquals } from "jsr:@std/assert";
import { TEACHER_NAV_ITEMS, isTeacherNavActive } from "../../../../src/lib/teacher/navigation.ts";

Deno.test("teacher nav exposes the approved classes/reports/settings routes", () => {
  assertEquals(TEACHER_NAV_ITEMS, [
    { href: "/teacher", labelKey: "teacher.classes" },
    { href: "/teacher/reports", labelKey: "teacher.reports" },
    { href: "/teacher/settings", labelKey: "teacher.settings" },
  ]);
});

Deno.test("teacher nav keeps reports active for report routes and drill-down pages", () => {
  assertEquals(isTeacherNavActive("/teacher/classes/class-1", "/teacher"), true);
  assertEquals(isTeacherNavActive("/teacher/reports?window=30d", "/teacher/reports"), true);
  assertEquals(isTeacherNavActive("/teacher/reports/classes/class-1", "/teacher/reports"), true);
  assertEquals(isTeacherNavActive("/teacher/reports", "/teacher/reports"), true);
  assertEquals(isTeacherNavActive("/teacher/settings", "/teacher/reports"), false);
});
