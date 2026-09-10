import { assertEquals } from "jsr:@std/assert";
import type { AssignmentForTeacher, TeacherClassStudent } from "../../../../src/lib/api/client.ts";
import { buildTeacherAssignedQuizzes } from "../../../../src/lib/teacher/assigned-quizzes.ts";
import { buildTeacherAssignedQuizPdfModel } from "../../../../src/lib/teacher/assigned-quizzes-pdf.ts";

const assignment: AssignmentForTeacher = {
  id: "quiz-1", name: "Addition Check", lessonId: "addition", classId: "class-1",
  className: "Room 1", studentId: null, dueAt: "2026-09-30T00:00:00Z", createdAt: "2026-09-01T00:00:00Z",
};

const student: TeacherClassStudent = {
  id: "student-1", fullName: "Ada Lovelace", firstName: "Ada", lastName: "Lovelace",
  joinedAt: "2026-08-01T00:00:00Z", appCompletionPct: 50, lastPlayedPct: 80,
  overallScore: 8, overallMaxScore: 10, overallScorePct: 80, gameScores: [],
  assignments: [{
    assignmentId: "quiz-1", name: "Addition Check", lessonId: "addition", dueAt: assignment.dueAt,
    createdAt: assignment.createdAt, status: "completed", overallScore: 8, overallMaxScore: 10,
    overallScorePct: 80,
    gameScores: [
      { gameId: "addition:0", score: 1, maxScore: 1, scorePct: 100, completedAt: "2026-09-02T00:00:00Z" },
    ],
  }],
};

Deno.test("buildTeacherAssignedQuizPdfModel includes summary and every quiz-mode game", () => {
  const [quiz] = buildTeacherAssignedQuizzes([assignment], [student]);
  const model = buildTeacherAssignedQuizPdfModel(quiz, "2026-09-10T00:00:00Z");

  assertEquals(model.filename, "quiz-addition-check-results.pdf");
  assertEquals(model.assignedAt, "2026-09-01");
  assertEquals(model.dueAt, "2026-09-30");
  assertEquals(model.summaryRows[0], ["Lovelace", "Ada", "8 / 10 (80%)", "Completed"]);
  assertEquals(model.studentSections[0].studentName, "Lovelace, Ada");
  assertEquals(model.studentSections[0].gameRows.length, 15);
  assertEquals(model.studentSections[0].gameRows[0], ["1", "addition-1", "1 / 1 (100%)", "2026-09-02"]);
  assertEquals(model.studentSections[0].gameRows[1], ["2", "addition-2", "--", "--"]);
});

Deno.test("buildTeacherAssignedQuizPdfModel preserves unstarted quiz rows", () => {
  const [quiz] = buildTeacherAssignedQuizzes([assignment], [{
    ...student,
    id: "student-2",
    fullName: "Grace Hopper",
    firstName: "Grace",
    lastName: "Hopper",
    assignments: [],
  }]);
  const model = buildTeacherAssignedQuizPdfModel(quiz, "2026-09-10T00:00:00Z");

  assertEquals(model.summaryRows[0], ["Hopper", "Grace", "--", "Not started"]);
  assertEquals(model.studentSections[0].status, "Not started");
  assertEquals(model.studentSections[0].gameRows.every((row) => row[2] === "--"), true);
});
