# Teacher Multi-Class Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore teacher-owned multi-class management with class-scoped teacher workspaces, reversible archive state, multi-class offline switching, and favicon-derived app icons while preserving the single-class student flow and all existing class data.

**Architecture:** Keep the existing class-scoped database model. Replace singleton resolution with an authenticated teacher-owned class access helper, add nullable archive metadata, and pass the selected `classId` through every teacher query, mutation, route, cache key, and offline filter. `/teacher` becomes the class list; `/teacher/classes/:classId/...` becomes the workspace. Student endpoints remain single-class.

**Tech Stack:** Supabase SQL migrations and Deno Edge Functions, React 19, TypeScript, Wouter, TanStack Query, Deno tests, Vite PWA, Tauri 2, Rust CI checks.

## Global Constraints

- Preserve the existing `Classroom` row and every student, assignment, attempt, post, report, and offline record. Do not backfill, detach, move, or rewrite existing data.
- "Delete" is reversible archive only: set or clear `classes.archived_at`; never physically delete a class or child data.
- Students retain the hidden teacher-provisioned, single-class account flow. Do not add a student class picker or join-code flow.
- Class metadata changes (`create`, `rename`, `archive`, `unarchive`) are online-only.
- Archived classes are readable for roster/reports but reject roster, assignment, post, and other mutations.
- Every teacher class access verifies `classes.teacher_id = authenticatedTeacherId`; never fall back to the first or only class.
- Offline reads and writes include the selected class ID and never use the first cached class as a fallback.
- Write tests first, run the focused failing test, implement the minimum behavior, then run the focused passing test.
- Run checks sequentially to respect the 4.2 GB free-memory constraint. Do not run a dev server beside tests/builds, start Supabase unless a check needs it, or run parallel test shards.
- Preserve existing tests and CI lanes, including the 110-second test limit.
- Commit only current-task files; existing dirty files remain untouched.

## File Map

### Backend and schema

- Create `supabase/migrations/0017_restore_teacher_multi_class.sql`.
- Create `supabase/functions/_shared/teacher_class_access.ts` and its test.
- Create `supabase/functions/classes-update/index.ts`, `handler.ts`, and `handler_test.ts`.
- Modify class, assignment, post, report, dashboard, and offline snapshot handlers.
- Keep `teacher_singleton_class.ts` for the legacy hidden-student lookup contract; remove singleton behavior only from teacher-facing class paths.

### Frontend

- Modify `frontend/src/lib/api/client.ts`, `frontend/src/lib/api/hooks.ts`, `frontend/src/App.tsx`, `frontend/src/pages/teacher.tsx`, and teacher navigation/workspace components.
- Create `frontend/src/lib/teacher/classes.ts`, `TeacherClassList.tsx`, `TeacherClassCard.tsx`, and `TeacherClassManagementDialog.tsx` with focused tests.

### Offline and icons

- Modify the offline snapshot, bootstrap, repository, queries, reports, mutations, and related tests so all classes are stored and class-scoped.
- Regenerate `src-tauri/icons/` from `frontend/public/favicon.svg` and align the PWA manifest.

---

### Task 1: Add the non-destructive multi-class schema and access primitive

**Files:**
- Create: `supabase/migrations/0017_restore_teacher_multi_class.sql`
- Create: `supabase/functions/_shared/teacher_class_access.ts`
- Create: `supabase/functions/_shared/teacher_class_access_test.ts`
- Create: `test/supabase/migrations/teacher_multi_class_migration.test.ts`

**Interfaces:**

```ts
export type TeacherOwnedClass = {
  id: string;
  teacherId: string;
  name: string;
  createdAt: string;
  archivedAt: string | null;
};

export type TeacherClassAccessPersistence = {
  getClass(teacherId: string, classId: string): Promise<TeacherOwnedClass | null>;
};

export async function getTeacherOwnedClass(
  persistence: TeacherClassAccessPersistence,
  teacherId: string,
  classId: string,
): Promise<TeacherOwnedClass>;

export function assertWritableTeacherClass(classroom: TeacherOwnedClass): void;
```

