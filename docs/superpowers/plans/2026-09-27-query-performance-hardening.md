# Query Performance Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with review checkpoints.

**Goal:** Bound high-volume MathVenture reads, move dashboard/report aggregation into Postgres, and keep roster and assignment screens responsive without Redis or another external service.

**Architecture:** Supabase Edge Functions remain the only application backend. Keyset-paginated responses serve list screens, single-student detail is loaded on demand, and SQL RPCs return compact teacher/student aggregates. Composite Postgres indexes match every filter and ordering path.

**Tech Stack:** Supabase Postgres migrations, Deno TypeScript Edge Functions, React + TanStack Query, existing Supabase JS client, existing Deno test suite.

## Global Constraints

- Keep Supabase Postgres and Edge Functions as the only backend components.
- No Redis, hosted cache, queue, search engine, or other external runtime.
- No frontend encryption key or client-side secret.
- No weakening of RLS or authorization checks.
- Large result sets must be paged or summarized; browsers must not render 100,000 rows at once.
- Default page size is 50 and hard maximum is 100 for high-volume list endpoints.
- Use stable keyset cursors with deterministic UUID tie-breakers.
- Preserve existing scoring, assignment eligibility, class ownership, and UTC report-window semantics.
- Do not claim Supabase tests pass while the local environment lacks Deno.

---

## File map

Create `supabase/functions/_shared/pagination.ts` and its Deno tests for page-size validation and opaque cursors. Create `supabase/migrations/0013_query_performance.sql` for composite indexes and service-role aggregate functions.

Modify `supabase/functions/classes-roster/handler.ts`, `frontend/src/lib/api/client.ts`, `frontend/src/lib/api/hooks.ts`, `frontend/src/pages/teacher.tsx`, and the teacher roster components for summary pagination and lazy student detail.

Modify `supabase/functions/assignments-list/handler.ts` and its tests plus the assignment client/hooks/components for assignment pagination. Modify dashboard and report handlers/shared loaders to consume bounded SQL aggregates. Preserve unrelated dirty files in the main checkout.

---

### Task 1: Add the shared keyset-pagination utility

**Files:**
- Create: `supabase/functions/_shared/pagination.ts`
- Test: `test/supabase/functions/_shared/pagination.test.ts`

**Interfaces:** `DEFAULT_PAGE_SIZE = 50`, `MAX_PAGE_SIZE = 100`, `parsePageRequest(url)`, `encodeCursor(value)`, and `decodeCursor<T>(value)`. `parsePageRequest` returns `{ pageSize, cursor }` and throws a status-422-compatible error for invalid or out-of-range values.

- [ ] **Step 1: Write the failing tests.** Cover the default size, accepted size 100, rejected sizes 0/101, cursor round-trip, malformed cursor rejection, and cursor rejection for `null` or array payloads.

```ts
Deno.test("parsePageRequest enforces bounded sizes", () => {
  assertEquals(parsePageRequest(new URL("http://local/")), { pageSize: 50, cursor: null });
  assertEquals(parsePageRequest(new URL("http://local/?pageSize=100")).pageSize, 100);
  assertThrows(() => parsePageRequest(new URL("http://local/?pageSize=101")));
});
```

- [ ] **Step 2: Run the focused test and verify RED.** Run `deno test --allow-read --config frontend/deno.json test/supabase/functions/_shared/pagination.test.ts`. Expected: missing module/export failure. If Deno is unavailable, record that exact environment failure and keep the test.

- [ ] **Step 3: Implement the minimal utility.** Use `TextEncoder`/`TextDecoder` and URL-safe base64. Reject malformed JSON and non-object payloads. Do not add offset pagination.

- [ ] **Step 4: Run the focused test again and verify GREEN.** The focused pagination tests must pass when Deno is available.

- [ ] **Step 5: Commit.** Run `git add supabase/functions/_shared/pagination.ts test/supabase/functions/_shared/pagination.test.ts` and commit `feat: add bounded keyset pagination utilities`.

### Task 2: Add matching database indexes and aggregate RPC contracts

**Files:**
- Create: `supabase/migrations/0013_query_performance.sql`
- Create: `supabase/functions/_shared/aggregate_contract.ts`
- Test: `test/supabase/functions/_shared/aggregate_contract.test.ts`

**Interfaces:** Add `get_teacher_dashboard_summary(p_teacher_id uuid)`, `get_student_dashboard_summary(p_student_id uuid, p_recent_limit integer)`, and `get_teacher_report_summary(p_teacher_id uuid, p_start_at timestamptz, p_end_at timestamptz, p_student_limit integer, p_student_cursor uuid)` SQL functions. Add typed runtime parsers `parseTeacherDashboardAggregate`, `parseStudentDashboardAggregate`, and `parseTeacherReportAggregate`.

