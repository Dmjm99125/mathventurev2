import { assertEquals } from "jsr:@std/assert";
import { STUDENT_NAV_ITEMS, isStudentNavActive } from "./student-nav.ts";

Deno.test("student nav exposes only the basecamp route", () => {
  assertEquals(STUDENT_NAV_ITEMS, [
    { href: "/student", labelKey: "student.dashboard" },
  ]);
});

Deno.test("student nav keeps basecamp active across lesson and class drill-down routes", () => {
  assertEquals(isStudentNavActive("/student", "/student"), true);
  assertEquals(isStudentNavActive("/student/lessons", "/student"), true);
  assertEquals(isStudentNavActive("/student/lessons/colors?classId=class-1", "/student"), true);
  assertEquals(isStudentNavActive("/student/classes/class-1", "/student"), true);
  assertEquals(isStudentNavActive("/teacher", "/student"), false);
});
