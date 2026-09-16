import { assertStringIncludes } from "jsr:@std/assert";

const teacherPage = await Deno.readTextFile(new URL("../../../src/pages/teacher.tsx", import.meta.url));
const assignmentDialog = await Deno.readTextFile(new URL("../../../src/components/teacher/TeacherAssignQuizDialog.tsx", import.meta.url));

Deno.test("teacher classroom exposes the assign quiz flow", () => {
  assertStringIncludes(teacherPage, "TeacherAssignQuizDialog");
  assertStringIncludes(assignmentDialog, "Assign Quiz");
  assertStringIncludes(assignmentDialog, "useCreateAssignment");
  assertStringIncludes(assignmentDialog, "classId");
  assertStringIncludes(assignmentDialog, "lessonId");
  assertStringIncludes(assignmentDialog, "assignment-name");
  assertStringIncludes(assignmentDialog, "Assign another");
  assertStringIncludes(assignmentDialog, "name");
});

Deno.test("teacher assignments page owns the assigned quizzes flow", () => {
  for (const required of [
    "TeacherAssignmentsPage", "useAssignments", "TeacherAssignedQuizzes",
    "TeacherAssignQuizDialog", "assignmentsLoading", "assignmentsError", "refetch",
    "buildTeacherAssignedQuizzes",
  ]) {
    assertStringIncludes(teacherPage, required);
  }
});
