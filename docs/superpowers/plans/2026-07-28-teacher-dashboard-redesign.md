# Teacher Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the classroom-style teacher home and class workspace, add accurate per-game progress tracking with a `75%` pass threshold, and support removing a student from a class without affecting the student account or past progress.

**Architecture:** Keep the existing teacher route family, but render teacher pages inside `AppLayout` with `sidebarMode="hidden"` and draw a custom classroom board inside the page content. Add a shared stable game catalog, persist detailed per-game results in a new child table under topic attempts, aggregate teacher progress from those detailed rows only, and expose a dedicated remove-student edge function for class membership changes.

**Tech Stack:** React 19, TypeScript, Wouter, TanStack React Query, Supabase Edge Functions (Deno), PostgreSQL migrations, Tailwind CSS 4, Deno tests, `tsc`, Vite

## Global Constraints

- `My Classes` must be the teacher landing page.
- `Reports` and `Settings` stay visible in the teacher navigation but remain placeholders for now.
- `Student Progress` must be based on real per-game results, not topic-level averages.
- A game counts as completed only when the student earns at least `75%` on that game.
- `% on last played` must come from the student’s latest individual game result, not from the latest topic aggregate.
- `Added/Joined` is a date display, not a status label.
- The `+ Add` control is visible in the class workspace to match the sketch, but it does not receive a real add-student workflow in this phase.
- If database changes are needed, each new schema change must be created as its own new PostgreSQL migration file rather than editing old migration files.
- `progress tables must not fabricate detailed game history from them`

---

## File Map

- Create: `src/lib/game-catalog.ts`
  Responsibility: stable list of all playable games, keyed by topic and game order, available to both teacher progress math and lesson submission code.
- Create: `src/lib/game-catalog.test.ts`
  Responsibility: prove the catalog order, total count, and lookup behavior stay stable.
- Create: `src/lib/teacher-progress.ts`
  Responsibility: shared pure helpers for pass/fail, completion percent, and last-played percent calculations.
- Create: `src/lib/teacher-progress.test.ts`
  Responsibility: prove progress math uses the `75%` rule, dedupes by game id, and picks the newest detailed result.
- Create: `supabase/migrations/0005_attempt_game_results.sql`
  Responsibility: add the new detailed per-game result table and its indexes.
- Create: `supabase/functions/attempts-submit/handler.ts`
  Responsibility: validate the new request body, insert the parent attempt row, and persist the detailed child rows.
- Create: `supabase/functions/attempts-submit/handler_test.ts`
  Responsibility: verify validation and insert payloads without hitting live Supabase.
- Modify: `supabase/functions/attempts-submit/index.ts`
  Responsibility: thin Deno entrypoint that delegates to the new handler.
- Create: `supabase/functions/classes-roster/handler.ts`
  Responsibility: load class students, aggregate detailed per-game progress, and shape the class workspace response.
- Create: `supabase/functions/classes-roster/handler_test.ts`
  Responsibility: verify name shaping, `--`/`null` progress behavior, and detailed progress aggregation.
- Modify: `supabase/functions/classes-roster/index.ts`
  Responsibility: thin Deno entrypoint that delegates to the new handler.
- Create: `supabase/functions/classes-remove-student/handler.ts`
  Responsibility: teacher-only class-membership removal with confirmation-safe semantics.
- Create: `supabase/functions/classes-remove-student/handler_test.ts`
  Responsibility: verify only the membership row is removed and unauthorized access fails closed.
- Create: `supabase/functions/classes-remove-student/index.ts`
  Responsibility: thin Deno entrypoint that delegates to the new handler.
- Create: `src/lib/teacher-nav.ts`
  Responsibility: single source of truth for teacher rail items and active-route matching.
- Create: `src/lib/teacher-nav.test.ts`
  Responsibility: prove `/teacher/classes/:id` stays under `My Classes` and placeholder routes map correctly.
- Modify: `src/lib/api.ts`
  Responsibility: add client types for detailed game results, teacher roster rows, and class-student removal.
- Modify: `src/lib/hooks.ts`
  Responsibility: expose mutations/queries for the new teacher class workspace contract.
- Modify: `src/lib/useLanguage.tsx`
  Responsibility: rename teacher navigation copy from dashboard/assignments to classes/reports/settings.
- Modify: `src/components/layout.tsx`
  Responsibility: make the teacher top-nav dropdown use the same classes/reports/settings route source of truth as the classroom board.
- Create: `src/components/teacher/TeacherWorkspaceBoard.tsx`
  Responsibility: draw the sketch-inspired classroom board, teacher rail, and shared content frame.
- Create: `src/components/teacher/TeacherClassCard.tsx`
  Responsibility: render one class card with name, join code, and `Enter`.
- Create: `src/components/teacher/TeacherStudentListTable.tsx`
  Responsibility: render `Last Name`, `First Name`, `Added/Joined`, and `Actions`.
- Create: `src/components/teacher/TeacherStudentProgressTable.tsx`
  Responsibility: render `Last Name`, `First Name`, `% of app completed`, and `% on last played`.
- Modify: `src/pages/teacher.tsx`
  Responsibility: replace the old teacher dashboard/assignments UI with the new home, class workspace, and placeholders.
- Modify: `src/App.tsx`
  Responsibility: route teacher pages through the hidden generic shell and add report/settings placeholders.
- Create: `src/lib/attempt-game-results.ts`
  Responsibility: map `QuizPage` topic/index events into stable `AttemptGameResultInput` rows.
- Create: `src/lib/attempt-game-results.test.ts`
  Responsibility: prove per-game submission rows use the stable catalog ids and replace prior rows for the same game id.
- Modify: `src/pages/QuizPage.tsx`
  Responsibility: collect detailed game results during lesson play and submit them alongside the topic-level attempt.

### Task 1: Shared Game Catalog And Progress Math

**Files:**
- Create: `src/lib/game-catalog.ts`
- Create: `src/lib/game-catalog.test.ts`
- Create: `src/lib/teacher-progress.ts`
- Create: `src/lib/teacher-progress.test.ts`

**Interfaces:**
- Consumes: none
- Produces: `type GameCatalogEntry = { topicId: TeacherTopicId; gameId: string; gameOrder: number; title: string; maxScore: number }`
- Produces: `const GAME_CATALOG: readonly GameCatalogEntry[]`
- Produces: `function getGameCatalogEntry(topicId: string, gameOrder: number): GameCatalogEntry | null`
- Produces: `function isPassingPct(score: number, maxScore: number, passThreshold?: number): boolean`
- Produces: `function calculateDetailedCompletionPct(input: { gameId: string; score: number; maxScore: number }[], totalGameCount?: number): number | null`
- Produces: `function calculateDetailedLastPlayedPct(input: { completedAt: string; score: number; maxScore: number }[]): number | null`

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/game-catalog.test.ts
import { assertEquals } from "jsr:@std/assert";
import { GAME_CATALOG, getGameCatalogEntry } from "./game-catalog.ts";

