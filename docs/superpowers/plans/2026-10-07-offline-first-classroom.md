# Offline-First Classroom Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make MathVenture's teacher classroom and student quiz workflows usable offline after one online classroom-pack download, then synchronize durable local work to Supabase.

**Architecture:** Use a repository-backed IndexedDB replica, a durable typed outbox, and an online sync coordinator in the frontend. Add offline-bootstrap and offline-sync Edge Functions with idempotent operation handling; Supabase remains authoritative while the UI reads and writes through the local repository.

**Tech Stack:** React 19, TypeScript, Vite, TanStack Query, native IndexedDB, Web Crypto, Supabase Edge Functions, PostgreSQL, Deno tests, Vite PWA.

## Global Constraints

- Use native IndexedDB behind interfaces; do not add SQLite/WASM in the PWA.
- Never store a raw password; offline unlock uses a salted Web Crypto verifier.
- First login, first classroom-pack provisioning, password reset/change, account creation, and server identity provisioning remain online-only.
- Preserve existing frontend and Supabase coverage and CI commands.
- Write production behavior test-first: each implementation task starts with a failing test and records the red run before the green implementation.
- Every sync operation has a stable client-generated UUID and is idempotent on the server.
- Pending local work is never deleted until Supabase acknowledges it.
- Keep unrelated dirty files untouched: LICENSE.md, .tmp-shape-matching-build/, dev-dist/, docs/DepEd/, existing untracked plans, and frontend/dev-dist/.
- Make at least 30 non-empty coherent implementation commits; do not create empty or unrelated commits merely to reach the count.
- Run the affected focused tests after every task and the complete CI-equivalent lanes before completion:
  - npm run typecheck --prefix frontend
  - timeout 110s npm test --prefix frontend
  - npm run build --prefix frontend
  - timeout 110s deno test --allow-env --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen test/supabase

## File Map

Create:

- frontend/src/lib/offline/classroom/types.ts — local entities, outbox operations, status, and snapshot contracts.
- frontend/src/lib/offline/classroom/store.ts — IndexedDB adapter and storage interfaces.
- frontend/src/lib/offline/classroom/memoryStore.ts — deterministic test store.
- frontend/src/lib/offline/classroom/crypto.ts — password verifier and device identity.
- frontend/src/lib/offline/classroom/repository.ts — local replica reads, optimistic writes, and outbox transactions.
- frontend/src/lib/offline/classroom/snapshot.ts — bootstrap merge and pending-operation preservation.
- frontend/src/lib/offline/classroom/sync.ts — dependency-ordered outbox synchronization.
- frontend/src/lib/offline/classroom/bootstrap.ts — classroom-pack download/refresh orchestration.
- frontend/src/lib/offline/classroom/status.ts — pure sync-status transitions.
- frontend/src/lib/offline/classroom/mutations.ts — testable optimistic mutation helpers.
- frontend/src/lib/offline/classroom/quiz.ts — local assignment-quiz state transitions.
- frontend/src/lib/offline/classroom/reports.ts — local dashboard/report derivations.
- frontend/src/lib/offline/classroom/index.ts — public offline classroom API.
- frontend/src/lib/offline/classroom/useOfflineClassroom.ts — React status/context hook.
- frontend/src/components/offline/OfflineStatusIndicator.tsx — persistent status.
- frontend/src/components/offline/OfflinePackPanel.tsx — bootstrap/sync controls.
- frontend/src/components/offline/OfflineConflictPanel.tsx — failed-operation recovery.
- supabase/migrations/0014_offline_sync.sql — idempotency schema.
- supabase/functions/offline-bootstrap/{index.ts,handler.ts} — server snapshot endpoint.
- supabase/functions/offline-sync/{index.ts,handler.ts} — server operation endpoint.
- supabase/functions/_shared/offline_snapshot.ts — snapshot queries.
- supabase/functions/_shared/offline_operations.ts — operation validation/application.

Modify:

- frontend/src/lib/api/client.ts and hooks.ts — gateway and query/mutation integration.
- frontend/src/lib/auth/auth.ts, useAuth.tsx, and pages/auth.tsx — enrollment and offline unlock.
- frontend/src/pages/QuizPage.tsx — local quiz persistence.
- frontend/src/pages/teacher.tsx and teacher components — offline assignment/roster UX.
- frontend/src/components/layout.tsx and App.tsx — app-wide lifecycle/status wiring.
- frontend/src/pwa/sw.ts — preserve media/app-data isolation.
- docs/offline-free-play.md and README.md — operational documentation.

