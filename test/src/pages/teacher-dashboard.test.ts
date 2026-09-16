import { assertEquals, assertStringIncludes } from "jsr:@std/assert";

const page = await Deno.readTextFile(new URL("../../../src/pages/teacher.tsx", import.meta.url));

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