Deno.test("GAME_CATALOG exposes every playable game in stable topic order", () => {
  assertEquals(GAME_CATALOG.length, 82);
  assertEquals(GAME_CATALOG[0], {
    topicId: "colors",
    gameId: "colors:0",
    gameOrder: 0,
    title: "colors-1",
    maxScore: 1,
  });
  assertEquals(GAME_CATALOG.at(-1), {
    topicId: "clock",
    gameId: "clock:6",
    gameOrder: 6,
    title: "clock-7",
    maxScore: 1,
  });
  assertEquals(getGameCatalogEntry("addition", 11)?.gameId, "addition:11");
  assertEquals(getGameCatalogEntry("clock", 7), null);
});

// src/lib/teacher-progress.test.ts
import { assertEquals } from "jsr:@std/assert";
import {
  calculateDetailedCompletionPct,
  calculateDetailedLastPlayedPct,
  isPassingPct,
} from "./teacher-progress.ts";

Deno.test("calculateDetailedCompletionPct counts only unique passed games", () => {
  assertEquals(
    calculateDetailedCompletionPct(
      [
        { gameId: "colors:0", score: 1, maxScore: 1 },
        { gameId: "colors:0", score: 0, maxScore: 1 },
        { gameId: "colors:1", score: 3, maxScore: 4 },
        { gameId: "colors:2", score: 2, maxScore: 4 },
      ],
      4,
    ),
    50,
  );
});

