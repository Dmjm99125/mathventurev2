import { assertEquals } from "jsr:@std/assert";
import {
  createAttemptsSubmitHandler,
  resolveAttemptClassId,
} from "./handler.ts";

Deno.test("resolveAttemptClassId uses the assignment class when the student still belongs to it", async () => {
  const classId = await resolveAttemptClassId(
    {
      studentId: "student-1",
      assignmentId: "assignment-1",
      requestedClassId: null,
    },
    {
      getAssignmentContext: async () => ({
        classId: "class-a",
        studentId: null,
      }),
      isStudentEnrolledInClass: async () => true,
      getStudentSingletonClassId: async () => null,
    },
  );

  assertEquals(classId, "class-a");
});

Deno.test("resolveAttemptClassId infers the classroom for free-play attempts when classId is omitted", async () => {
  const classId = await resolveAttemptClassId(
    {
      studentId: "student-a",
      assignmentId: null,
      requestedClassId: null,
    },
    {
      getAssignmentContext: async () => null,
      isStudentEnrolledInClass: async () => true,
      getStudentSingletonClassId: async () => "classroom-1",
    },
  );

  assertEquals(classId, "classroom-1");
});

Deno.test("attempts-submit rejects malformed detailed game results", async () => {
  const handler = createAttemptsSubmitHandler({
    getAuthedProfile: async () => ({ id: "student-1", role: "student", full_name: "Student One" }),
    resolveAttemptClassId: async () => {
      throw new Error("should not resolve a class");
    },
    insertAttempt: async () => {
      throw new Error("should not insert");
    },
    insertAttemptGameResults: async () => {
      throw new Error("should not insert child rows");
    },
  });

  const response = await handler(new Request("http://local/attempts-submit", {
    method: "POST",
    body: JSON.stringify({
      lessonId: "colors",
      score: 6,
      maxScore: 7,
      gameResults: [{ topicId: "colors", gameId: "", gameOrder: 0, score: 1, maxScore: 1 }],
    }),
  }));

  assertEquals(response.status, 422);
});

Deno.test("attempts-submit inserts the parent attempt and detailed game rows", async () => {
  let insertedRows: unknown[] = [];
  let insertedAttempt: unknown;
  const handler = createAttemptsSubmitHandler({
    getAuthedProfile: async () => ({ id: "student-1", role: "student", full_name: "Student One" }),
    resolveAttemptClassId: async () => "class-a",
    insertAttempt: async (
      input: {
        lessonId: string;
        score: number;
        maxScore: number;
        classId: string | null;
      },
    ) => {
      insertedAttempt = input;
      return {
        id: "attempt-1",
        lesson_id: input.lessonId,
        score: input.score,
        max_score: input.maxScore,
        completed_at: "2026-07-28T10:00:00.000Z",
      };
    },
    insertAttemptGameResults: async (rows: unknown[]) => {
      insertedRows = rows;
    },
  });

  const response = await handler(new Request("http://local/attempts-submit", {
    method: "POST",
    body: JSON.stringify({
      lessonId: "colors",
      score: 6,
      maxScore: 7,
      gameResults: [{ topicId: "colors", gameId: "colors:0", gameOrder: 0, score: 1, maxScore: 1 }],
    }),
  }));

  assertEquals(response.status, 201);
  assertEquals(insertedAttempt, {
    studentId: "student-1",
    lessonId: "colors",
    assignmentId: null,
    score: 6,
    maxScore: 7,
    durationSeconds: null,
    classId: "class-a",
  });
  assertEquals(insertedRows, [{
    attemptId: "attempt-1",
    studentId: "student-1",
    topicId: "colors",
    gameId: "colors:0",
    gameOrder: 0,
    score: 1,
    maxScore: 1,
    scorePct: 100,
    passed: true,
    completedAt: "2026-07-28T10:00:00.000Z",
  }]);
});
