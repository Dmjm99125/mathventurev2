# Class-Scoped Offline Roster Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or inline execution with the same checkpoints) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make offline teacher roster sync persist new students and removals against the selected class instead of silently targeting the teacher's first class.

**Architecture:** Keep the existing local-first outbox and `offline-sync` protocol. Add an explicit target-class contract to the roster operation applier and its persistence adapter, validate teacher ownership using an exact class query, and leave the existing student uniqueness and ID-remapping behavior intact.

**Tech Stack:** Supabase Edge Functions/Deno, TypeScript, Deno tests, existing offline repository and outbox protocol.

## Global Constraints

- Preserve existing student uniqueness behavior and do not silently move or delete account-specific production records.
- Every roster mutation must include an explicit target class ID; no first/only-class fallback is allowed for multi-class teachers.
- Write tests first, run the focused failing test, implement the minimum behavior, then run the focused passing test.
- Preserve all existing tests and CI gates; do not skip, weaken, or focus existing suites in the final verification.
- Run checks sequentially and keep each test lane under the repository's 110-second limit.
- Stage and commit only files belonging to this task.

---

### Task 1: Add red tests for class-scoped roster operations

**Files:**
- Modify: `test/supabase/functions/offline-sync/roster-operations.test.ts`

**Interfaces:**
- The test fixture will implement `getTeacherClassroom(teacherId: string, classId: string)` and record the requested class ID.
- `class.addStudents` and `class.removeStudent` payloads will carry `classId`.

- [ ] **Step 1: Replace the fixture signature and add the target-class add test.** Keep the existing duplicate-name and mapping assertions, but make their fixture return the requested class. Add a test that sends `classId: "class-beige"`, returns `{ id: "class-beige" }` from the persistence fixture, and asserts provisioning receives `class-beige`.

```ts
Deno.test('class.addStudents provisions into the requested teacher-owned class', async () => {
  let provisionedClassId = '';
  const persistence: RosterOperationPersistence = {
    getTeacherClassroom: async (_teacherId, classId) => classId === 'class-beige'
      ? { id: 'class-beige', teacherId: 'teacher-1', name: 'Beige PM' }
      : null,
    hasStudentWithNormalizedName: async () => false,
    provisionStudentForClass: async ({ classId }) => {
      provisionedClassId = classId;
      return { studentId: 'student-1', email: 'student@example.test' };
    },
    removeMembership: async () => {},
  };

  const result = await createRosterOperationApplier(persistence)('teacher-1', {
    operationId: 'operation-beige',
    deviceId: 'device-1',
    actorId: 'teacher-1',
    type: 'class.addStudents',
    entityId: 'batch-beige',
    payload: { classId: 'class-beige', students: [{ localId: 'local-1', lastName: 'Santos', firstName: 'Ana' }] },
    dependencies: [],
    createdAt: '2026-10-07T00:00:00.000Z',
  });

  assertEquals(result.status, 'accepted');
  assertEquals(provisionedClassId, 'class-beige');
});
```

- [ ] **Step 2: Add missing and foreign class rejection tests.** Assert `class.addStudents` rejects `classId: "missing-class"` before `provisionStudentForClass` is called, and `class.removeStudent` rejects a foreign/missing class before `removeMembership` is called. Use the exact error `Classroom not found.` so the client receives an actionable conflict.

- [ ] **Step 3: Run the focused backend test to verify RED.**

Run:

```powershell
deno test --allow-env --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen test/supabase/functions/offline-sync/roster-operations.test.ts
```

Expected: FAIL because the current applier calls `getTeacherClassroom` without the requested class ID and provisions through the first-class behavior.

### Task 2: Implement exact class resolution in the roster applier and Supabase adapter

**Files:**
- Modify: `supabase/functions/_shared/offline_operations.ts`
- Modify: `test/supabase/functions/offline-sync/roster-operations.test.ts`

**Interfaces:**

```ts
export type RosterOperationPersistence = {
  getTeacherClassroom(teacherId: string, classId: string): Promise<{ id: string; teacherId: string; name: string } | null>;
  hasStudentWithNormalizedName(normalizedLastName: string, normalizedFirstName: string): Promise<boolean>;
  provisionStudentForClass(input: { classId: string; identity: NormalizedStudentIdentity }): Promise<{ studentId: string; email: string }>;
  removeMembership(input: { classId: string; studentId: string }): Promise<void>;
};
```

- [ ] **Step 1: Extract and validate the target class before any roster write.** In `createRosterOperationApplier`, derive `classId` from `operation.payload.classId` for `class.addStudents` and `class.removeStudent`. For `class.ensure`, use `payload.classId` or `operation.entityId`. If no class ID is present, return `{ status: "rejected", error: "classId is required." }`. Resolve the exact class with `getTeacherClassroom(teacherId, classId)` before duplicate checks, provisioning, or removal.

- [ ] **Step 2: Update the default Supabase persistence to query the exact owned class.** Replace the current teacher-only ordered/limited query with `.eq("id", classId).eq("teacher_id", ownerId).maybeSingle()`. Do not add a first-class fallback.

- [ ] **Step 3: Run the focused backend tests to verify GREEN.**

Run:

```powershell
deno test --allow-env --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen test/supabase/functions/offline-sync/roster-operations.test.ts
```

Expected: PASS for the class-target, duplicate-name, mapping, missing-class, and foreign-class cases.

- [ ] **Step 4: Run all offline-sync backend tests.**

Run:

```powershell
deno test --allow-env --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen test/supabase/functions/offline-sync
```

Expected: all offline-sync tests pass with no skipped tests.

- [ ] **Step 5: Commit the implementation and tests.**

```powershell
git add supabase/functions/_shared/offline_operations.ts test/supabase/functions/offline-sync/roster-operations.test.ts
git commit -m "fix: scope offline roster sync to selected class"
```

### Task 3: Run the repository verification gates and review the account repair boundary

**Files:**
- No planned source changes. If a check fails, return to Task 1 or Task 2, add a failing regression test first, and fix the root cause.

- [ ] **Step 1: Inspect the final diff and status.**

Run:

```powershell
git diff --check
git status --short --branch
git log --oneline --decorate -5
```

Expected: only the design, plan, implementation, and targeted test commits are present; no unrelated files are modified.

- [ ] **Step 2: Run frontend Vitest, typecheck, and build sequentially.**

Run:

```powershell
npm run test:frontend --prefix frontend
npm run typecheck --prefix frontend
npm run build --prefix frontend
```

Expected: each command exits 0.

- [ ] **Step 3: Run the complete Deno backend lane.**

Run:

```powershell
deno test --allow-env --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen test/supabase
```

Expected: record any pre-existing failures precisely; do not weaken the lane to obtain a green result.

- [ ] **Step 4: Report deployment and account-repair status accurately.** The code fix does not automatically move the already-misrouted `test1, test` record. After the corrected backend is deployed, the account owner must reconcile that existing record explicitly; the final handoff will distinguish repository verification from remote deployment and production-data repair.