## Commit sequence

Each numbered task below ends with one coherent commit. Tasks 1–32 provide 32 implementation commits before final regression/verification commits, satisfying the requested minimum without empty commits.

---

### Task 1: Define offline domain contracts

**Files:** Create frontend/src/lib/offline/classroom/types.ts and frontend/test/src/lib/offline/classroom/types.test.ts.

**Produces:** OfflineSyncStatus, OfflineOperationType, OfflineOutboxOperation, OfflineBootstrapResponse, and type guards.

- [ ] Write a failing test:

~~~ts
Deno.test('accepts a queued assignment operation', () => {
  const operation = {
    operationId: 'op-1', deviceId: 'device-1', actorId: 'teacher-1',
    type: 'assignment.create', entityId: 'assignment-1', payload: {},
    dependencies: [], createdAt: '2026-10-07T00:00:00.000Z',
    status: 'pending', attemptCount: 0, lastError: null,
  };
  assert(isOfflineOutboxOperation(operation));
  assert(isOfflineSyncStatus('offline'));
});
~~~

- [ ] Run: npm test --prefix frontend -- test/src/lib/offline/classroom/types.test.ts. Expect failure because the module is missing.
- [ ] Implement the literal union types and guards. A valid operation must have string IDs, an object payload, an array of dependencies, and pending/syncing/failed status.
- [ ] Run the focused test again. Expect PASS.
- [ ] Commit:

~~~bash
git add frontend/src/lib/offline/classroom/types.ts frontend/test/src/lib/offline/classroom/types.test.ts
git commit -m "feat: define offline classroom contracts"
~~~

### Task 2: Add storage interfaces and deterministic memory store

**Files:** Create frontend/src/lib/offline/classroom/store.ts, memoryStore.ts, and store.test.ts.

**Produces:** OfflineStore with get, put, delete, getAll, and transaction.

- [ ] Write a failing test that writes the same key to meta and profiles and asserts the records remain isolated.
- [ ] Run npm test --prefix frontend -- test/src/lib/offline/classroom/store.test.ts and record the missing-module failure.
- [ ] Define OfflineRecord as key/value and implement createMemoryStore with one Map per store; clone values on read/write with structuredClone.
- [ ] Run the focused test and expect PASS.
- [ ] Commit with git commit -m "feat: add offline store interfaces".

### Task 3: Implement the IndexedDB adapter

**Files:** Modify frontend/src/lib/offline/classroom/store.ts; create indexeddb-contract.test.ts.

**Produces:** createIndexedDbStore, OFFLINE_DB_NAME = mathventure-classroom, and version 1 object stores for meta, profiles, classrooms, classStudents, assignments, attempts, attemptGameResults, posts, outbox, and conflicts.

- [ ] Write a failing contract test asserting the database name and exported adapter.
- [ ] Run the focused test and record the missing export failure.
- [ ] Implement onupgradeneeded store creation, per-operation transactions, database close handlers, and OfflineStorageError when indexedDB is unavailable. Do not fall back to memory in production.
- [ ] Run the focused test and expect PASS.
- [ ] Commit with git commit -m "feat: persist classroom data in IndexedDB".

### Task 4: Add device identity and Web Crypto password verification

**Files:** Create crypto.ts and crypto.test.ts.

**Produces:** createPasswordVerifier, verifyPasswordVerifier, getOrCreateDeviceId, and OfflineCredentialRecord.

- [ ] Write a failing test proving the original password verifies, another password fails, and JSON.stringify(record) does not contain the password.
- [ ] Run the focused test and record the missing-module failure.
- [ ] Use crypto.getRandomValues for a 16-byte salt and PBKDF2 SHA-256 with 120000 iterations; store only base64 salt, derived verifier, hash, and iteration count. Compare derived bytes in constant time.
- [ ] Run the focused test and expect PASS.
- [ ] Commit with git commit -m "feat: add device-scoped offline credential verifier".

### Task 5: Implement safe classroom snapshot merge

**Files:** Create snapshot.ts and snapshot.test.ts.

**Produces:** mergeOfflineSnapshot(snapshot, localCollections, pendingOperations).