- [ ] **Step 1: Write the failing access tests.** Test that an owned class is returned, a foreign/missing class throws `Classroom not found.`, and an archived class throws `This classroom is archived and read-only.`

- [ ] **Step 2: Write the failing migration contract test.** Read `0017_restore_teacher_multi_class.sql` and assert it contains `add column if not exists archived_at`, drops `classes_teacher_singleton_idx`, contains an existence guard for the initial teacher class, and contains no `delete from public` or `truncate` statement.

Run:

```powershell
deno test --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen supabase/functions/_shared/teacher_class_access_test.ts test/supabase/migrations/teacher_multi_class_migration.test.ts
```

Expected: FAIL because the helper, migration, and test file are absent.

- [ ] **Step 3: Implement the migration.** Use only these data-safe operations:

```sql
alter table public.classes
  add column if not exists archived_at timestamptz;

drop index if exists public.classes_teacher_singleton_idx;

create index if not exists classes_teacher_archive_created_idx
  on public.classes (teacher_id, archived_at, created_at, id);
```

Replace `handle_new_user()` so a new teacher gets `Classroom` only when `not exists (select 1 from public.classes where teacher_id = new.id)`. Do not update existing rows or child tables.

- [ ] **Step 4: Implement and run the access helper tests.** Keep the helper pure; Supabase query construction belongs in handlers. Expected: PASS with no skipped tests.

- [ ] **Step 5: Commit.**

```powershell
git add supabase/migrations/0017_restore_teacher_multi_class.sql supabase/functions/_shared/teacher_class_access.ts supabase/functions/_shared/teacher_class_access_test.ts test/supabase/migrations/teacher_multi_class_migration.test.ts
git commit -m "feat: remove teacher class singleton constraint"
```

---

### Task 2: Restore teacher class list/create/update handlers

**Files:**
- Modify: `supabase/functions/classes-list/handler.ts` and `handler_test.ts`
- Modify: `supabase/functions/classes-create/handler.ts` and `handler_test.ts`
- Create: `supabase/functions/classes-update/index.ts`, `handler.ts`, `handler_test.ts`
- Preserve: `supabase/functions/_shared/hidden_student_provision.ts`, `teacher_singleton_class.ts`, and their student-flow tests.

**Interfaces:**

```ts
export type TeacherClassSummary = {
  id: string;
  name: string;
  createdAt: string;
  archivedAt: string | null;
  studentCount: number;
};

export type TeacherClassesListResponse = {
  classes: TeacherClassSummary[];
  archivedClasses: TeacherClassSummary[];
};

export type ClassManagementAction =
  | { classId: string; action: "rename"; name: string }
  | { classId: string; action: "archive" }
  | { classId: string; action: "unarchive" };
```

- [ ] **Step 1: Replace singleton tests with red tests.** `classes-list` returns all active and archived teacher classes with name, createdAt, archivedAt, and studentCount. `classes-create` accepts `{ name: "Grade 2" }`, returns `201`, and passes the trimmed name to its dependency. Add `classes-update` tests for rename, archive, unarchive, blank-name rejection, non-teacher rejection, foreign-class rejection, and idempotence.

- [ ] **Step 2: Implement list/create/update.** Teacher list returns `{ classes, archivedClasses }`; student list keeps the existing single `{ classroom }` response. Create trims/rejects blank names and inserts only a new class row with `join_code: null` and `archived_at: null`. Update resolves ownership through `getTeacherOwnedClass`, changes only `name` or `archived_at`, and returns the updated summary. Archived classes are readable but not writable.

- [ ] **Step 3: Remove teacher-facing singleton references.** Run:

```powershell
rg -n "teacher_singleton_class|HIDDEN_CLASSROOM_NAME|ensureTeacherSingletonClass|getTeacherSingletonClass" supabase/functions/classes-list supabase/functions/classes-create supabase/functions/classes-roster supabase/functions/classes-add-students supabase/functions/classes-remove-student supabase/functions/classes-update supabase/functions/_shared/teacher_reports.ts
```

Expected: no matches. The hidden-student lookup may continue to use the compatibility helper. Then run the focused class handler tests and expect PASS.

- [ ] **Step 4: Commit.**

