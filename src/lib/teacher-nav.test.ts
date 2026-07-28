import { assertEquals } from "jsr:@std/assert";
import { TEACHER_NAV_ITEMS, isTeacherNavActive } from "./teacher-nav.ts";

Deno.test("teacher nav exposes the approved classes/reports/settings routes", () => {
  assertEquals(TEACHER_NAV_ITEMS, [
    { href: "/teacher", labelKey: "teacher.classes" },
    { href: "/teacher/reports", labelKey: "teacher.reports" },
    { href: "/teacher/settings", labelKey: "teacher.settings" },
  ]);
});

Deno.test("teacher nav treats class detail pages as part of My Classes", () => {
  assertEquals(isTeacherNavActive("/teacher/classes/class-1", "/teacher"), true);
  assertEquals(isTeacherNavActive("/teacher/reports", "/teacher/reports"), true);
  assertEquals(isTeacherNavActive("/teacher/settings", "/teacher/reports"), false);
});