Deno.test("calculateDetailedLastPlayedPct uses the newest detailed game result", () => {
  assertEquals(isPassingPct(3, 4), true);
  assertEquals(isPassingPct(2, 4), false);
  assertEquals(
    calculateDetailedLastPlayedPct([
      { completedAt: "2026-07-27T08:00:00.000Z", score: 1, maxScore: 1 },
      { completedAt: "2026-07-28T09:00:00.000Z", score: 3, maxScore: 4 },
    ]),
    75,
  );
  assertEquals(calculateDetailedLastPlayedPct([]), null);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `deno test src/lib/game-catalog.test.ts src/lib/teacher-progress.test.ts`

Expected: FAIL with module-not-found errors for `src/lib/game-catalog.ts` and `src/lib/teacher-progress.ts`.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/lib/game-catalog.ts
const GAME_COUNT_BY_TOPIC = {
  colors: 7,
  shapes: 9,
  sequencing: 10,
  addition: 12,
  subtraction: 10,
  numbers: 9,
  measurement: 7,
  comparison: 11,
  clock: 7,
} as const;

export type TeacherTopicId = keyof typeof GAME_COUNT_BY_TOPIC;

export type GameCatalogEntry = {
  topicId: TeacherTopicId;
  gameId: string;
  gameOrder: number;
  title: string;
  maxScore: number;
};

export const GAME_CATALOG: readonly GameCatalogEntry[] = (
  Object.entries(GAME_COUNT_BY_TOPIC) as [TeacherTopicId, number][]
).flatMap(([topicId, count]) =>
  Array.from({ length: count }, (_, gameOrder) => ({
    topicId,
    gameId: `${topicId}:${gameOrder}`,
    gameOrder,
    title: `${topicId}-${gameOrder + 1}`,
    maxScore: 1,
  })),
);

export function getGameCatalogEntry(topicId: string, gameOrder: number): GameCatalogEntry | null {
  return GAME_CATALOG.find((entry) => entry.topicId === topicId && entry.gameOrder === gameOrder) ?? null;
}

// src/lib/teacher-progress.ts
import { GAME_CATALOG } from "./game-catalog.ts";

type ResultLike = {
  gameId: string;
  score: number;
  maxScore: number;
};

type TimedResultLike = ResultLike & {
  completedAt: string;
};

function toPct(score: number, maxScore: number): number {
  return Math.round((score / maxScore) * 100);
}

export function isPassingPct(score: number, maxScore: number, passThreshold = 0.75): boolean {
  return maxScore > 0 && score / maxScore >= passThreshold;
}

export function calculateDetailedCompletionPct(
  input: ResultLike[],
  totalGameCount = GAME_CATALOG.length,
): number | null {
  if (!input.length || totalGameCount <= 0) return null;
  const passedIds = new Set(
    input.filter((result) => isPassingPct(result.score, result.maxScore)).map((result) => result.gameId),
  );
  return Math.round((passedIds.size / totalGameCount) * 100);
}

export function calculateDetailedLastPlayedPct(input: TimedResultLike[]): number | null {
  if (!input.length) return null;
  const latest = [...input].sort((left, right) => left.completedAt.localeCompare(right.completedAt)).at(-1);
  if (!latest || latest.maxScore <= 0) return null;
  return toPct(latest.score, latest.maxScore);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `deno test src/lib/game-catalog.test.ts src/lib/teacher-progress.test.ts`

Expected: PASS with 3 passing tests and no skipped cases.

- [ ] **Step 5: Commit**

```bash
git add src/lib/game-catalog.ts src/lib/game-catalog.test.ts src/lib/teacher-progress.ts src/lib/teacher-progress.test.ts
git commit -m "feat: add shared game progress catalog"
```

### Task 2: Detailed Game Result Schema And Attempt Submission

**Files:**
- Create: `supabase/migrations/0005_attempt_game_results.sql`
- Create: `supabase/functions/attempts-submit/handler.ts`
- Create: `supabase/functions/attempts-submit/handler_test.ts`
- Modify: `supabase/functions/attempts-submit/index.ts`

**Interfaces:**
- Consumes: `isPassingPct(score: number, maxScore: number, passThreshold?: number): boolean`
- Produces: `type AttemptGameResultInput = { topicId: string; gameId: string; gameOrder: number; score: number; maxScore: number; completedAt?: string }`
- Produces: `function createAttemptsSubmitHandler(deps?: AttemptsSubmitDeps): (req: Request) => Promise<Response>`
- Produces: POST `/attempts-submit` accepts `gameResults?: AttemptGameResultInput[]` in addition to the current topic-level payload

- [ ] **Step 1: Write the failing handler tests**

```ts
// supabase/functions/attempts-submit/handler_test.ts
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
    insertAttempt: async (input) => ({
      id: "attempt-1",
      lesson_id: input.lessonId,
      score: input.score,
      max_score: input.maxScore,
      completed_at: "2026-07-28T10:00:00.000Z",
    }),
    insertAttemptGameResults: async (rows) => {
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `deno test supabase/functions/attempts-submit/handler_test.ts`

Expected: FAIL with module-not-found errors for `supabase/functions/attempts-submit/handler.ts`.

- [ ] **Step 3: Add the new PostgreSQL migration**

```sql
-- supabase/migrations/0005_attempt_game_results.sql
create table if not exists public.attempt_game_results (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  topic_id text not null,
  game_id text not null,
  game_order integer not null check (game_order >= 0),
  score integer not null,
  max_score integer not null check (max_score > 0),
  score_pct integer not null check (score_pct between 0 and 100),
  passed boolean not null,
  completed_at timestamptz not null default now()
);

alter table public.attempt_game_results enable row level security;

create index if not exists attempt_game_results_student_completed_idx
  on public.attempt_game_results (student_id, completed_at desc);

create index if not exists attempt_game_results_student_game_idx
  on public.attempt_game_results (student_id, game_id, passed);
```

- [ ] **Step 4: Implement the minimal handler and entrypoint**

```ts
// supabase/functions/attempts-submit/handler.ts
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import { getAuthedProfile, type AuthedProfile } from "../_shared/client.ts";
import { isPassingPct } from "../../../src/lib/teacher-progress.ts";

export type AttemptGameResultInput = {
  topicId: string;
  gameId: string;
  gameOrder: number;
  score: number;
  maxScore: number;
  completedAt?: string;
};

type AttemptInsertInput = {
  studentId: string;
  lessonId: string;
  assignmentId: string | null;
  score: number;
  maxScore: number;
  durationSeconds: number | null;
};

type AttemptGameResultInsert = {
  attemptId: string;
  studentId: string;
  topicId: string;
  gameId: string;
  gameOrder: number;
  score: number;
  maxScore: number;
  scorePct: number;
  passed: boolean;
  completedAt: string;
};

type AttemptsSubmitDeps = {
  getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
  insertAttempt(input: AttemptInsertInput): Promise<{ id: string; lesson_id: string; score: number; max_score: number; completed_at: string }>;
  insertAttemptGameResults(rows: AttemptGameResultInsert[]): Promise<void>;
};

const defaultDeps: AttemptsSubmitDeps = {
  getAuthedProfile,
  async insertAttempt(input) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("attempts")
      .insert({
        student_id: input.studentId,
        lesson_id: input.lessonId,
        assignment_id: input.assignmentId,
        score: input.score,
        max_score: input.maxScore,
        duration_seconds: input.durationSeconds,
      })
      .select("id, lesson_id, score, max_score, completed_at")
      .single();
    if (error || !data) throw error ?? new Error("Failed to insert attempt");
    return data;
  },
  async insertAttemptGameResults(rows) {
    if (!rows.length) return;
    const { adminClient } = await import("../_shared/client.ts");
    const { error } = await adminClient.from("attempt_game_results").insert(rows.map((row) => ({
      attempt_id: row.attemptId,
      student_id: row.studentId,
      topic_id: row.topicId,
      game_id: row.gameId,
      game_order: row.gameOrder,
      score: row.score,
      max_score: row.maxScore,
      score_pct: row.scorePct,
      passed: row.passed,
      completed_at: row.completedAt,
    })));
    if (error) throw error;
  },
};

function isAttemptGameResultInput(value: unknown): value is AttemptGameResultInput {
  return typeof value === "object"
    && value !== null
    && typeof (value as AttemptGameResultInput).topicId === "string"
    && typeof (value as AttemptGameResultInput).gameId === "string"
    && (value as AttemptGameResultInput).gameId.length > 0
    && Number.isInteger((value as AttemptGameResultInput).gameOrder)
    && Number.isFinite((value as AttemptGameResultInput).score)
    && Number.isFinite((value as AttemptGameResultInput).maxScore)
    && (value as AttemptGameResultInput).maxScore > 0;
}

export function createAttemptsSubmitHandler(deps: AttemptsSubmitDeps = defaultDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return errorResponse("Method not allowed", 405);

    try {
      const profile = await deps.getAuthedProfile(req);
      if (!profile) return errorResponse("Unauthorized", 401);
      if (profile.role !== "student") return errorResponse("Only students can submit attempts", 403);

      const body = await req.json().catch(() => null);
      const lessonId = body?.lessonId;
      const score = Number(body?.score);
      const maxScore = Number(body?.maxScore);
      const assignmentId = body?.assignmentId ?? null;
      const durationSeconds = body?.durationSeconds != null ? Number(body.durationSeconds) : null;
      const gameResults = Array.isArray(body?.gameResults) ? body.gameResults : [];

      if (!lessonId) return errorResponse("lessonId is required", 422);
      if (!Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0) {
        return errorResponse("score and maxScore must be valid numbers", 422);
      }
      if (!gameResults.every(isAttemptGameResultInput)) {
        return errorResponse("gameResults must contain valid detailed game rows", 422);
      }

      const attempt = await deps.insertAttempt({
        studentId: profile.id,
        lessonId,
        assignmentId,
        score,
        maxScore,
        durationSeconds,
      });

      await deps.insertAttemptGameResults(
        gameResults.map((row) => ({
          attemptId: attempt.id,
          studentId: profile.id,
          topicId: row.topicId,
          gameId: row.gameId,
          gameOrder: row.gameOrder,
          score: row.score,
          maxScore: row.maxScore,
          scorePct: Math.round((row.score / row.maxScore) * 100),
          passed: isPassingPct(row.score, row.maxScore),
          completedAt: row.completedAt ?? attempt.completed_at,
        })),
      );

      return jsonResponse({ attempt }, 201);
    } catch (error) {
      console.error("attempts-submit failed", error);
      return errorResponse("We couldn't save that attempt right now.", 500);
    }
  };
}

// supabase/functions/attempts-submit/index.ts
import { createAttemptsSubmitHandler } from "./handler.ts";

const handler = createAttemptsSubmitHandler();

Deno.serve(handler);
```

- [ ] **Step 5: Apply the migration and run the handler test**

Run: `npm run supabase:migrations`

Expected: local Supabase resets and applies `0001_init.sql` through `0005_attempt_game_results.sql` without SQL errors.

Run: `deno test supabase/functions/attempts-submit/handler_test.ts`

Expected: PASS with 2 passing tests.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/0005_attempt_game_results.sql supabase/functions/attempts-submit/index.ts supabase/functions/attempts-submit/handler.ts supabase/functions/attempts-submit/handler_test.ts
git commit -m "feat: persist detailed game results on attempts"
```

### Task 3: Teacher Roster Aggregation And Student Removal Backend

**Files:**
- Create: `supabase/functions/classes-roster/handler.ts`
- Create: `supabase/functions/classes-roster/handler_test.ts`
- Modify: `supabase/functions/classes-roster/index.ts`
- Create: `supabase/functions/classes-remove-student/handler.ts`
- Create: `supabase/functions/classes-remove-student/handler_test.ts`
- Create: `supabase/functions/classes-remove-student/index.ts`

**Interfaces:**
- Consumes: `GAME_CATALOG.length`
- Consumes: `calculateDetailedCompletionPct(input, totalGameCount?)`
- Consumes: `calculateDetailedLastPlayedPct(input)`
- Produces: `type TeacherClassStudent = { id: string; fullName: string; firstName: string; lastName: string | null; joinedAt: string; appCompletionPct: number | null; lastPlayedPct: number | null }`
- Produces: `function createClassesRosterHandler(deps?: ClassesRosterDeps): (req: Request) => Promise<Response>`
- Produces: `function createClassesRemoveStudentHandler(deps?: ClassesRemoveStudentDeps): (req: Request) => Promise<Response>`
- Produces: POST `/classes-remove-student` accepts `{ classId: string; studentId: string }`

- [ ] **Step 1: Write the failing backend tests**

```ts
// supabase/functions/classes-roster/handler_test.ts
import { assertEquals } from "jsr:@std/assert";
import { createClassesRosterHandler } from "./handler.ts";

Deno.test("classes-roster derives names and detailed progress from child game rows", async () => {
  const handler = createClassesRosterHandler({
    getAuthedProfile: async () => ({ id: "teacher-1", role: "teacher", full_name: "Teacher One" }),
    findOwnedClass: async () => ({ id: "class-1", teacherId: "teacher-1" }),
    listRosterStudents: async () => [{
      id: "student-1",
      fullName: "Santos, Maria",
      firstName: "Maria",
      lastName: "Santos",
      joinedAt: "2026-07-20T00:00:00.000Z",
    }],
    listDetailedGameResults: async () => [
      { studentId: "student-1", gameId: "colors:0", score: 1, maxScore: 1, completedAt: "2026-07-27T09:00:00.000Z" },
      { studentId: "student-1", gameId: "colors:1", score: 3, maxScore: 4, completedAt: "2026-07-28T09:00:00.000Z" },
    ],
  });

  const response = await handler(new Request("http://local/classes-roster?classId=class-1"));
  const json = await response.json();

  assertEquals(json.students[0], {
    id: "student-1",
    fullName: "Santos, Maria",
    firstName: "Maria",
    lastName: "Santos",
    joinedAt: "2026-07-20T00:00:00.000Z",
    appCompletionPct: 2,
    lastPlayedPct: 75,
  });
});

Deno.test("classes-roster leaves detailed progress empty when no child rows exist", async () => {
  const handler = createClassesRosterHandler({
    getAuthedProfile: async () => ({ id: "teacher-1", role: "teacher", full_name: "Teacher One" }),
    findOwnedClass: async () => ({ id: "class-1", teacherId: "teacher-1" }),
    listRosterStudents: async () => [{
      id: "student-1",
      fullName: "Student",
      firstName: "Student",
      lastName: null,
      joinedAt: "2026-07-20T00:00:00.000Z",
    }],
    listDetailedGameResults: async () => [],
  });

  const response = await handler(new Request("http://local/classes-roster?classId=class-1"));
  const json = await response.json();

  assertEquals(json.students[0].appCompletionPct, null);
  assertEquals(json.students[0].lastPlayedPct, null);
});

// supabase/functions/classes-remove-student/handler_test.ts
import { assertEquals } from "jsr:@std/assert";
import { createClassesRemoveStudentHandler } from "./handler.ts";

Deno.test("classes-remove-student deletes class membership only", async () => {
  let removed: unknown = null;
  const handler = createClassesRemoveStudentHandler({
    getAuthedProfile: async () => ({ id: "teacher-1", role: "teacher", full_name: "Teacher One" }),
    findOwnedClass: async () => ({ id: "class-1", teacherId: "teacher-1" }),
    removeMembership: async (input) => {
      removed = input;
    },
  });

  const response = await handler(new Request("http://local/classes-remove-student", {
    method: "POST",
    body: JSON.stringify({ classId: "class-1", studentId: "student-1" }),
  }));

  assertEquals(response.status, 200);
  assertEquals(removed, { classId: "class-1", studentId: "student-1" });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `deno test supabase/functions/classes-roster/handler_test.ts supabase/functions/classes-remove-student/handler_test.ts`

Expected: FAIL with module-not-found errors for the new handler files.

- [ ] **Step 3: Implement the roster and removal handlers**

```ts
// supabase/functions/classes-roster/handler.ts
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import { getAuthedProfile, type AuthedProfile } from "../_shared/client.ts";
import { GAME_CATALOG } from "../../../src/lib/game-catalog.ts";
import {
  calculateDetailedCompletionPct,
  calculateDetailedLastPlayedPct,
} from "../../../src/lib/teacher-progress.ts";

type RosterStudentRow = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string | null;
  joinedAt: string;
};