- [ ] Write a failing test where a server assignment replaces acknowledged local data but a locally-created assignment referenced by a pending operation is preserved.
- [ ] Run the focused test and record the missing-function failure.
- [ ] Merge by entity ID, retain all pending/failed entity IDs, apply server tombstones only to acknowledged entities, and return revision/lastSyncedAt metadata.
- [ ] Run the focused test and expect PASS.
- [ ] Commit with git commit -m "feat: merge classroom snapshots safely".

### Task 6: Implement the local classroom repository

**Files:** Create repository.ts and repository.test.ts.

**Produces:** createOfflineRepository(store, clock, idFactory) with readCollection, readByKey, putSnapshot, applyMutation, getOutbox, readMeta, and getSyncSummary.

- [ ] Write a failing test asserting an assignment mutation is immediately readable and creates exactly one pending outbox operation.
- [ ] Run the focused test and record the missing-module failure.
- [ ] Implement entity-to-store mapping, local entity write plus outbox write in one transaction, injected clock/ID factories, and rejection before mutation for unsupported types.
- [ ] Run the focused test and expect PASS.
- [ ] Commit with git commit -m "feat: add optimistic offline classroom repository".

### Task 7: Enroll an authenticated device online

**Files:** Modify frontend/src/lib/auth/auth.ts and useAuth.tsx; create offline-enrollment.test.ts.

**Produces:** enrollOfflineDevice(profile, password, store) and readOfflineEnrollment(store).

- [ ] Write a failing test that enrolls a teacher and asserts a verifier/profile record exists but the password string does not.
- [ ] Run the focused test and record the missing-function failure.
- [ ] After successful online teacher sign-in, create the verifier, device ID, teacher profile, and session metadata in IndexedDB; then call bootstrap. Keep Supabase session behavior unchanged.
- [ ] Run the focused test and expect PASS.
- [ ] Commit with git commit -m "feat: enroll authenticated devices for offline use".

### Task 8: Add offline unlock to the auth provider

**Files:** Modify auth.ts and useAuth.tsx; create offline-unlock.test.ts.

**Produces:** offlineSignIn(password, store) and offlineSignOut().

- [ ] Write a failing test that returns the enrolled teacher for the correct password and rejects an incorrect password.
- [ ] Run the focused test and record the missing-function failure.
- [ ] Verify the stored verifier, return cached profile, set local auth state, and throw OfflineAuthError on failure. Never call Supabase while navigator.onLine is false.
- [ ] Run the focused test and expect PASS.
- [ ] Commit with git commit -m "feat: unlock cached teacher sessions offline".

### Task 9: Define the bootstrap response and client fetch

**Files:** Modify types.ts; create bootstrap.ts and bootstrap-contract.test.ts.

**Produces:** OfflineBootstrapResponse, isOfflineBootstrapResponse, and downloadClassroomPack().

- [ ] Write a failing test requiring revision, teacher, classroom, students, assignments, attempts, gameResults, and posts.
- [ ] Run the focused test and record the missing-contract failure.
- [ ] Validate the response and fetch it through the existing invokeFunction('offline-bootstrap') wrapper.
- [ ] Run the focused test and expect PASS.
- [ ] Commit with git commit -m "feat: define classroom bootstrap contract".

### Task 10: Add the Supabase idempotency schema

**Files:** Create supabase/migrations/0014_offline_sync.sql and test/supabase/functions/_shared/offline_schema.test.ts.

**Produces:** offline_sync_operations table with unique device_id/operation_id, payload/result JSONB, applied/rejected status, timestamps, RLS enabled, and no client policies.

- [ ] Write a failing SQL contract test looking for the table and unique constraint.
- [ ] Run the focused Deno test and record the missing-file failure.
- [ ] Add the migration with the exact columns and constraint.
- [ ] Run the focused test and expect PASS.
- [ ] Commit with git commit -m "feat: add offline sync idempotency schema".

### Task 11: Implement the server classroom bootstrap function

**Files:** Create supabase/functions/_shared/offline_snapshot.ts, offline-bootstrap/handler.ts, offline-bootstrap/index.ts, and handler.test.ts.

**Produces:** createOfflineBootstrapHandler(deps).