The aggregate contracts are explicit: teacher dashboard returns `{ classCount, studentCount, classes: [{ id, name, studentCount, attemptCount, averageScorePct }], strugglingLessons: [{ lessonId, attempts, averageScorePct }] }`; student dashboard returns `{ completedLessons, streakDays, recentAttempts: [{ lessonId, score, maxScore, completedAt }] }`; teacher reports returns `{ classroom, attentionStudents, recentActivity, studentRows, topicBreakdown, page }`, where `page` is `{ nextCursor: string | null, hasMore: boolean }`.

- [ ] **Step 1: Write failing contract tests.** Pass incomplete RPC-shaped objects and assert each parser throws. Pass a complete fixture and assert nullable score fields and page metadata are preserved.

- [ ] **Step 2: Run the focused contract test and verify RED.** Run `deno test --allow-read --config frontend/deno.json test/supabase/functions/_shared/aggregate_contract.test.ts`. Expected: missing parser failure.

- [ ] **Step 3: Add indexes with `create index if not exists`.** Cover teacher lookup, class-ordered enrollment, class/student assignment ordering, class/student/status/completion ordering, assignment/student/update ordering, and attempt/student game-result ordering. Include `id` after timestamp/name fields for deterministic cursors. Do not drop existing indexes.

- [ ] **Step 4: Add the SQL RPCs.** Each SQL function must derive and enforce the teacher-owned singleton class, filter class and time window before grouping, clamp limits to 100, and return compact aggregate rows/JSON rather than historical raw result sets. Revoke public execution and grant execution only to the Supabase service role.

- [ ] **Step 5: Implement parsers, run tests, and typecheck.** Run the focused contract test and `npm run typecheck --prefix frontend`; both must pass when Deno is available, and TypeScript must exit 0.

- [ ] **Step 6: Commit.** Commit `perf: add query indexes and aggregate contracts` with the migration, parser, and tests.

### Task 3: Make the roster response bounded and detail lazy

**Files:**
- Modify: `supabase/functions/classes-roster/handler.ts`
- Modify: `test/supabase/functions/classes-roster/handler.test.ts`
- Modify: `frontend/src/lib/api/client.ts`
- Modify: `frontend/src/lib/api/hooks.ts`
- Modify: `frontend/src/pages/teacher.tsx`
- Modify: `frontend/src/components/teacher/TeacherStudentProgressTable.tsx`
- Modify: `frontend/src/components/teacher/TeacherStudentListTable.tsx`

**Interfaces:** Define the shared client type `PageInfo = { nextCursor: string | null; hasMore: boolean }`. Summary mode returns `{ students: TeacherClassStudent[]; page: PageInfo }` with empty detail arrays. `GET /classes-roster?studentId=<uuid>` returns one full student in the existing shape. The client exposes `api.classes.roster({ cursor?: string; pageSize?: number })` and `api.classes.rosterStudent(studentId)`, and `useClassRoster` is infinite while `useClassRosterStudent` caches by student ID.

- [ ] **Step 1: Write failing handler tests.** Assert summary mode returns page metadata, never calls detail loading, and returns empty `assignments`/`gameScores`. Assert detail mode verifies enrollment and preserves latest-game, score, empty-progress, and name semantics from the existing tests.

- [ ] **Step 2: Run the focused roster test and verify RED.** Run `deno test --allow-read --config frontend/deno.json test/supabase/functions/classes-roster/handler.test.ts`. Expected: the current unbounded handler does not satisfy the new split contract.

- [ ] **Step 3: Implement the backend.** Parse page parameters before database reads. Query `class_students` by the authorized class with stable keyset ordering. Scope summary aggregates to only the returned student IDs. For detail, verify enrollment, query one student’s assignments/attempts, then query game rows by returned attempt IDs. Build `Map` indexes once instead of filtering full arrays inside nested loops.

- [ ] **Step 4: Run focused roster tests and typecheck.** Expected: roster tests pass and `npm run typecheck --prefix frontend` exits 0.

- [ ] **Step 5: Update the UI.** Flatten infinite pages, add “Load more students”, and fetch detail only when a row expands. Show local detail loading/error states and keep the current table fields and assignment/game presentation.

- [ ] **Step 6: Build and commit.** Run `npm run typecheck --prefix frontend` and `npm run build --prefix frontend`, then commit `perf: paginate roster and lazy load student detail`.

### Task 4: Paginate assignment reads