type DetailedGameResultRow = {
  studentId: string;
  gameId: string;
  score: number;
  maxScore: number;
  completedAt: string;
};

type ClassesRosterDeps = {
  getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
  findOwnedClass(classId: string): Promise<{ id: string; teacherId: string } | null>;
  listRosterStudents(classId: string): Promise<RosterStudentRow[]>;
  listDetailedGameResults(studentIds: string[]): Promise<DetailedGameResultRow[]>;
};

const defaultDeps: ClassesRosterDeps = {
  getAuthedProfile,
  async findOwnedClass(classId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("classes")
      .select("id, teacher_id")
      .eq("id", classId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { id: data.id as string, teacherId: data.teacher_id as string };
  },
  async listRosterStudents(classId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("class_students")
      .select("joined_at, profiles(id, full_name, first_name, last_name)")
      .eq("class_id", classId);
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      id: row.profiles.id,
      fullName: row.profiles.full_name,
      firstName: row.profiles.first_name ?? row.profiles.full_name,
      lastName: row.profiles.last_name ?? null,
      joinedAt: row.joined_at,
    }));
  },
  async listDetailedGameResults(studentIds) {
    if (!studentIds.length) return [];
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("attempt_game_results")
      .select("student_id, game_id, score, max_score, completed_at")
      .in("student_id", studentIds);
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      studentId: row.student_id,
      gameId: row.game_id,
      score: row.score,
      maxScore: row.max_score,
      completedAt: row.completed_at,
    }));
  },
};

export function createClassesRosterHandler(deps: ClassesRosterDeps = defaultDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
      const profile = await deps.getAuthedProfile(req);
      if (!profile) return errorResponse("Unauthorized", 401);
      if (profile.role !== "teacher") return errorResponse("Only teachers can view rosters", 403);

      const classId = new URL(req.url).searchParams.get("classId");
      if (!classId) return errorResponse("classId is required", 422);

      const klass = await deps.findOwnedClass(classId);
      if (!klass) return errorResponse("Class not found", 404);
      if (klass.teacherId !== profile.id) return errorResponse("Forbidden", 403);

      const students = await deps.listRosterStudents(classId);
      const detailed = await deps.listDetailedGameResults(students.map((student) => student.id));

      return jsonResponse({
        students: students.map((student) => {
          const ownRows = detailed.filter((row) => row.studentId === student.id);
          return {
            ...student,
            appCompletionPct: calculateDetailedCompletionPct(ownRows, GAME_CATALOG.length),
            lastPlayedPct: calculateDetailedLastPlayedPct(ownRows),
          };
        }),
      });
    } catch (error) {
      console.error("classes-roster failed", error);
      return errorResponse("We couldn't load that class roster right now.", 500);
    }
  };
}

// supabase/functions/classes-roster/index.ts
import { createClassesRosterHandler } from "./handler.ts";

const handler = createClassesRosterHandler();

Deno.serve(handler);

// supabase/functions/classes-remove-student/handler.ts
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import { getAuthedProfile, type AuthedProfile } from "../_shared/client.ts";