```powershell
git add supabase/functions/classes-list supabase/functions/classes-create supabase/functions/classes-update supabase/functions/_shared/teacher_class_access.ts
git commit -m "feat: add teacher class management actions"
```

---

### Task 3: Scope teacher roster, assignments, posts, dashboard, and reports

**Files:**
- Modify `supabase/functions/classes-roster/handler.ts`, `classes-add-students/handler.ts`, `classes-remove-student/handler.ts` and their tests.
- Modify assignment list/create/update/delete handlers and their tests.
- Modify `supabase/functions/posts-list/index.ts` and `posts-create/index.ts`; create `test/supabase/functions/posts-class-access.test.ts`.
- Modify `supabase/functions/_shared/teacher_reports.ts`, `reports-overview`, `reports-class`, `dashboard-teacher`, and their tests.

**Interfaces:**

- Teacher roster/add/remove operations receive an explicit `classId`.
- Teacher assignment list requires `classId`; create/update/delete resolve the owning class.
- Teacher class reports require `classId`.
- All teacher class reads verify ownership; all teacher class writes call `assertWritableTeacherClass`.

- [ ] **Step 1: Add red cross-class and archived-write tests.** Add fixtures for `class-1` and `class-2`. Assert a teacher requesting `class-2` never receives `class-1` students/assignments/results. Assert add students, remove student, assignment create/update/delete, post create, and report mutations reject archived classes before any write/provision call.

- [ ] **Step 2: Implement class-scoped roster and student management.** Parse `classId`, resolve ownership, and add `.eq("class_id", classId)` to membership, assignment, attempt, and game-result queries. Student detail first verifies membership in the selected class. Add/remove student bodies include `classId`.

- [ ] **Step 3: Implement class-scoped assignment and post access.** Teacher assignment list filters the selected class; assignment mutations resolve the assignment’s `class_id` and reject archived classes. Teacher post reads verify ownership; post create rejects archived classes. Student behavior remains unchanged.

- [ ] **Step 4: Remove singleton report resolution.** `teacher_reports.ts`, `reports-overview`, and `reports-class` take the selected class where a class report is requested. Dashboard aggregates iterate all teacher classes by ID; no path picks the first/only class.

- [ ] **Step 5: Run focused backend tests sequentially.**

```powershell
deno test --allow-env --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen test/supabase/functions/classes-roster/handler.test.ts test/supabase/functions/classes-add-students/handler.test.ts test/supabase/functions/classes-remove-student/handler.test.ts
deno test --allow-env --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen test/supabase/functions/assignments-list/handler.test.ts test/supabase/functions/assignments-create/handler.test.ts test/supabase/functions/assignments-update/handler.test.ts test/supabase/functions/assignments-delete/handler.test.ts test/supabase/functions/reports-overview/handler.test.ts test/supabase/functions/reports-class/handler.test.ts test/supabase/functions/dashboard-teacher/handler.test.ts test/supabase/functions/_shared/teacher_reports.test.ts test/supabase/functions/posts-class-access.test.ts
```

Expected: PASS with no skipped tests.

- [ ] **Step 6: Commit.**

```powershell
git add supabase/functions/classes-roster supabase/functions/classes-add-students supabase/functions/classes-remove-student supabase/functions/assignments-list supabase/functions/assignments-create supabase/functions/assignments-update supabase/functions/assignments-delete supabase/functions/posts-list supabase/functions/posts-create supabase/functions/_shared/teacher_reports.ts supabase/functions/reports-overview supabase/functions/reports-class supabase/functions/dashboard-teacher test/supabase/functions/classes-roster test/supabase/functions/classes-add-students test/supabase/functions/classes-remove-student test/supabase/functions/assignments-list test/supabase/functions/assignments-create test/supabase/functions/assignments-update test/supabase/functions/assignments-delete test/supabase/functions/reports-overview test/supabase/functions/reports-class test/supabase/functions/dashboard-teacher test/supabase/functions/_shared/teacher_reports.test.ts test/supabase/functions/posts-class-access.test.ts
git commit -m "feat: scope teacher operations to selected classes"
```

---

### Task 4: Add frontend class contracts, routes, and workspace UI

