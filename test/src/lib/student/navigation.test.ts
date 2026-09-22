import { assertEquals } from "jsr:@std/assert";
import { STUDENT_NAV_ITEMS, isStudentNavActive } from "../../../../src/lib/student/navigation.ts";

Deno.test("student nav exposes lessons and classroom routes", () => {
  assertEquals(STUDENT_NAV_ITEMS, [
    { href: "/student", labelKey: "student.dashboard" },
    { href: "/student/classroom", labelKey: "student.classroom" },
  ]);
});

Deno.test("student nav keeps lessons active across lesson routes", () => {
  assertEquals(isStudentNavActive("/student", "/student"), true);
  assertEquals(isStudentNavActive("/student/lessons", "/student"), true);
  assertEquals(isStudentNavActive("/student/lessons/colors?classId=class-1", "/student"), true);
  assertEquals(isStudentNavActive("/student/classroom", "/student"), false);
  assertEquals(isStudentNavActive("/teacher", "/student"), false);
});

Deno.test("student nav keeps classroom active only on the classroom route", () => {
  assertEquals(isStudentNavActive("/student/classroom", "/student/classroom"), true);
  assertEquals(isStudentNavActive("/student/lessons/colors?returnTo=class", "/student/classroom"), false);
});
