import { assertEquals } from "jsr:@std/assert";
import type { AssignmentForTeacher, TeacherClassStudent } from "../../../../src/lib/api/client.ts";
import { buildTeacherAssignedQuizzes } from "../../../../src/lib/teacher/assigned-quizzes.ts";

const students: TeacherClassStudent[] = [
  {
    id: "student-1", fullName: "Ada Lovelace", firstName: "Ada", lastName: "Lovelace",
    joinedAt: "2026-08-01T00:00:00Z", appCompletionPct: 50, lastPlayedPct: 80,
    overallScore: 8, overallMaxScore: 10, overallScorePct: 80, gameScores: [],
    assignments: [{
      assignmentId: "quiz-1", name: "Addition Check", lessonId: "addition",
      dueAt: null, createdAt: "2026-08-20T00:00:00Z", status: "completed",
      overallScore: 8, overallMaxScore: 10, overallScorePct: 80,
      gameScores: [{ gameId: "addition", score: 8, maxScore: 10, scorePct: 80, completedAt: "2026-08-21T00:00:00Z" }],
    }],
  },
  {
    id: "student-2", fullName: "Grace Hopper", firstName: "Grace", lastName: "Hopper",
    joinedAt: "2026-08-02T00:00:00Z", appCompletionPct: null, lastPlayedPct: null,
    overallScore: null, overallMaxScore: null, overallScorePct: null, gameScores: [], assignments: [],
  },
];

const classAssignment: AssignmentForTeacher = {
  id: "quiz-1", name: "Addition Check", lessonId: "addition", classId: "class-1",
  className: "Room 1", studentId: null, dueAt: null, createdAt: "2026-08-20T00:00:00Z",
};

Deno.test("joins class assignments to scored and unstarted students", () => {
  const [quiz] = buildTeacherAssignedQuizzes([classAssignment], students);

  assertEquals(quiz.students.map((student) => student.id), ["student-1", "student-2"]);
  assertEquals(quiz.students[0].overallScorePct, 80);
  assertEquals(quiz.students[0].gameScores[0].gameId, "addition");
  assertEquals(quiz.students[1].status, "not_started");
  assertEquals(quiz.students[1].overallScore, null);
  assertEquals(quiz.students[1].gameScores, []);
});

Deno.test("limits directly targeted assignments to the target student", () => {
  const targeted = { ...classAssignment, id: "quiz-2", classId: null, studentId: "student-2" };

  assertEquals(buildTeacherAssignedQuizzes([targeted], students)[0].students.map((student) => student.id), ["student-2"]);
});