**Files:**
- Modify `frontend/src/lib/api/client.ts`, `frontend/src/lib/api/hooks.ts`, `frontend/src/App.tsx`, `frontend/src/pages/teacher.tsx`, `frontend/src/lib/teacher/navigation.ts`, and `frontend/src/components/teacher/TeacherWorkspaceBoard.tsx`.
- Create `frontend/src/lib/teacher/classes.ts`, `frontend/src/components/teacher/TeacherClassList.tsx`, `TeacherClassCard.tsx`, and `TeacherClassManagementDialog.tsx`.
- Pass `classId` through teacher pages, add-student/assignment dialogs, reports, mutation invalidation, and sidebar links.
- Add/update frontend client, navigation, page, and teacher component tests.

**Interfaces:**

```ts
export function teacherClassPath(
  classId: string,
  section?: "students" | "assignments" | "reports",
): string;

export function isArchivedClass(classroom: TeacherClassSummary): boolean;

export function TeacherClassesPage(): JSX.Element;

export function TeacherClassWorkspacePage(input: {
  classId: string;
  section: "today" | "students" | "assignments" | "reports";
}): JSX.Element;
```

- [ ] **Step 1: Write red pure-helper and route tests.** Assert `teacherClassPath("class-1", "reports")` is `/teacher/classes/class-1/reports`; `isArchivedClass` reads only `archivedAt`; API calls send `{ name }`, `{ classId, action }`, and class-scoped query parameters; query keys contain class IDs.

- [ ] **Step 2: Implement API client/hooks.** Add `TeacherClassSummary`, the active/archived list response, `api.classes.update`, and class-required roster/add/remove methods. Change `useClassRoster`, `useAssignments`, `useTeacherClassReport`, posts, and teacher mutations to accept class IDs. Keep student hooks single-class.

- [ ] **Step 3: Implement routes.** `/teacher` renders `TeacherClassesPage`; `/teacher/classes/:classId/:section?` renders `TeacherClassWorkspacePage`; settings stays independent. Redirect unscoped teacher students/assignments/reports/classes routes to `/teacher` instead of selecting silently.

- [ ] **Step 4: Implement the class list.** Active cards show name, student count, creation date, and open `/teacher/classes/:classId`. Provide New Class, Rename, Archive, an Archived Classes section, and Unarchive. Offline metadata mutations are disabled with an online-only message.

- [ ] **Step 5: Make workspace pages class-aware.** `TeacherTodayPage`, `TeacherStudentsPage`, `TeacherAssignmentsPage`, and `TeacherReportsPage` receive `classId` and use class-scoped hooks. `TeacherWorkspaceBoard` and `TeacherSidebar` receive `classId` so links remain inside the selected class.

- [ ] **Step 6: Make archived classes read-only.** Show a read-only banner and hide/disable Add Students, Remove Student, Assign Quiz, assignment create/edit/delete, and post create. Keep roster and reports readable.

- [ ] **Step 7: Run focused frontend tests and typecheck.**

```powershell
deno test --allow-read --allow-env --config frontend/deno.json --lock=frontend/deno.lock --frozen frontend/test/src/lib/teacher/classes.test.ts frontend/test/src/lib/teacher/navigation.test.ts frontend/test/src/lib/api/client.test.ts frontend/test/src/pages/teacher-dashboard.test.ts frontend/test/src/pages/teacher-assignment.test.ts frontend/test/src/components/teacher-class-list.test.ts frontend/test/src/components/teacher-today.test.ts frontend/test/src/components/teacher-assigned-quizzes.test.ts
npm run typecheck --prefix frontend
```

Expected: both commands exit 0.

- [ ] **Step 8: Commit.**