- [ ] Write a failing handler test with a fake authenticated teacher and fake empty snapshot, expecting status 200 and the revision.
- [ ] Run the focused Deno test and record the missing-handler failure.
- [ ] Require GET, authenticate with the existing shared helper, require teacher role, query teacher profile/classroom/roster/assignments/attempts/game results/posts through deps, and return CORS JSON.
- [ ] Run the focused test and expect PASS.
- [ ] Commit with git commit -m "feat: expose teacher classroom bootstrap".

### Task 12: Persist client bootstrap without losing pending work

**Files:** Modify bootstrap.ts and repository.ts; create bootstrap.test.ts.

**Produces:** bootstrapRepository(repository, fetchSnapshot).

- [ ] Write a failing test asserting revision and lastSyncedAt are stored and a pending local entity survives.
- [ ] Run the focused test and record the missing-function failure.
- [ ] Fetch, validate, merge, write all snapshot collections plus metadata in one transaction, and leave pending/failed outbox entries intact.
- [ ] Run the focused test and expect PASS.
- [ ] Commit with git commit -m "feat: persist offline classroom packs".

### Task 13: Validate and dispatch server sync batches

**Files:** Create offline_operations.ts, offline-sync/handler.ts, offline-sync/index.ts, and handler.test.ts.

**Produces:** createOfflineSyncHandler(deps), bounded batch validation, and accepted/duplicate/rejected/retryable result statuses.

- [ ] Write a failing duplicate-operation test where readStoredOperation returns an applied result and the response is duplicate with the stored result.
- [ ] Run the focused Deno test and record the missing-handler failure.
- [ ] Authenticate teacher, validate actor/device/operation fields, look up device-operation idempotency first, apply independent operations, and return per-item results without failing the whole batch.
- [ ] Run the focused test and expect PASS.
- [ ] Commit with git commit -m "feat: validate idempotent offline sync batches".

### Task 14: Add server assignment operations

**Files:** Modify offline_operations.ts, offline-sync/handler.ts, assignments-create/update/delete handlers; create assignment-operations.test.ts.

**Produces:** assignment.create/update/delete with client-supplied UUIDs.

- [ ] Write a failing test asserting assignment.create preserves entityId and rejects an invalid class target.
- [ ] Run the focused Deno test and record the missing-operation failure.
- [ ] Reuse existing assignment validation/access helpers, add optional validated id to inserts, and return conflict records for stale updates instead of silently overwriting.
- [ ] Run the focused test and expect PASS.
- [ ] Commit with git commit -m "feat: synchronize offline assignments".

### Task 15: Add server assignment-quiz operations

**Files:** Modify offline_operations.ts, offline-sync/handler.ts, assignment-quiz/handler.ts; create quiz-operations.test.ts.

**Produces:** assignmentQuiz.start/checkpoint/complete with client attempt IDs.

- [ ] Write a failing test where an out-of-order checkpoint is rejected and a repeated prior checkpoint is duplicate.
- [ ] Run the focused Deno test and record the missing-helper failure.
- [ ] Reuse assignment-quiz parsing/authorization, preserve one-attempt and ordered-checkpoint rules, and return complete AssignmentQuizState results.
- [ ] Run the focused test and expect PASS.
- [ ] Commit with git commit -m "feat: synchronize offline assignment quiz progress".

### Task 16: Add server standalone attempts and posts

**Files:** Modify offline_operations.ts, offline-sync/handler.ts, attempts-submit/handler.ts, posts-create/handler.ts; create activity-operations.test.ts.

**Produces:** attempt.submit and post.create.

- [ ] Write a failing test requiring positive maxScore and rejecting malformed detailed game results.
- [ ] Run the focused Deno test and record the missing-helper failure.
- [ ] Accept client IDs, reuse detailed-result validation, enforce class membership for posts, and keep attempt data append-only.
- [ ] Run the focused test and expect PASS.
- [ ] Commit with git commit -m "feat: synchronize offline attempts and posts".

### Task 17: Add server roster operations

**Files:** Modify offline_operations.ts, offline-sync/handler.ts, classes-add-students/handler.ts, classes-remove-student/handler.ts; create roster-operations.test.ts.

**Produces:** class.ensure, class.addStudents, and class.removeStudent.

- [ ] Write a failing test rejecting duplicate normalized student names in one batch.
- [ ] Run the focused Deno test and record the missing-helper failure.
- [ ] Reuse singleton-class and hidden-student provisioning rules; return temporary-student-to-server-student ID mappings; keep removal tombstones until acknowledgment.
- [ ] Run the focused test and expect PASS.
- [ ] Commit with git commit -m "feat: synchronize offline roster changes".

