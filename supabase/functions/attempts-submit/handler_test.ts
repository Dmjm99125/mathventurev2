import { assertEquals } from "jsr:@std/assert";
import { createAttemptsSubmitHandler } from "./handler.ts";

Deno.test("attempts-submit rejects malformed detailed game results", async () => {
  const handler = createAttemptsSubmitHandler({
    getAuthedProfile: async () => ({ id: "student-1", role: "student", full_name: "Student One" }),
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
  const handler = createAttemptsSubmitHandler({
    getAuthedProfile: async () => ({ id: "student-1", role: "student", full_name: "Student One" }),
    insertAttempt: async (input: { lessonId: string; score: number; maxScore: number }) => ({
      id: "attempt-1",
      lesson_id: input.lessonId,
      score: input.score,
      max_score: input.maxScore,
      completed_at: "2026-07-28T10:00:00.000Z",
    }),
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