```powershell
git add frontend/src/App.tsx frontend/src/pages/teacher.tsx frontend/src/lib/api/client.ts frontend/src/lib/api/hooks.ts frontend/src/lib/teacher/classes.ts frontend/src/lib/teacher/navigation.ts frontend/src/components/teacher/TeacherClassList.tsx frontend/src/components/teacher/TeacherClassCard.tsx frontend/src/components/teacher/TeacherClassManagementDialog.tsx frontend/src/components/teacher/TeacherWorkspaceBoard.tsx frontend/src/components/teacher/TeacherToday.tsx frontend/src/components/teacher/TeacherSidebar.tsx frontend/src/components/teacher/TeacherAddStudentsDialog.tsx frontend/src/components/teacher/TeacherAssignQuizDialog.tsx frontend/src/components/teacher/TeacherAssignedQuizzes.tsx frontend/test/src/lib/teacher/classes.test.ts frontend/test/src/lib/teacher/navigation.test.ts frontend/test/src/lib/api/client.test.ts frontend/test/src/pages/teacher-dashboard.test.ts frontend/test/src/pages/teacher-assignment.test.ts frontend/test/src/components/teacher-class-list.test.ts frontend/test/src/components/teacher-today.test.ts frontend/test/src/components/teacher-assigned-quizzes.test.ts
git commit -m "feat: add teacher multi-class workspace UI"
```

---

### Task 5: Extend offline bootstrap and local storage to all classes

**Files:**
- Modify `supabase/functions/_shared/offline_snapshot.ts` and offline-bootstrap tests/handler.
- Modify `frontend/src/lib/offline/classroom/types.ts`, `bootstrap.ts`, `repository.ts`, `queries.ts`, `reports.ts`, `mutations.ts`, `index.ts`, and `frontend/src/lib/api/hooks.ts`.
- Add/update offline classroom tests, including `frontend/test/src/lib/offline/classroom/multi-class-isolation.test.ts`.

**Interfaces:**

```ts
export type OfflineTeacherSnapshot = {
  revision: number;
  classrooms: Record<string, unknown>[];
  students: Record<string, unknown>[];
  assignments: Record<string, unknown>[];
  attempts: Record<string, unknown>[];
  gameResults: Record<string, unknown>[];
  posts: Record<string, unknown>[];
  freePlaySessions: Record<string, unknown>[];
  freePlayProgress: Record<string, unknown>[];
};

export async function readOfflineTeacherClasses(repository: OfflineRepository): Promise<TeacherClassSummary[]>;
export async function readOfflineRoster(repository: OfflineRepository, classId: string): Promise<unknown>;
export async function readOfflineAssignments(repository: OfflineRepository, classId: string, studentId?: string): Promise<unknown[]>;
```

- [ ] **Step 1: Write red multi-class isolation tests.** Persist two classes, one student/assignment per class, and assert roster/assignment/report/post readers return only the selected class. Add a legacy `{ classroom }` bootstrap fixture and assert it normalizes to one cached class without dropping students.

- [ ] **Step 2: Return all classes from the server snapshot.** Select all teacher classes ordered by `created_at`, including `archived_at`. Query child rows with `.in("class_id", classIds)` and preserve each row’s class ID. Deduplicate teacher/student profile IDs before free-play queries.

- [ ] **Step 3: Normalize legacy packs.** Let `isOfflineBootstrapResponse` accept the new `classrooms` collection and legacy `classroom`; in `bootstrap.ts`, normalize legacy input to `classrooms: [classroom]` before `persistBootstrap`. New writes use only the `classrooms` collection.

- [ ] **Step 4: Remove first-row fallbacks.** Change offline roster, assignments, reports, posts, and teacher dashboard readers to accept a class ID and filter every collection by it. Local add/remove/assignment/post mutations include the selected class ID in payloads and outbox validation.

- [ ] **Step 5: Update hooks and verify offline switching.** `useClasses` reads all cached summaries; class-scoped hooks pass the selected class ID. Student offline paths continue deriving their one cached membership.

- [ ] **Step 6: Run focused offline tests sequentially.**

```powershell
deno test --allow-read --allow-env --config frontend/deno.json --lock=frontend/deno.lock --frozen frontend/test/src/lib/offline/classroom/multi-class-isolation.test.ts frontend/test/src/lib/offline/classroom/bootstrap.test.ts frontend/test/src/lib/offline/classroom/bootstrap-contract.test.ts frontend/test/src/lib/offline/classroom/queries.test.ts frontend/test/src/lib/offline/classroom/reports.test.ts frontend/test/src/lib/offline/classroom/mutations.test.ts frontend/test/src/lib/offline/classroom/offline-student-switch.test.ts
deno test --allow-env --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen test/supabase/functions/offline-sync
```

