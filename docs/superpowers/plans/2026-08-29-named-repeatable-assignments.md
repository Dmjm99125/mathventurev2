# Named Repeatable Assignments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist classroom quiz completion reliably and let teachers create and review multiple named assignments for the same lesson.

**Architecture:** Keep assignment IDs as the identity boundary. Add names to the existing assignment APIs and migration, preserve one attempt per student per assignment, and have the classroom roster return assignment-grouped score details. Make quiz completion state change only after a successful server mutation.

**Tech Stack:** React, TypeScript, Supabase Edge Functions, PostgreSQL migrations, Deno tests, React Query.

## Global Constraints

- Do not create a second assignment/attempt persistence system.
- Assigned quiz attempts remain one-time per assignment ID.
- Preserve free-play behavior and existing classroom completion metrics.
- Never display fabricated scores; use `--` when no saved result exists.

---

### Task 1: Add failing persistence and assignment regression tests

**Files:**
- Modify: `test/src/pages/QuizPage.test.ts`
- Modify: `test/supabase/functions/assignments-create/handler.test.ts` if present, otherwise create it
- Modify: `test/supabase/functions/assignments-list/handler.test.ts` if present, otherwise create it
- Modify: `test/supabase/functions/classes-roster/handler.test.ts`
- Modify: `test/src/lib/student/portal.test.ts`

- [ ] **Step 1: Write tests that require named duplicate assignments, assignment-grouped scores, and failed completion not becoming completed.**
- [ ] **Step 2: Run the focused tests and confirm they fail for the missing contract.**

Run:

```powershell
deno test --allow-read test/src/pages/QuizPage.test.ts test/src/lib/student/portal.test.ts test/supabase/functions/classes-roster/handler.test.ts test/supabase/functions/assignments-create/handler.test.ts test/supabase/functions/assignments-list/handler.test.ts
```

Expected: failure on the new assertions, with no unrelated implementation changes.

### Task 2: Add assignment names and API support

**Files:**
- Create: `supabase/migrations/0011_named_assignments.sql`
- Modify: `supabase/functions/assignments-create/index.ts`
- Modify: `supabase/functions/assignments-list/index.ts`
- Modify: `src/lib/api/client.ts`
- Modify: `src/components/teacher/TeacherAssignQuizDialog.tsx`

- [ ] **Step 1: Add `assignments.name` with a safe default and no uniqueness constraint.**
- [ ] **Step 2: Validate/store names on create and return names on both assignment list branches.**
- [ ] **Step 3: Add the name to frontend assignment types and collect/display it in the teacher dialog.**
- [ ] **Step 4: Run the assignment API and UI tests and confirm they pass.**

### Task 3: Preserve and expose assignment-level scores in the roster

**Files:**
- Modify: `supabase/functions/classes-roster/handler.ts`
- Modify: `src/lib/api/client.ts`
- Modify: `src/components/teacher/TeacherStudentProgressTable.tsx`
- Modify: `test/supabase/functions/classes-roster/handler.test.ts`
- Modify: `test/src/components/teacher-student-progress-table.test.ts`

- [ ] **Step 1: Return assignment metadata and attempt status keyed by assignment ID.**
- [ ] **Step 2: Group each assignment’s latest detailed results by attempt ID and retain prior assignments.**
- [ ] **Step 3: Render named assignment rows with separate overall and per-game score grids.**
- [ ] **Step 4: Run focused roster and UI tests and confirm they pass.**

### Task 4: Make quiz completion retryable after persistence failure

**Files:**
- Modify: `src/pages/QuizPage.tsx`
- Modify: `test/src/pages/QuizPage.test.ts`

- [ ] **Step 1: Add a failing source/behavior assertion that failed completion leaves the quiz retryable.**
- [ ] **Step 2: Return success from `finishAttempt`, only set `gameState` to `completed` after success, and keep the current state/error on failure.**
- [ ] **Step 3: Add a visible retry action that repeats the same final payload without replaying games.**
- [ ] **Step 4: Run the QuizPage tests and confirm they pass.**

### Task 5: Verify and commit

**Files:** None beyond the files above.

- [ ] **Step 1: Run focused tests.**
- [ ] **Step 2: Run `npm.cmd run typecheck`.**
- [ ] **Step 3: Run `npm.cmd run build`.**
- [ ] **Step 4: Run `deno test --allow-read test` and record any pre-existing failures.**
- [ ] **Step 5: Run `git diff --check`, review status, and commit only intended files.**