**Files:**
- Modify: `supabase/functions/assignments-list/handler.ts`
- Modify: `test/supabase/functions/assignments-list/handler.test.ts`
- Modify: `frontend/src/lib/api/client.ts`
- Modify: `frontend/src/lib/api/hooks.ts`
- Modify: `frontend/src/pages/teacher.tsx`
- Modify: `frontend/src/components/teacher/TeacherAssignedQuizzes.tsx`

**Interfaces:** Teacher and student assignment responses become `{ assignments: (AssignmentForTeacher | AssignmentForStudent)[]; page: PageInfo }`, accept `pageSize`/`cursor`, and order by `created_at desc, id desc`. Student latest-attempt lookup is restricted to returned assignment IDs and ordered by `updated_at desc, id desc`.

- [ ] **Step 1: Write failing tests.** Cover class/direct teacher assignment deduplication, cursor metadata, page limits, and a student with multiple attempts where only the newest status is returned.

- [ ] **Step 2: Run `deno test --allow-read --config frontend/deno.json test/supabase/functions/assignments-list/handler.test.ts` and verify RED.** The current response is unpaged.

- [ ] **Step 3: Implement keyset queries.** Apply ownership/class scope before ordering, fetch `pageSize + 1`, use the extra row only for `hasMore`, and use maps for deduplication/latest attempts.

- [ ] **Step 4: Update client/UI and verify.** Use an infinite assignment query, flatten only loaded pages, and render “Load more assignments”. Run the focused test, `npm run typecheck --prefix frontend`, and `npm run build --prefix frontend`.

- [ ] **Step 5: Commit.** Commit `perf: paginate assignment reads`.

### Task 5: Replace dashboard and report history downloads with aggregates

**Files:**
- Modify: `supabase/functions/dashboard-teacher/index.ts`
- Modify: `supabase/functions/dashboard-student/index.ts`
- Modify: `supabase/functions/_shared/teacher_reports.ts`
- Modify: `supabase/functions/reports-overview/handler.ts`
- Modify: `supabase/functions/reports-class/handler.ts`
- Modify: existing dashboard/report tests and report table pagination components

**Interfaces:** Teacher dashboard calls `get_teacher_dashboard_summary`; student dashboard calls `get_student_dashboard_summary` with a recent limit of 20; report loaders pass the parsed UTC window and a student-row cursor/limit to `get_teacher_report_summary`. Existing response field names remain stable, with page metadata added to large student-row lists.

- [ ] **Step 1: Write failing handler tests.** Inject RPC dependencies and assert teacher/student handlers use them instead of loading all attempts. Assert student recent attempts are capped at 20, report windows reach the loader, empty windows remain honest, and class attribution/pre-join filtering is preserved.

- [ ] **Step 2: Run the focused dashboard/report tests and verify RED.** Run the existing dashboard tests plus `test/supabase/functions/_shared/teacher_reports.test.ts`, `reports-overview/handler.test.ts`, and `reports-class/handler.test.ts`. Expected: current raw-history loaders fail the new bounded contracts.

- [ ] **Step 3: Implement adapters and handlers.** Validate RPC payloads before formatting responses, preserve authorization before RPC calls, apply report windows in SQL, retain bounded recent passes, and page student rows. Do not expose database error text.

- [ ] **Step 4: Update report UI pagination.** Keep summaries immediately available and page only the student table; reset the cursor when the report window changes.

- [ ] **Step 5: Run tests, typecheck, and build.** All available focused tests, `npm run typecheck --prefix frontend`, and `npm run build --prefix frontend` must pass.

- [ ] **Step 6: Commit.** Commit `perf: bound dashboard and teacher report queries`.

### Task 6: Run the complete CI-equivalent gate and review the diff

**Files:** Modify only to correct verified defects; never weaken a check.

- [ ] **Step 1: Run frontend gates.** Run `npm run typecheck --prefix frontend`, `npm test --prefix frontend`, and `npm run build --prefix frontend`; each test lane must finish within the repository’s 110-second CI budget. Record pre-existing failures separately from regressions.

- [ ] **Step 2: Run the Supabase gate.** Run `deno test --allow-env --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen test/supabase`; enforce the repository’s 110-second CI timeout when running in CI. If Deno remains unavailable, report that lane as unverified.

- [ ] **Step 3: Review query and security invariants.** Run `git diff master...HEAD --check` and inspect every list query for explicit limit/order, every aggregate for teacher ownership, and every browser API path for Edge Function-only app-data access. Confirm no frontend secret was introduced.

- [ ] **Step 4: Commit only required final fixes.** Do not create an empty verification commit.