type ClassesRemoveStudentDeps = {
  getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
  findOwnedClass(classId: string): Promise<{ id: string; teacherId: string } | null>;
  removeMembership(input: { classId: string; studentId: string }): Promise<void>;
};

const defaultDeps: ClassesRemoveStudentDeps = {
  getAuthedProfile,
  async findOwnedClass(classId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("classes")
      .select("id, teacher_id")
      .eq("id", classId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { id: data.id as string, teacherId: data.teacher_id as string };
  },
  async removeMembership({ classId, studentId }) {
    const { adminClient } = await import("../_shared/client.ts");
    const { error } = await adminClient
      .from("class_students")
      .delete()
      .eq("class_id", classId)
      .eq("student_id", studentId);
    if (error) throw error;
  },
};

export function createClassesRemoveStudentHandler(deps: ClassesRemoveStudentDeps = defaultDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return errorResponse("Method not allowed", 405);

    try {
      const profile = await deps.getAuthedProfile(req);
      if (!profile) return errorResponse("Unauthorized", 401);
      if (profile.role !== "teacher") return errorResponse("Only teachers can remove students", 403);

      const body = await req.json().catch(() => null);
      const classId = typeof body?.classId === "string" ? body.classId : "";
      const studentId = typeof body?.studentId === "string" ? body.studentId : "";
      if (!classId || !studentId) return errorResponse("classId and studentId are required", 422);

      const klass = await deps.findOwnedClass(classId);
      if (!klass) return errorResponse("Class not found", 404);
      if (klass.teacherId !== profile.id) return errorResponse("Forbidden", 403);

      await deps.removeMembership({ classId, studentId });
      return jsonResponse({ removed: true });
    } catch (error) {
      console.error("classes-remove-student failed", error);
      return errorResponse("We couldn't remove that student right now.", 500);
    }
  };
}

// supabase/functions/classes-remove-student/index.ts
import { createClassesRemoveStudentHandler } from "./handler.ts";

const handler = createClassesRemoveStudentHandler();

Deno.serve(handler);
```

- [ ] **Step 4: Run the backend tests to verify they pass**

Run: `deno test supabase/functions/classes-roster/handler_test.ts supabase/functions/classes-remove-student/handler_test.ts`

Expected: PASS with 3 passing tests.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/classes-roster/index.ts supabase/functions/classes-roster/handler.ts supabase/functions/classes-roster/handler_test.ts supabase/functions/classes-remove-student/index.ts supabase/functions/classes-remove-student/handler.ts supabase/functions/classes-remove-student/handler_test.ts
git commit -m "feat: add teacher roster progress and class removal"
```

### Task 4: Teacher Navigation And Client Contracts

**Files:**
- Create: `src/lib/teacher-nav.ts`
- Create: `src/lib/teacher-nav.test.ts`
- Modify: `src/lib/api.ts`
- Modify: `src/lib/hooks.ts`
- Modify: `src/lib/useLanguage.tsx`
- Modify: `src/components/layout.tsx`

**Interfaces:**
- Consumes: `TeacherClassStudent` roster response from `/classes-roster`
- Produces: `const TEACHER_NAV_ITEMS: readonly { href: string; labelKey: string }[]`
- Produces: `function isTeacherNavActive(pathname: string, href: string): boolean`
- Produces: `interface TeacherClassStudent { id: string; fullName: string; firstName: string; lastName: string | null; joinedAt: string; appCompletionPct: number | null; lastPlayedPct: number | null }`
- Produces: `interface AttemptGameResultInput { topicId: string; gameId: string; gameOrder: number; score: number; maxScore: number; completedAt?: string }`
- Produces: `api.classes.removeStudent(classId: string, studentId: string)`
- Produces: `useRemoveStudentFromClass()`

- [ ] **Step 1: Write the failing navigation test**

```ts
// src/lib/teacher-nav.test.ts
import { assertEquals } from "jsr:@std/assert";
import { TEACHER_NAV_ITEMS, isTeacherNavActive } from "./teacher-nav.ts";

Deno.test("teacher nav exposes the approved classes/reports/settings routes", () => {
  assertEquals(TEACHER_NAV_ITEMS, [
    { href: "/teacher", labelKey: "teacher.classes" },
    { href: "/teacher/reports", labelKey: "teacher.reports" },
    { href: "/teacher/settings", labelKey: "teacher.settings" },
  ]);
});

Deno.test("teacher nav treats class detail pages as part of My Classes", () => {
  assertEquals(isTeacherNavActive("/teacher/classes/class-1", "/teacher"), true);
  assertEquals(isTeacherNavActive("/teacher/reports", "/teacher/reports"), true);
  assertEquals(isTeacherNavActive("/teacher/settings", "/teacher/reports"), false);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `deno test src/lib/teacher-nav.test.ts`

Expected: FAIL with module-not-found errors for `src/lib/teacher-nav.ts`.

- [ ] **Step 3: Implement the client contracts and translations**

```ts
// src/lib/teacher-nav.ts
export const TEACHER_NAV_ITEMS = [
  { href: "/teacher", labelKey: "teacher.classes" },
  { href: "/teacher/reports", labelKey: "teacher.reports" },
  { href: "/teacher/settings", labelKey: "teacher.settings" },
] as const;

export function isTeacherNavActive(pathname: string, href: string): boolean {
  if (href === "/teacher") {
    return pathname === "/teacher"
      || pathname === "/teacher/classes"
      || pathname.startsWith("/teacher/classes/");
  }
  return pathname === href;
}

// src/lib/api.ts
export interface AttemptGameResultInput {
  topicId: string;
  gameId: string;
  gameOrder: number;
  score: number;
  maxScore: number;
  completedAt?: string;
}

export interface TeacherClassStudent {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string | null;
  joinedAt: string;
  appCompletionPct: number | null;
  lastPlayedPct: number | null;
}

// add to api.classes
removeStudent: (classId: string, studentId: string) =>
  invokeFunction<{ removed: true }>("classes-remove-student", {
    method: "POST",
    body: { classId, studentId },
  }),

// update api.attempts.submit input type
submit: (input: {
  lessonId: string;
  assignmentId?: string;
  score: number;
  maxScore: number;
  durationSeconds?: number;
  gameResults?: AttemptGameResultInput[];
}) => invokeFunction<{ attempt: unknown }>("attempts-submit", { method: "POST", body: input }),

// update api.classes.roster return type
roster: (classId: string) =>
  invokeFunction<{ students: TeacherClassStudent[] }>("classes-roster", { searchParams: { classId } }),

// src/lib/hooks.ts
export function useRemoveStudentFromClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, studentId }: { classId: string; studentId: string }) =>
      api.classes.removeStudent(classId, studentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["classes", variables.classId, "roster"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "teacher"] });
    },
  });
}

// src/lib/useLanguage.tsx
// replace teacher keys in both `en` and `tl`
"teacher.dashboard": "My Classes",
"teacher.classes": "My Classes",
"teacher.reports": "Reports",
"teacher.settings": "Settings",