### Task 18: Implement the dependency-ordered client sync coordinator

**Files:** Create sync.ts and sync.test.ts.

**Produces:** syncOutbox(repository, sendBatch, onProgress).

- [ ] Write a failing test with assignment.create followed by assignment.update and assert send order, then zero pending operations after accepted responses.
- [ ] Run the focused test and record the missing-function failure.
- [ ] Topologically sort dependencies, send at most 50 operations, mark syncing, apply accepted/duplicate results, persist failed results, and block dependents until prerequisites are acknowledged.
- [ ] Run the focused test and expect PASS.
- [ ] Commit with git commit -m "feat: synchronize the offline outbox".

### Task 19: Add the frontend offline-aware API gateway

**Files:** Modify api/client.ts; create offline/classroom/index.ts and offline-gateway.test.ts.

**Produces:** createOfflineAwareApi, getOfflineClassroomApi, and syncOfflineClassroom.

- [ ] Write a failing test proving an offline assignment read uses localApi and never onlineApi.
- [ ] Run the focused test and record the missing-gateway failure.
- [ ] Choose local reads while offline, online reads while online, and repository-first mutations in both modes; keep the existing api object as the online implementation.
- [ ] Run the focused test and expect PASS.
- [ ] Commit with git commit -m "feat: route classroom data through offline gateway".

### Task 20: Integrate cached classes, roster, and assignments

**Files:** Modify api/hooks.ts; create offline-queries.test.ts.

**Produces:** Existing class/roster/assignment hooks reading one local page offline with hasMore false.

- [ ] Write a failing test for query enablement with a local enrolled profile but no Supabase user.
- [ ] Run the focused test and record the missing-helper failure.
- [ ] Add the pure enablement helper, local page conversion, and cached shapes for TeacherClassroomSummary, TeacherClassStudent, AssignmentForStudent, and AssignmentForTeacher.
- [ ] Run the focused test and expect PASS.
- [ ] Commit with git commit -m "feat: read classroom and assignments offline".

### Task 21: Derive dashboards, posts, and reports locally

**Files:** Create offline/reports.ts and offline-reports.test.ts; modify api/hooks.ts and teacher/reports/index.ts.

**Produces:** Local derivations with the existing StudentDashboard, TeacherDashboard, and report payload types.

- [ ] Write a failing test with one completed attempt and assert completedLessons = 1 and the recent attempt is present.
- [ ] Run the focused test and record the missing-function failure.
- [ ] Derive dashboard/report aggregates from cached attempts/results, filter report windows using existing ISO date utilities, and read/write class posts through the repository.
- [ ] Run the focused test and expect PASS.
- [ ] Commit with git commit -m "feat: derive dashboards and reports offline".

### Task 22: Integrate offline teacher mutations

**Files:** Modify api/hooks.ts, TeacherAssignQuizDialog.tsx, TeacherAddStudentsDialog.tsx; create offline/mutations.ts and offline-mutations.test.ts.

**Produces:** Existing create/update/delete assignment and roster/post mutation hooks returning optimistic local results with pending sync state.

- [ ] Write a failing test that creates an offline assignment and immediately receives a local ID and syncState pending.
- [ ] Run the focused test and record the missing-helper failure.
- [ ] Route assignment/roster/post writes through the repository, invalidate relevant query keys immediately, and retain online behavior through immediate gateway sync.
- [ ] Run the focused test and expect PASS.
- [ ] Commit with git commit -m "feat: assign quizzes and edit roster offline".

### Task 23: Persist assignment quiz start/checkpoints/completion offline

**Files:** Modify api/hooks.ts and pages/QuizPage.tsx; create offline/quiz.ts and QuizPage.offline.test.ts.

**Produces:** Existing assignment quiz hooks that read/write local state and queue start/checkpoint/complete/attempt.submit.

- [ ] Write a failing test that saves a colors checkpoint offline and asserts currentGameOrder 1 and status in_progress.
- [ ] Run the focused test and record the missing-function failure.
- [ ] Create client attempt IDs on local start, persist every checkpoint before returning, queue completion and standalone submissions, and do not block gameplay merely because a network request failed.
- [ ] Run the focused test and expect PASS.
- [ ] Commit with git commit -m "feat: save quiz progress offline".

