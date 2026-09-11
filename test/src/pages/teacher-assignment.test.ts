import { assertStringIncludes } from "jsr:@std/assert";

const teacherPage = await Deno.readTextFile(new URL("../../../src/pages/teacher.tsx", import.meta.url));
const assignmentDialog = await Deno.readTextFile(new URL("../../../src/components/teacher/TeacherAssignQuizDialog.tsx", import.meta.url));
const assignedQuizzes = await Deno.readTextFile(new URL("../../../src/components/teacher/TeacherAssignedQuizzes.tsx", import.meta.url));

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

Deno.test("teacher classroom exposes the assigned quizzes view selector", () => {
  for (const required of [
    "useAssignments", "TeacherAssignedQuizzes", "Select", "Student List",
    "Student Progress", "Quizzes Assigned", "useState<'students' | 'progress' | 'assignments'>('students')",
    "assignmentsLoading", "assignmentsError", "refetch",
  ]) {
    assertStringIncludes(teacherPage, required);
  }
});

Deno.test("teacher assigned quizzes expose edit and delete controls", () => {
  for (const required of [
    "useUpdateAssignment", "useDeleteAssignment", "Edit quiz", "Delete this quiz?",
    "edit-assignment-name", "edit-assignment-due", "Save changes", "Delete quiz",
  ]) {
    assertStringIncludes(assignedQuizzes, required);
  }
});