Expected: PASS with class isolation and legacy-pack preservation verified.

- [ ] **Step 7: Commit.**

```powershell
git add supabase/functions/_shared/offline_snapshot.ts supabase/functions/offline-bootstrap frontend/src/lib/offline/classroom/types.ts frontend/src/lib/offline/classroom/bootstrap.ts frontend/src/lib/offline/classroom/repository.ts frontend/src/lib/offline/classroom/queries.ts frontend/src/lib/offline/classroom/reports.ts frontend/src/lib/offline/classroom/mutations.ts frontend/src/lib/offline/classroom/index.ts frontend/src/lib/api/hooks.ts frontend/test/src/lib/offline/classroom/multi-class-isolation.test.ts frontend/test/src/lib/offline/classroom/bootstrap.test.ts frontend/test/src/lib/offline/classroom/bootstrap-contract.test.ts frontend/test/src/lib/offline/classroom/queries.test.ts frontend/test/src/lib/offline/classroom/reports.test.ts frontend/test/src/lib/offline/classroom/mutations.test.ts frontend/test/src/lib/offline/classroom/offline-student-switch.test.ts test/supabase/functions/offline-sync
git commit -m "feat: isolate offline teacher data by class"
```

---

### Task 6: Make the favicon the PWA and Tauri app icon

**Files:**
- Modify `frontend/public/manifest.webmanifest` and `frontend/test/src/pwa/pwa-config.test.ts`.
- Regenerate the checked-in icon files under `src-tauri/icons/`.

- [ ] **Step 1: Write the red icon contract.** Assert `frontend/index.html` references `/favicon.svg`, every manifest icon source is `/favicon.svg` or an explicitly generated favicon-derived asset, and the Tauri config references existing generated icon files.

- [ ] **Step 2: Align PWA metadata.** Point manifest icons to the canonical favicon artwork without changing app name, start URL, scope, colors, or display mode.

- [ ] **Step 3: Regenerate Tauri assets.** Run only this icon command, with no dev server:

```powershell
npm exec -- tauri icon frontend/public/favicon.svg
```

Inspect `src-tauri/icons/icon.png`, `128x128.png`, and `32x32.png` with the local image viewer and confirm the compass artwork matches the favicon.

- [ ] **Step 4: Run the focused PWA test and commit.**

```powershell
deno test --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen frontend/test/src/pwa/pwa-config.test.ts
git add frontend/public/manifest.webmanifest frontend/test/src/pwa/pwa-config.test.ts src-tauri/icons
git commit -m "feat: use favicon as app icon"
```

Expected: PASS and only icon/manifest files are staged.

---

### Task 7: Run the complete sequential CI-equivalent verification

**Files:**
- No planned source changes. If a check fails, return to its owning task, add a failing regression test first, fix the root cause, and rerun that task’s focused checks.

- [ ] **Step 1: Verify scope.** Run `git status --short` and confirm unrelated existing files remain unstaged.

- [ ] **Step 2: Run frontend typecheck.**

```powershell
npm run typecheck --prefix frontend
```

Expected: exit 0.

- [ ] **Step 3: Run the full frontend test lane.**

```powershell
npm test --prefix frontend
```

Expected: exit 0, no skipped/focused tests, and completion under 110 seconds. Run alone.

- [ ] **Step 4: Run the full Supabase test lane.**

```powershell
deno test --allow-env --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen test/supabase
```

Expected: exit 0, no skipped tests, and completion under 110 seconds. Run alone.

- [ ] **Step 5: Build the frontend.**

```powershell
npm run build --prefix frontend
```

Expected: exit 0 with favicon/manifest assets in the production output.

- [ ] **Step 6: Run Rust/Tauri checks sequentially.**

```powershell
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
```

Run `npm run tauri:build -- --debug` only after the previous lanes pass and memory remains stable. Report it as pending if the machine becomes memory constrained; never weaken CI requirements.

- [ ] **Step 7: Review fresh evidence.** Run `git status --short; git log --oneline --decorate -12`, verify every required lane from fresh output, and confirm no server-side data was modified by development or tests.