### Task 24: Add offline lifecycle context

**Files:** Create useOfflineClassroom.ts and status.ts; modify classroom/index.ts and App.tsx; create use-offline-classroom.test.ts.

**Produces:** OfflineClassroomProvider, useOfflineClassroom, syncNow, bootstrapNow, status transitions, counts, and last-sync metadata.

- [ ] Write a failing pure reducer test for offline -> syncing -> online.
- [ ] Run the focused test and record the missing-reducer failure.
- [ ] Listen to online/offline/visibility events, trigger bootstrap after enrollment, sync at startup and reconnect, and expose pending/failed counts.
- [ ] Run the focused test and expect PASS.
- [ ] Commit with git commit -m "feat: coordinate offline classroom lifecycle".

### Task 25: Add the persistent connection indicator

**Files:** Create OfflineStatusIndicator.tsx; modify layout.tsx; create offline-status-indicator.test.tsx.

**Produces:** Accessible Online, Offline, Syncing, Needs sign-in, and Sync errors labels.

- [ ] Write a failing render test asserting Offline and the pending count are visible.
- [ ] Run the focused test and record the missing-component failure.
- [ ] Render a compact aria-live status control in the shell and never claim pending work reached Supabase.
- [ ] Run the focused test and expect PASS.
- [ ] Commit with git commit -m "feat: show offline classroom status".

### Task 26: Add classroom-pack and manual sync controls

**Files:** Create OfflinePackPanel.tsx; modify layout.tsx; create offline-pack-panel.test.tsx.

**Produces:** Refresh classroom pack and Sync now controls with last-sync/pending/failed copy.

- [ ] Write a failing render test asserting 3 pending and Sync now.
- [ ] Run the focused test and record the missing-component failure.
- [ ] Add the panel to teacher settings/classroom controls, disable network-only bootstrap while offline with explanatory text, and preserve pending outbox operations during refresh.
- [ ] Run the focused test and expect PASS.
- [ ] Commit with git commit -m "feat: add classroom pack controls".

### Task 27: Add conflict and failed-operation recovery

**Files:** Create OfflineConflictPanel.tsx; modify repository.ts; create offline-conflict-panel.test.tsx.

**Produces:** listConflicts, resolveConflict, exportDiagnostics, Keep local, and Keep server.

- [ ] Write a failing render test asserting both resolution choices.
- [ ] Run the focused test and record the missing-component failure.
- [ ] Persist conflict records, resolve server/local choices without deleting unrelated outbox work, and export JSON diagnostics without tokens or password verifiers.
- [ ] Run the focused test and expect PASS.
- [ ] Commit with git commit -m "feat: recover offline sync conflicts".

### Task 28: Wire offline login into the login page

**Files:** Modify pages/auth.tsx and auth.ts; create auth.offline.test.tsx.

**Produces:** Online-first login with cached offline unlock on connectivity failure or known offline state.

- [ ] Write a failing render test asserting offline login copy is present.
- [ ] Run the focused test and record the missing-copy failure.
- [ ] Add offline unlock using the enrolled teacher record, distinguish no-cached-account from incorrect-password errors, and keep signup/forgot-password explicitly online-only. Successful online login enrolls and bootstraps before routing.
- [ ] Run the focused test and expect PASS.
- [ ] Commit with git commit -m "feat: allow cached teacher login offline".

### Task 29: Wire cached student switching

**Files:** Modify auth.ts, useAuth.tsx, pages/teacher.tsx, and TeacherStudentListTable.tsx; create offline-student-switch.test.ts.

**Produces:** viewOfflineStudentAccount(studentId) using cached roster profiles while preserving teacher-only controls.

- [ ] Write a failing test that selects cached student-1 and returns full_name Ana.
- [ ] Run the focused test and record the missing-function failure.
- [ ] Set the active local actor for student-scoped operations, keep teacher controls unavailable while viewing a student, and navigate using cached assignment/lesson IDs.
- [ ] Run the focused test and expect PASS.
- [ ] Commit with git commit -m "feat: switch cached student accounts offline".

### Task 30: Assert service-worker/media and classroom-data isolation

**Files:** Modify pwa/sw.ts or cacheProtocol.ts only if needed; create pwa/offline-data-isolation.test.ts.

