import { assertEquals, assertStringIncludes } from "jsr:@std/assert";

const page = await Deno.readTextFile(new URL("../../../src/pages/teacher.tsx", import.meta.url));
const app = await Deno.readTextFile(new URL("../../../src/App.tsx", import.meta.url));

Deno.test("teacher pages expose one owner per feature", () => {
  for (const required of [
    "TeacherTodayPage",
    "TeacherStudentsPage",
    "TeacherAssignmentsPage",
    "TeacherReportsPage",
    "TeacherSettingsPage",
  ]) {
    assertStringIncludes(page, required);
  }

  assertEquals((page.match(/TeacherAddStudentsDialog/g) ?? []).length > 0, true);
  assertEquals((page.match(/TeacherAssignQuizDialog/g) ?? []).length > 0, true);
});

Deno.test("App routes canonical teacher destinations and legacy redirects", () => {
  for (const required of [
    'path="/teacher/students"',
    'path="/teacher/assignments"',
    'path="/teacher/reports"',
    'path="/teacher/settings"',
    'path="/teacher/classes"',
    'path="/teacher/classes/:classId"',
    'path="/teacher/reports/classes/:classId"',
  ]) {
    assertStringIncludes(app, required);
  }
});
