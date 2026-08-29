# Teacher Game Score Breakdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with review checkpoints.

**Goal:** Add the latest overall score and latest score for every completed game to the teacher classroom Student Progress view.

**Architecture:** Keep `attempts` as the source for the latest overall score and `attempt_game_results` as the source for per-game scores. Extend `classes-roster` to return both datasets scoped to the teacher’s classroom, add typed fields to the API client, and render an expandable per-student breakdown in the existing progress table. Reports and scoring writes remain unchanged.

**Tech Stack:** React, TypeScript, Supabase Edge Functions, Deno tests, TanStack Query.

## Global Constraints

- Do not add a duplicate score table or a second write path.
- Exclude incomplete attempts from teacher progress data.
- Keep existing completion percentages and selected-window report aggregates unchanged.
- Missing game scores display as `--`, not zero.

---

### Task 1: Extend the roster data contract and query completed overall attempts

**Files:**
- Modify: `src/lib/api/client.ts`
- Modify: `supabase/functions/classes-roster/handler.ts`
- Test: `test/supabase/functions/classes-roster/handler.test.ts`

**Interfaces:**
- `TeacherClassStudent` produces `overallScore`, `overallMaxScore`, `overallScorePct`, and `gameScores`.
- `classes-roster` returns each student’s latest completed attempt overall and latest completed game result per `gameId`.

- [ ] **Step 1: Write failing handler assertions**

Extend the fixture with two overall attempts and repeated game rows, then assert the response keeps only the newest completed overall attempt and newest row per game. Add an incomplete-attempt fixture dependency result and assert it is not returned.

```ts
assertEquals(json.students[0].overallScore, 8);
assertEquals(json.students[0].overallMaxScore, 10);
assertEquals(json.students[0].overallScorePct, 80);
assertEquals(json.students[0].gameScores, [
  { gameId: "colors:0", score: 1, maxScore: 1, scorePct: 100, completedAt: "2026-07-29T09:00:00.000Z" },
  { gameId: "colors:1", score: 3, maxScore: 4, scorePct: 75, completedAt: "2026-07-28T09:00:00.000Z" },
]);
```

- [ ] **Step 2: Run the focused handler test and confirm the new assertions fail**

Run:

```bash
deno test --allow-read test/supabase/functions/classes-roster/handler.test.ts
```

Expected: failure because the roster response does not yet expose overall or per-game score fields.

- [ ] **Step 3: Add typed score records**

In `src/lib/api/client.ts`, add:

```ts
export interface TeacherGameScore {
  gameId: string;
  score: number;
  maxScore: number;
  scorePct: number;
  completedAt: string;
}
```

Add these fields to `TeacherClassStudent`:

```ts
overallScore: number | null;
overallMaxScore: number | null;
overallScorePct: number | null;
gameScores: TeacherGameScore[];
```

- [ ] **Step 4: Query and select latest completed data in `classes-roster`**

Add completed-attempt dependency data with `studentId`, `score`, `maxScore`, and `completedAt`. Scope both attempt queries to the current classroom. Group overall attempts by student and retain the greatest `completedAt`. Group detailed rows by student and `gameId`, retain the greatest `completedAt`, calculate `scorePct`, and sort game scores by `gameId`.

Return null overall fields and an empty `gameScores` array when no completed data exists, while preserving the existing `appCompletionPct` and `lastPlayedPct` calculations.

- [ ] **Step 5: Run the focused handler test and confirm it passes**

Run the same Deno command from Step 2. Expected: all roster tests pass.

- [ ] **Step 6: Commit the data-contract change**

```bash
git add src/lib/api/client.ts supabase/functions/classes-roster/handler.ts test/supabase/functions/classes-roster/handler.test.ts
git commit -m "feat: expose teacher game score breakdowns"
```

### Task 2: Render expandable overall and per-game scores

**Files:**
- Modify: `src/components/teacher/TeacherStudentProgressTable.tsx`
- Test: `test/src/components/teacher-student-progress-table.test.ts`

**Interfaces:**
- Consumes the extended `TeacherClassStudent` shape from Task 1.
- Produces an accessible expandable row with overall and per-game score details.

- [ ] **Step 1: Write failing component source assertions**

Create a source-level contract test that asserts the component uses expanded-row state, renders overall score fields, and maps the game catalog to show missing values as `--`.

```ts
assertEquals(source.includes("useState<string | null>(null)"), true);
assertEquals(source.includes("overallScorePct"), true);
assertEquals(source.includes("gameScores"), true);
assertEquals(source.includes("aria-expanded"), true);
assertEquals(source.includes("GAME_CATALOG"), true);
```

- [ ] **Step 2: Run the focused component test and confirm it fails**

```bash
deno test --allow-read test/src/components/teacher-student-progress-table.test.ts
```

Expected: failure because the progress table has no expandable score breakdown.

- [ ] **Step 3: Implement the compact expandable table**

Add `expandedStudentId` state and an expand/collapse button per student. Add an Overall Score column displaying `score / maxScore` and percentage, with `--` if no completed attempt exists.

When expanded, render a nested responsive grid over `GAME_CATALOG`; look up each `gameId` in the student’s `gameScores` and display its catalog title, score/max score, and percentage, or `--` when absent. Use `aria-expanded` and `aria-controls` on the toggle.

- [ ] **Step 4: Run the focused component test and confirm it passes**

```bash
deno test --allow-read test/src/components/teacher-student-progress-table.test.ts
```

Expected: all component contract tests pass.

- [ ] **Step 5: Commit the dashboard UI change**

```bash
git add src/components/teacher/TeacherStudentProgressTable.tsx test/src/components/teacher-student-progress-table.test.ts
git commit -m "feat: show teacher per-game student scores"
```

### Task 3: Verify integration and regressions

**Files:**
- Verify: `test/src/lib/teacher/progress.test.ts`
- Verify: `test/src/lib/teacher/reports/index.test.ts`
- Verify: `test/src/pages/teacher-assignment.test.ts`

- [ ] **Step 1: Run focused roster, teacher UI, and report tests**

```bash
deno test --allow-read test/supabase/functions/classes-roster/handler.test.ts test/src/components/teacher-student-progress-table.test.ts test/src/lib/teacher/progress.test.ts test/src/lib/teacher/reports/index.test.ts test/src/pages/teacher-assignment.test.ts
```

Expected: all selected tests pass.

- [ ] **Step 2: Run typecheck**

```bash
npm.cmd run typecheck
```

Expected: TypeScript exits with code 0.

- [ ] **Step 3: Run the production build**

```bash
npm.cmd run build
```

Expected: Vite exits with code 0; existing CSS/chunk warnings may remain.

- [ ] **Step 4: Run the full Deno suite**

```bash
deno test --allow-read test
```

Expected: no new failures attributable to the score breakdown; report any pre-existing failures explicitly.

- [ ] **Step 5: Review the final diff and commit status**

```bash
git diff --check
git status --short --branch
git log -2 --oneline
```

Confirm only intended files changed and no generated build output is staged.