"teacher.dashboard": "Aking Mga Klase",
"teacher.classes": "Aking Mga Klase",
"teacher.reports": "Mga Report",
"teacher.settings": "Settings",

// src/components/layout.tsx
import { TEACHER_NAV_ITEMS, isTeacherNavActive } from "@/lib/teacher-nav";

const teacherNavItems = TEACHER_NAV_ITEMS.map((item) => ({
  href: item.href,
  label: t(item.labelKey),
  icon: item.href === "/teacher"
    ? LayoutDashboard
    : item.href === "/teacher/reports"
      ? Users
      : Settings,
}));

const navItems = user ? (isTeacher
  ? teacherNavItems
  : [
      { href: "/student", label: t("student.dashboard"), icon: Map },
      { href: "/student/lessons", label: t("student.portal.allLessons"), icon: Compass },
    ]) : [];

const active = isTeacher
  ? isTeacherNavActive(location, item.href)
  : location === item.href || (location.startsWith(item.href) && item.href !== "/student");
```

- [ ] **Step 4: Run the tests and typecheck**

Run: `deno test src/lib/teacher-nav.test.ts`

Expected: PASS with 2 passing tests.

Run: `npm run typecheck`

Expected: PASS with no TypeScript errors after the new API and translation keys are added.

- [ ] **Step 5: Commit**

```bash
git add src/lib/teacher-nav.ts src/lib/teacher-nav.test.ts src/lib/api.ts src/lib/hooks.ts src/lib/useLanguage.tsx src/components/layout.tsx
git commit -m "refactor: add teacher navigation and client contracts"
```

### Task 5: Teacher Classroom UI Routes And Components

**Files:**
- Create: `src/components/teacher/TeacherWorkspaceBoard.tsx`
- Create: `src/components/teacher/TeacherClassCard.tsx`
- Create: `src/components/teacher/TeacherStudentListTable.tsx`
- Create: `src/components/teacher/TeacherStudentProgressTable.tsx`
- Modify: `src/pages/teacher.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `TEACHER_NAV_ITEMS`
- Consumes: `isTeacherNavActive(pathname: string, href: string): boolean`
- Consumes: `TeacherClassStudent`
- Consumes: `useClasses()`, `useCreateClass()`, `useClassRoster(classId)`, `useRemoveStudentFromClass()`
- Produces: `TeacherClassesHome`
- Produces: `TeacherClassWorkspace`
- Produces: `TeacherReportsPlaceholder`
- Produces: `TeacherSettingsPlaceholder`

- [ ] **Step 1: Write the failing route wiring first**

```tsx
// src/App.tsx
import {
  TeacherClassesHome,
  TeacherClassWorkspace,
  TeacherReportsPlaceholder,
  TeacherSettingsPlaceholder,
} from "@/pages/teacher";

<Route path="/teacher">
  {() => <AppLayout sidebarMode="hidden"><TeacherClassesHome /></AppLayout>}
</Route>
<Route path="/teacher/classes">
  {() => <AppLayout sidebarMode="hidden"><TeacherClassesHome /></AppLayout>}
</Route>
<Route path="/teacher/classes/:classId">
  {params => <AppLayout sidebarMode="hidden"><TeacherClassWorkspace classId={params.classId} /></AppLayout>}
</Route>
<Route path="/teacher/reports">
  {() => <AppLayout sidebarMode="hidden"><TeacherReportsPlaceholder /></AppLayout>}
</Route>
<Route path="/teacher/settings">
  {() => <AppLayout sidebarMode="hidden"><TeacherSettingsPlaceholder /></AppLayout>}
</Route>
```

- [ ] **Step 2: Run typecheck to verify it fails**

Run: `npm run typecheck`

Expected: FAIL with missing exports from `src/pages/teacher.tsx`.

- [ ] **Step 3: Implement the classroom board and page rewrites**

```tsx
// src/components/teacher/TeacherWorkspaceBoard.tsx
import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/useAuth";
import { useLanguage } from "@/lib/useLanguage";
import { TEACHER_NAV_ITEMS, isTeacherNavActive } from "@/lib/teacher-nav";
import { Button } from "@/components/ui";
import { signOut } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function TeacherWorkspaceBoard({
  heading,
  action,
  children,
}: {
  heading: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [location, setLocation] = useLocation();

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="overflow-hidden rounded-[32px] border-2 border-border bg-card shadow-[0_24px_70px_rgba(58,88,42,0.12)]">
        <div className="grid min-h-[720px] lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="border-b-2 border-border bg-[linear-gradient(180deg,#f4f7e9_0%,#eef5dc_100%)] p-6 lg:border-b-0 lg:border-r-2">
            <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border-2 border-border bg-white text-3xl font-display font-bold text-primary">
              {user?.full_name?.slice(0, 1) ?? "T"}
            </div>
            <p className="mt-4 text-lg font-display font-bold text-foreground">Welcome, {user?.full_name ?? "Teacher"}</p>
            <nav className="mt-8 space-y-2">
              {TEACHER_NAV_ITEMS.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 font-bold transition-colors",
                      isTeacherNavActive(location, item.href)
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-accent",
                    )}
                  >
                    {t(item.labelKey)}
                  </div>
                </Link>
              ))}
            </nav>
            <div className="mt-10 border-t-2 border-border pt-6">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={async () => {
                  await signOut();
                  setLocation("/");
                }}
              >
                {t("common.logout")}
              </Button>
            </div>
          </aside>

          <section className="p-5 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>{heading}</div>
              {action}
            </div>
            <div className="mt-8">{children}</div>
          </section>
        </div>
      </div>
    </div>
  );
}

// src/components/teacher/TeacherClassCard.tsx
import { Button, Card, Badge } from "@/components/ui";
import type { TeacherClassSummary } from "@/lib/api";

export function TeacherClassCard({
  klass,
  onEnter,
}: {
  klass: TeacherClassSummary;
  onEnter(): void;
}) {
  return (
    <Card className="flex h-full flex-col justify-between rounded-[28px] p-6">
      <div className="space-y-3">
        <h3 className="text-2xl font-display font-bold">{klass.name}</h3>
        <p className="text-sm font-bold text-muted-foreground">{klass.studentCount} students</p>
        <Badge variant="jungle" className="w-fit px-3 py-1 font-mono text-base">
          {klass.joinCode}
        </Badge>
      </div>
      <Button className="mt-6 self-end" onClick={onEnter}>Enter</Button>
    </Card>
  );
}

// src/components/teacher/TeacherStudentListTable.tsx
import { Button } from "@/components/ui";
import type { TeacherClassStudent } from "@/lib/api";

export function TeacherStudentListTable({
  students,
  onRemove,
}: {
  students: TeacherClassStudent[];
  onRemove(student: TeacherClassStudent): void;
}) {
  return (
    <div className="overflow-x-auto rounded-[24px] border-2 border-border bg-white">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-border bg-muted/40">
            <th className="p-4 font-bold text-muted-foreground">Last Name</th>
            <th className="p-4 font-bold text-muted-foreground">First Name</th>
            <th className="p-4 font-bold text-muted-foreground">Added/Joined</th>
            <th className="p-4 font-bold text-muted-foreground text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 && (
            <tr>
              <td colSpan={4} className="p-8 text-center font-bold text-muted-foreground">
                No students have joined this class yet.
              </td>
            </tr>
          )}
          {students.map((student) => (
            <tr key={student.id} className="border-b border-border/60">
              <td className="p-4 font-bold">{student.lastName ?? "--"}</td>
              <td className="p-4 font-bold">{student.firstName}</td>
              <td className="p-4 font-bold text-muted-foreground">{new Date(student.joinedAt).toLocaleDateString()}</td>
              <td className="p-4 text-right">
                <Button variant="danger" size="sm" onClick={() => onRemove(student)}>Remove</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// src/components/teacher/TeacherStudentProgressTable.tsx
import type { TeacherClassStudent } from "@/lib/api";

function formatPct(value: number | null) {
  return value == null ? "--" : `${value}%`;
}

export function TeacherStudentProgressTable({ students }: { students: TeacherClassStudent[] }) {
  return (
    <div className="overflow-x-auto rounded-[24px] border-2 border-border bg-white">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-border bg-muted/40">
            <th className="p-4 font-bold text-muted-foreground">Last Name</th>
            <th className="p-4 font-bold text-muted-foreground">First Name</th>
            <th className="p-4 font-bold text-muted-foreground">% of app completed</th>
            <th className="p-4 font-bold text-muted-foreground">% on last played</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 && (
            <tr>
              <td colSpan={4} className="p-8 text-center font-bold text-muted-foreground">
                No detailed progress yet.
              </td>
            </tr>
          )}
          {students.map((student) => (
            <tr key={student.id} className="border-b border-border/60">
              <td className="p-4 font-bold">{student.lastName ?? "--"}</td>
              <td className="p-4 font-bold">{student.firstName}</td>
              <td className="p-4 font-bold">{formatPct(student.appCompletionPct)}</td>
              <td className="p-4 font-bold">{formatPct(student.lastPlayedPct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

```tsx
// src/pages/teacher.tsx
import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button, Card, Input, Label } from "@/components/ui";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TeacherWorkspaceBoard } from "@/components/teacher/TeacherWorkspaceBoard";
import { TeacherClassCard } from "@/components/teacher/TeacherClassCard";
import { TeacherStudentListTable } from "@/components/teacher/TeacherStudentListTable";
import { TeacherStudentProgressTable } from "@/components/teacher/TeacherStudentProgressTable";
import { useClasses, useClassRoster, useCreateClass, useRemoveStudentFromClass } from "@/lib/hooks";
import type { TeacherClassStudent, TeacherClassSummary } from "@/lib/api";