**Produces:** Media-cache cleanup never deletes the mathventure-classroom IndexedDB database or classroom records.

- [ ] Write a failing source-contract test asserting the separate classroom database name and existing MEDIA_METADATA_DB usage.
- [ ] Run the focused test and record the missing-boundary failure.
- [ ] Keep classroom data out of media cache cleanup; delete only caches with the existing media prefix.
- [ ] Run the focused test and expect PASS.
- [ ] Commit with git commit -m "test: isolate classroom data from media cache".

### Task 31: Add a dependency-injected offline-to-online integration test

**Files:** Modify classroom/index.ts; create offline-online-flow.test.ts.

**Produces:** A test coordinator covering bootstrap, offline assignment, pending count, sync, and zero pending count.

- [ ] Write a failing test using createTestOfflineClassroom with memory storage, fake bootstrap, and fake sync.
- [ ] Run the focused test and record the missing-helper failure.
- [ ] Expose only test dependency injection; run production repository/sync logic unchanged.
- [ ] Run the focused test and expect PASS.
- [ ] Commit with git commit -m "test: cover offline classroom round trip".

### Task 32: Document authenticated classroom offline operation

**Files:** Create docs/offline-classroom.md; modify docs/offline-free-play.md and README.md; create documentation-contract.test.ts.

**Produces:** Accurate instructions for first online login, classroom-pack download, offline unlock, Sync now, storage/recovery, and online-only account actions.

- [ ] Write a failing documentation contract test requiring first online login, Sync now, and password reset language.
- [ ] Run the focused test and record the missing-document failure.
- [ ] Document authenticated classroom behavior separately from public Free Play media caching; explicitly state that first-ever login, signup, password reset/change, and first provisioning need a network.
- [ ] Run the focused test and expect PASS.
- [ ] Commit with git commit -m "docs: document offline classroom operation".

### Task 33: Run focused regression lanes

**Files:** Modify only files implicated by failing tests.

- [ ] Run:

~~~bash
npm test --prefix frontend -- test/src/lib/offline test/src/lib/auth test/src/lib/api test/src/pages/QuizPage.offline.test.ts test/src/components/offline
~~~

Expect exit code 0.

- [ ] Run:

~~~bash
deno test --allow-env --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen test/supabase/functions/offline-bootstrap test/supabase/functions/offline-sync test/supabase/functions/_shared/offline_schema.test.ts
~~~

Expect exit code 0.

- [ ] If a lane fails, add a regression test, fix the root cause, rerun the smallest affected suite, and commit only that fix with git commit -m "fix: resolve offline classroom regression".

### Task 34: Run complete CI-equivalent verification

**Files:** No production changes unless a verification command identifies a root cause.

- [ ] Run npm run typecheck --prefix frontend; expect exit code 0.
- [ ] Run timeout 110s npm test --prefix frontend; expect exit code 0 with no newly skipped/focused tests.
- [ ] Run npm run build --prefix frontend; expect exit code 0 and a generated PWA service worker.
- [ ] Run timeout 110s deno test --allow-env --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen test/supabase; expect exit code 0.
- [ ] Commit any root-cause verification fix as git commit -m "fix: satisfy offline classroom CI gates".
- [ ] Run git log --oneline --decorate -35 and git status --short. Expect at least 30 new non-empty implementation commits after the design/spec commit and only pre-existing unrelated dirty files unstaged.

## Self-Review

- Spec coverage: Tasks 1–6 cover IndexedDB, local replica, crypto, and outbox; Tasks 7–8 cover online enrollment and offline unlock; Tasks 9–17 cover bootstrap, schema, server operations, idempotency, and conflict-safe validation; Tasks 18–23 cover client sync, API integration, classroom reads, reports, mutations, and quizzes; Tasks 24–29 cover lifecycle, status, recovery UI, login, and student switching; Tasks 30–32 cover PWA isolation, integration behavior, and documentation; Tasks 33–34 cover focused and full CI verification.
- Placeholder scan: no production task contains unfinished requirements or deferred implementation markers. The only conditional changed-file instruction appears in the regression verification task, where the exact files depend on the first failing command.
- Type consistency: later tasks consume the repository, bootstrap, sync, and auth interfaces introduced earlier; existing hook signatures remain stable.
- Scope: this remains limited to offline classroom behavior and explicitly leaves account-management/recovery online-only.
