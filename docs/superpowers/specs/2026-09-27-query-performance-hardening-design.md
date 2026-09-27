# Query Performance Hardening Design

## Status

Approved direction; implementation spec for review before coding.

## Problem

Teacher-facing Supabase Edge Functions currently retrieve unbounded classroom
data and perform repeated filtering, sorting, and grouping in TypeScript. The
largest example is `classes-roster`, which loads every enrolled student, every
assignment, every attempt, and every game result into one request. Dashboards,
reports, and assignment lists have similar unbounded history reads.

This creates three scaling risks:

- response bodies grow with the entire classroom and its history;
- Edge Function memory and CPU grow with the number of students multiplied by
  assignments and attempts;
- concurrent teachers repeat the same expensive database scans.

The target is a classroom or dataset with up to 100,000 records without
requiring Redis, a separate cache, or another paid service. The application
must remain responsive for ordinary classrooms and must not make a single
request proportional to the entire dataset.

## Goals

- Keep Supabase Postgres and Edge Functions as the only backend components.
- Bound every high-volume read with a validated page size, cursor, or database
  aggregate.
- Make the roster response shown in the current teacher UI cheap to load and
  cheap to render.
- Load assignment and game-score detail only for the student the teacher opens.
- Replace dashboard/report history downloads with database-side grouped
  aggregates and bounded recent-activity results.
- Add indexes that match the actual filter, join, and ordering predicates.
- Preserve existing authorization, data semantics, and response fields wherever
  the current UI depends on them.
- Keep all app-data access behind the existing Edge Function boundary and
  HTTPS transport.

## Non-goals

- No Redis, hosted cache, queue, search engine, or other external runtime.
- No frontend encryption key or client-side secret.
- No database sharding or destructive table rewrite.
- No weakening of RLS or authorization checks.
- No change to scoring rules, assignment eligibility, or class ownership.
- No promise that a browser should render 100,000 rows at once. Large result
  sets must be paged or summarized.

## Options considered

### Add indexes only

This is low risk and helps individual queries, but it leaves the API response,
Edge Function memory, and JavaScript O(n*m) processing unbounded. It does not
meet the requirement by itself.

### Add a separate cache

A cache could reduce repeated reads, but it adds cost, invalidation logic, and
another operational dependency. It is explicitly outside the project budget
and constraints.

### Paginate reads, aggregate in Postgres, and add matching indexes

This keeps the current architecture, bounds work per request, and lets Postgres
use its indexes for filtering and grouping. It requires small API and UI
contract changes, but it provides the best balance of cost, correctness, and
operational simplicity. This is the selected approach.

## Proposed design

### 1. Shared pagination rules

Add a small shared Edge Function pagination utility with:

- a default page size of 50;
- a hard maximum of 100;
- strict integer parsing and rejection of invalid or negative values;
- opaque base64url cursors containing the last stable sort values;
- deterministic tie-breakers using the row UUID;
- `page: { nextCursor: string | null, hasMore: boolean }` in paged responses.

Use keyset pagination rather than large offsets. The cursor must contain enough
ordering state to continue from `(timestamp, id)` or `(name, id)` without
exposing internal query details to the frontend.

### 2. Roster summary and lazy detail

`classes-roster` will support two bounded modes:

- Summary mode (the default): returns one page of enrolled students with the
  current summary fields (`overallScore`, completion percentages, and so on),
  but empty `gameScores` and `assignments` arrays. It also returns pagination
  metadata.
- Detail mode (`studentId`): verifies that the requested student belongs to the
  teacher's classroom, then returns the existing full assignment and game-score
  shape for that one student only.

The summary query will use a Postgres-side aggregate or a bounded page-scoped
query for latest attempt and progress values. The detail query will filter by
one student and class before reading attempts or game results. It will not use a
nested `attempts!inner` result scan across all enrolled students.

The frontend will:

- render the first summary page immediately;
- offer a “load more” control for additional students;
- request detail only when a student is expanded;
- cache expanded detail in the existing query client;
- preserve the current visible table fields and game/assignment presentation.

This keeps the initial request and each expansion bounded while retaining the
current teacher workflow.

### 3. Assignment list pagination

`assignments-list` will accept the shared page-size and cursor parameters and
return pagination metadata for both teacher and student paths. Its queries will
be scoped before ordering and will select only the columns needed by the UI.
The latest-attempt lookup will be limited to the returned assignment IDs and
will use the composite assignment/student/update index.

Teacher assignment views will page assignment records and will not require the
entire classroom roster to construct one response. Student-specific status will
continue to be calculated from the latest matching attempt.

### 4. Database-side dashboard and report aggregation

Add SQL migrations for stable, service-role-only aggregate functions used by
Edge Functions:

- teacher dashboard totals grouped by class and lesson;
- teacher report student rows and topic/game breakdowns for a requested time
  window;
- bounded recent passes/activity ordered by completion time.

The functions will filter by the teacher-owned classroom and time window before
grouping. They will return aggregate rows or compact JSON payloads, not every
historical attempt/game-result row. The Edge Functions remain responsible for
authentication, authorization, window parsing, and response formatting.

Report student rows and other potentially large display lists will be paged;
class totals, attention summaries, topic breakdowns, and recent activity remain
bounded aggregates. Existing report semantics (pass percentage, completion,
window boundaries, and class attribution) must be preserved.

`dashboard-student` will return a bounded recent-attempt list while calculating
completed-lesson and streak values in the database or from bounded date queries.

### 5. Indexes and query shapes

Add a forward-compatible migration with indexes matching the new access paths,
including:

- teacher lookup on `classes`;
- class-ordered enrollment on `class_students`;
- class and student assignment ordering on `assignments`;
- class/student/status/completion ordering on `attempts`;
- assignment/student/update ordering on `attempts`;
- attempt-scoped and student-scoped ordering on
  `attempt_game_results`.

Indexes will be created with `if not exists`, and no existing index will be
dropped in this change. Query projections will remain narrow and all list
queries will have explicit ordering and limits.

### 6. Edge Function and frontend contracts

Update the typed API client and React Query hooks to carry pagination metadata,
stable query keys, and lazy detail state. Keep compatibility for callers that
only inspect `students` or `assignments` arrays. Update table and assignment
components to handle loading, empty, error, and “more available” states without
rendering all pages simultaneously.

The backend will reject requests that exceed the hard page-size limit instead of
silently accepting an expensive query. Authorization checks happen before
pagination and before detail lookup.

## Correctness requirements

- A teacher can only receive students, assignments, attempts, and results from
  the teacher's singleton classroom.
- A student detail request for a non-enrolled student returns the same safe
  not-found/forbidden behavior as other classroom APIs.
- Completed-attempt and game-result semantics remain unchanged.
- Cursor ordering is stable when rows share timestamps or names.
- Empty classrooms and students with no attempts retain the existing `null` and
  empty-array values.
- Report windows are applied at the database boundary and use the same UTC
  start/end semantics as the current report builder.

## Verification plan

Before implementation, preserve the existing unit and integration tests and add
coverage for:

- cursor parsing, maximum page size, and stable continuation;
- roster summary versus single-student detail responses;
- authorization for detail and aggregate queries;
- assignment pagination and latest-attempt selection;
- report windows, empty data, and class attribution;
- bounded recent-attempt output;
- database migration syntax and the Supabase function test lane.

Run the relevant checks after each logical edit, then the repository CI-equivalent
frontend typecheck/test/build and Supabase test command. If Deno or Supabase is
unavailable locally, report that lane as unverified rather than weakening it.

## Deployment boundary

No deployment is part of implementation. Once merged, the operator must deploy
the new Supabase migration first and then the changed Edge Functions. The
frontend can be deployed after the functions are live. Rollout should be
verified against a staging/project database before production use.