export function TeacherClassesHome() {
  const { data, isLoading } = useClasses();
  const createClass = useCreateClass();
  const [isCreating, setIsCreating] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [, setLocation] = useLocation();

  if (isLoading) return <div className="p-8 text-center font-bold">Loading classes...</div>;
  const classes = (data?.classes ?? []) as TeacherClassSummary[];

  return (
    <TeacherWorkspaceBoard
      heading={<><h1 className="text-4xl font-display font-bold">My Classes</h1><p className="mt-2 font-bold text-muted-foreground">Open a class or create a new one.</p></>}
      action={<Button onClick={() => setIsCreating(true)}>+ Create Class</Button>}
    >
      {isCreating && (
        <Card className="mb-6 rounded-[24px] p-5">
          <form
            className="flex flex-col gap-4 md:flex-row md:items-end"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!newClassName.trim()) return;
              await createClass.mutateAsync(newClassName);
              setNewClassName("");
              setIsCreating(false);
            }}
          >
            <div className="flex-1 space-y-2">
              <Label htmlFor="teacher-class-name">Class Name</Label>
              <Input id="teacher-class-name" value={newClassName} onChange={(event) => setNewClassName(event.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button type="submit" disabled={!newClassName.trim() || createClass.isPending}>Create</Button>
            </div>
          </form>
        </Card>
      )}
      {classes.length === 0 && !isCreating && (
        <Card className="mb-6 rounded-[24px] border-dashed p-8 text-center">
          <p className="font-bold text-muted-foreground">No classes yet. Create your first class to get started.</p>
        </Card>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {classes.map((klass) => (
          <TeacherClassCard key={klass.id} klass={klass} onEnter={() => setLocation(`/teacher/classes/${klass.id}`)} />
        ))}
      </div>
    </TeacherWorkspaceBoard>
  );
}

export function TeacherClassWorkspace({ classId }: { classId: string }) {
  const { data: classesData } = useClasses();
  const { data: rosterData, isLoading } = useClassRoster(classId);
  const removeStudent = useRemoveStudentFromClass();
  const [activeTab, setActiveTab] = useState<"students" | "progress">("students");
  const [pendingRemoval, setPendingRemoval] = useState<TeacherClassStudent | null>(null);

  const classes = (classesData?.classes ?? []) as TeacherClassSummary[];
  const klass = classes.find((row) => row.id === classId);
  const students = (rosterData?.students ?? []) as TeacherClassStudent[];

  if (isLoading || !klass) return <div className="p-8 text-center font-bold">Loading class...</div>;

  return (
    <TeacherWorkspaceBoard
      heading={<><h1 className="text-4xl font-display font-bold">{klass.name}</h1><p className="mt-2 font-bold text-muted-foreground">Code: {klass.joinCode}</p></>}
      action={<Button variant="outline" disabled>+ Add</Button>}
    >
      <div className="mb-5 inline-flex rounded-2xl border-2 border-border bg-white p-1">
        <Button variant={activeTab === "students" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("students")}>Student List</Button>
        <Button variant={activeTab === "progress" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("progress")}>Student Progress</Button>
      </div>
      {activeTab === "students"
        ? <TeacherStudentListTable students={students} onRemove={setPendingRemoval} />
        : <TeacherStudentProgressTable students={students} />}
      <Dialog open={pendingRemoval !== null} onOpenChange={(open) => !open && setPendingRemoval(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove student from this class?</DialogTitle>
            <DialogDescription>
              This removes the student from the class only. Their account and progress stay intact.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              variant="danger"
              onClick={async () => {
                if (!pendingRemoval) return;
                await removeStudent.mutateAsync({ classId, studentId: pendingRemoval.id });
                setPendingRemoval(null);
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TeacherWorkspaceBoard>
  );
}

export function TeacherReportsPlaceholder() {
  return <TeacherWorkspaceBoard heading={<h1 className="text-4xl font-display font-bold">Reports</h1>}><Card className="rounded-[24px] p-8 font-bold text-muted-foreground">Reports will be wired in the next teacher flow.</Card></TeacherWorkspaceBoard>;
}

export function TeacherSettingsPlaceholder() {
  return <TeacherWorkspaceBoard heading={<h1 className="text-4xl font-display font-bold">Settings</h1>}><Card className="rounded-[24px] p-8 font-bold text-muted-foreground">Settings will be wired in the next teacher flow.</Card></TeacherWorkspaceBoard>;
}
```

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`

Expected: PASS with the new teacher pages, routes, and component props all typed correctly.

- [ ] **Step 5: Run the production build**

Run: `npm run build`

Expected: PASS and emit a fresh Vite production bundle with no route import failures.

- [ ] **Step 6: Commit**

```bash
git add src/components/teacher/TeacherWorkspaceBoard.tsx src/components/teacher/TeacherClassCard.tsx src/components/teacher/TeacherStudentListTable.tsx src/components/teacher/TeacherStudentProgressTable.tsx src/pages/teacher.tsx src/App.tsx
git commit -m "feat: redesign teacher classroom pages"
```

### Task 6: QuizPage Detailed Game Result Instrumentation

**Files:**
- Create: `src/lib/attempt-game-results.ts`
- Create: `src/lib/attempt-game-results.test.ts`
- Modify: `src/pages/QuizPage.tsx`

**Interfaces:**
- Consumes: `AttemptGameResultInput`
- Consumes: `getGameCatalogEntry(topicId: string, gameOrder: number): GameCatalogEntry | null`
- Produces: `function buildAttemptGameResult(topicId: string, gameOrder: number, score: number, maxScore: number): AttemptGameResultInput`
- Produces: `function appendAttemptGameResult(current: AttemptGameResultInput[], next: AttemptGameResultInput): AttemptGameResultInput[]`
- Produces: `QuizPage` submits `gameResults` alongside the existing topic-level attempt payload

- [ ] **Step 1: Write the failing helper test**

```ts
// src/lib/attempt-game-results.test.ts
import { assertEquals, assertThrows } from "jsr:@std/assert";
import { appendAttemptGameResult, buildAttemptGameResult } from "./attempt-game-results.ts";

Deno.test("buildAttemptGameResult uses the stable game catalog id", () => {
  assertEquals(buildAttemptGameResult("colors", 0, 1, 1), {
    topicId: "colors",
    gameId: "colors:0",
    gameOrder: 0,
    score: 1,
    maxScore: 1,
  });
  assertThrows(() => buildAttemptGameResult("clock", 7, 1, 1));
});

Deno.test("appendAttemptGameResult replaces prior rows for the same game id", () => {
  const first = buildAttemptGameResult("colors", 0, 0, 1);
  const second = buildAttemptGameResult("colors", 0, 1, 1);
  assertEquals(appendAttemptGameResult([first], second), [second]);
});
```

- [ ] **Step 2: Run the helper test to verify it fails**

Run: `deno test src/lib/attempt-game-results.test.ts`

Expected: FAIL with module-not-found errors for `src/lib/attempt-game-results.ts`.

- [ ] **Step 3: Implement the helper and wire `QuizPage` to use it**

```ts
// src/lib/attempt-game-results.ts
import type { AttemptGameResultInput } from "./api";
import { getGameCatalogEntry } from "./game-catalog.ts";

export function buildAttemptGameResult(
  topicId: string,
  gameOrder: number,
  score: number,
  maxScore: number,
): AttemptGameResultInput {
  const entry = getGameCatalogEntry(topicId, gameOrder);
  if (!entry) {
    throw new Error(`Unknown game catalog entry for ${topicId}:${gameOrder}`);
  }
  return {
    topicId: entry.topicId,
    gameId: entry.gameId,
    gameOrder: entry.gameOrder,
    score,
    maxScore,
  };
}

export function appendAttemptGameResult(
  current: AttemptGameResultInput[],
  next: AttemptGameResultInput,
): AttemptGameResultInput[] {
  return [...current.filter((row) => row.gameId !== next.gameId), next];
}
```

```tsx
// src/pages/QuizPage.tsx
import { appendAttemptGameResult, buildAttemptGameResult } from "@/lib/attempt-game-results";
import type { AttemptGameResultInput } from "@/lib/api";

const [gameResults, setGameResults] = useState<AttemptGameResultInput[]>([]);

const withCurrentGameResult = (
  current: AttemptGameResultInput[],
  gameScore: number,
  gameMaxScore: number,
) => appendAttemptGameResult(current, buildAttemptGameResult(topic, currentIndex, gameScore, gameMaxScore));

const completeStructuredGame = async (gameScore = 1, gameMaxScore = 1) => {
  const nextResults = withCurrentGameResult(gameResults, gameScore, gameMaxScore);
  setGameResults(nextResults);
  setScore((currentScore) => currentScore + gameScore);
  if (currentIndex < questions.length - 1) {
    setCurrentIndex((value) => value + 1);
    setSelectedOption(null);
    setGameState("playing");
    return;
  }
  await finishAttempt(nextResults, gameScore);
};

const finishAttempt = async (nextResults: AttemptGameResultInput[], latestScoreDelta = 0) => {
  setGameState("completed");
  const durationSeconds = Math.round((Date.now() - startTime) / 1000);
  const maxScore = questions.length;
  const finalScore = score + latestScoreDelta;
  confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ["#22c55e", "#eab308", "#f97316"] });
  try {
    await submitAttempt.mutateAsync({
      lessonId: topic,
      assignmentId,
      score: finalScore,
      maxScore,
      durationSeconds,
      gameResults: nextResults,
    });
  } catch (error) {
    console.error("Failed to submit score", error);
  }
};

// inside handleNext, record the generic-question result before advancing
const questionScore = selectedOption?.isCorrect ? 1 : 0;
const nextResults = withCurrentGameResult(gameResults, questionScore, 1);
setGameResults(nextResults);
if (currentIndex < questions.length - 1) {
  setCurrentIndex((value) => value + 1);
  setSelectedOption(null);
  setGameState("playing");
} else {
  await finishAttempt(nextResults, questionScore);
}

// replace the repeated structured-game callbacks
<ColorMatchingGame onComplete={() => { void completeStructuredGame(); }} />
<BalloonFindingGame onComplete={() => { void completeStructuredGame(); }} />
<RainbowColorCatcher onComplete={() => { void completeStructuredGame(); }} />
```

- [ ] **Step 4: Run the helper test and then the full verification sweep**

Run: `deno test src/lib/attempt-game-results.test.ts`

Expected: PASS with 2 passing tests.

Run: `deno test src/lib/game-catalog.test.ts src/lib/teacher-progress.test.ts src/lib/teacher-nav.test.ts src/lib/attempt-game-results.test.ts supabase/functions/attempts-submit/handler_test.ts supabase/functions/classes-roster/handler_test.ts supabase/functions/classes-remove-student/handler_test.ts`

Expected: PASS with all tests green and no skipped cases.

Run: `npm run typecheck`

Expected: PASS with `QuizPage` submitting the new `gameResults` payload type safely.

Run: `npm run build`

Expected: PASS and emit a production bundle with the redesigned teacher pages and instrumented lesson flow.

- [ ] **Step 5: Commit**

```bash
git add src/lib/attempt-game-results.ts src/lib/attempt-game-results.test.ts src/pages/QuizPage.tsx
git commit -m "feat: send detailed game results from lessons"
```
