import { assertEquals } from "jsr:@std/assert";
import {
  createAssignmentQuizHandler,
  type AssignmentQuizAttempt,
  type AssignmentQuizDeps,
  type AssignmentQuizGameResult,
} from "../../../../supabase/functions/assignment-quiz/handler.ts";

const assignment = {
  lessonId: "sequencing",
  classId: "class-1",
  studentId: null,
};

function makeAttempt(overrides: Partial<AssignmentQuizAttempt> = {}): AssignmentQuizAttempt {
  return {
    id: "attempt-1",
    studentId: "student-1",
    assignmentId: "assignment-1",
    lessonId: "sequencing",
    status: "in_progress",
    quizMode: true,
    currentGameOrder: 0,
    score: 0,
    maxScore: 0,
    durationSeconds: null,
    startedAt: "2026-08-27T00:00:00.000Z",
    updatedAt: "2026-08-27T00:00:00.000Z",
    completedAt: null,
    ...overrides,
  };
}

function makeDeps(initialAttempt: AssignmentQuizAttempt | null = null) {
  let attempt = initialAttempt;
  const gameResults: AssignmentQuizGameResult[] = [];
  const deps: AssignmentQuizDeps = {
    getAuthedProfile: async () => ({ id: "student-1", role: "student", full_name: "Student" }),
    getAssignmentContext: async () => assignment,
    isStudentEnrolledInClass: async () => true,
    getAttempt: async () => attempt,
    createAttempt: async (input) => {
      attempt = makeAttempt({
        ...input,
        id: "attempt-1",
        startedAt: "2026-08-27T00:00:00.000Z",
        updatedAt: "2026-08-27T00:00:00.000Z",
        completedAt: null,
      });
      return attempt;
    },
    updateAttempt: async (_studentId, _attemptId, input) => {
      attempt = makeAttempt({ ...attempt!, ...(input as Partial<AssignmentQuizAttempt>), updatedAt: "2026-08-27T00:01:00.000Z" });
      return attempt;
    },
    listGameResults: async () => [...gameResults],
    upsertGameResult: async (input) => {
      const index = gameResults.findIndex((row) => row.gameId === input.gameId);
      if (index >= 0) gameResults[index] = input;
      else gameResults.push(input);
    },
  };
  return { deps, getAttempt: () => attempt, gameResults };
}

function request(body?: Record<string, unknown>, method = "POST") {
  return new Request("http://local/assignment-quiz", {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

Deno.test("assignment-quiz start creates a draft and resume returns its checkpoint state", async () => {
  const { deps } = makeDeps();
  const handler = createAssignmentQuizHandler(deps);

  const start = await handler(request({
    action: "start",
    assignmentId: "assignment-1",
    lessonId: "sequencing",
  }));
  assertEquals(start.status, 201);
  assertEquals((await start.json()).state.status, "in_progress");

  const resume = await handler(request({
    action: "start",
    assignmentId: "assignment-1",
    lessonId: "sequencing",
  }));
  assertEquals(resume.status, 200);
  assertEquals((await resume.json()).state.currentGameOrder, 0);
});

Deno.test("assignment-quiz checkpoint advances only from the current game", async () => {
  const { deps, getAttempt, gameResults } = makeDeps(makeAttempt());
  const handler = createAssignmentQuizHandler(deps);

  const result = {
    topicId: "sequencing",
    gameId: "sequencing:0",
    gameOrder: 0,
    score: 1,
    maxScore: 1,
  };
  const response = await handler(request({
    action: "checkpoint",
    assignmentId: "assignment-1",
    lessonId: "sequencing",
    score: 1,
    gameResult: result,
  }));

  assertEquals(response.status, 200);
  assertEquals(getAttempt()?.currentGameOrder, 1);
  assertEquals(gameResults.map(({ topicId, gameId, gameOrder, score, maxScore }) => ({
    topicId,
    gameId,
    gameOrder,
    score,
    maxScore,
  })), [result]);

  const outOfOrder = await handler(request({
    action: "checkpoint",
    assignmentId: "assignment-1",
    lessonId: "sequencing",
    score: 2,
    gameResult: { ...result, gameOrder: 2, gameId: "sequencing:2" },
  }));
  assertEquals(outOfOrder.status, 409);
  assertEquals((await outOfOrder.json()).error, "Checkpoint is out of order");
});

Deno.test("assignment-quiz rejects a checkpoint whose game id does not match the current game", async () => {
  const { deps } = makeDeps(makeAttempt());
  const handler = createAssignmentQuizHandler(deps);

  const response = await handler(request({
    action: "checkpoint",
    assignmentId: "assignment-1",
    lessonId: "sequencing",
    score: 1,
    gameResult: {
      topicId: "sequencing",
      gameId: "addition:0",
      gameOrder: 0,
      score: 1,
      maxScore: 1,
    },
  }));

  assertEquals(response.status, 422);
  assertEquals((await response.json()).error, "gameResult is invalid");
});

Deno.test("assignment-quiz completion requires the current game result", async () => {
  const { deps } = makeDeps(makeAttempt({ currentGameOrder: 1 }));
  const handler = createAssignmentQuizHandler(deps);

  const response = await handler(request({
    action: "complete",
    assignmentId: "assignment-1",
    lessonId: "sequencing",
    score: 1,
    maxScore: 10,
    gameResults: [],
  }));

  assertEquals(response.status, 409);
  assertEquals((await response.json()).error, "Complete the current game before submitting the quiz");
});

Deno.test("assignment-quiz completion locks the assignment and repeats return the saved result", async () => {
  const completed = makeAttempt({
    status: "completed",
    currentGameOrder: 10,
    score: 8,
    maxScore: 10,
    completedAt: "2026-08-27T00:10:00.000Z",
  });
  const { deps } = makeDeps(completed);
  const handler = createAssignmentQuizHandler(deps);

  const response = await handler(request({
    action: "complete",
    assignmentId: "assignment-1",
    lessonId: "sequencing",
    score: 8,
    maxScore: 10,
    gameResults: [],
  }));

  assertEquals(response.status, 200);
  assertEquals((await response.json()).state.status, "completed");
});

Deno.test("assignment-quiz rejects a topic that does not match the assignment", async () => {
  const { deps } = makeDeps();
  const handler = createAssignmentQuizHandler(deps);
  const response = await handler(request({
    action: "start",
    assignmentId: "assignment-1",
    lessonId: "addition",
  }));

  assertEquals(response.status, 422);
  assertEquals((await response.json()).error, "lessonId does not match the assignment");
});

Deno.test("assignment-quiz start recovers from a concurrent draft insert", async () => {
  const savedAttempt = makeAttempt();
  let lookupCount = 0;
  const { deps: baseDeps } = makeDeps();
  const deps: AssignmentQuizDeps = {
    ...baseDeps,
    getAttempt: async () => {
      lookupCount += 1;
      return lookupCount === 1 ? null : savedAttempt;
    },
    createAttempt: async () => {
      throw new Error("duplicate key value violates unique constraint");
    },
  };
  const handler = createAssignmentQuizHandler(deps);

  const response = await handler(request({
    action: "start",
    assignmentId: "assignment-1",
    lessonId: "sequencing",
  }));

  assertEquals(response.status, 200);
  assertEquals((await response.json()).state.attemptId, "attempt-1");
});
