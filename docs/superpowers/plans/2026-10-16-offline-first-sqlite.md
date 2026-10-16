# Offline-First SQLite Application Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the classroom IndexedDB application store with a SQLite-WASM/OPFS local-first data layer that covers the complete authenticated PWA, synchronizes safely to Supabase, persists a sliding seven-day offline lease across reloads, and leaves a clean adapter boundary for Tauri native SQLite.

**Architecture:** React, React Query, and game code call a repository backed by a typed SQLite adapter. The PWA adapter owns a SQLite-WASM connection in a dedicated worker and persists it in OPFS; the future Tauri adapter will implement the same interface against native SQLite. Every application mutation commits local state and an outbox operation in one transaction, then synchronizes eagerly when online or retries later when offline.

**Tech Stack:** React 19, TypeScript 5.9, Vite 6, Deno tests, `@sqlite.org/sqlite-wasm@3.53.4-build2`, OPFS, Web Crypto, TanStack Query, Supabase Edge Functions, PostgreSQL, Vite PWA.

## Global Constraints

- Use SQLite WASM in an OPFS-backed dedicated worker for PWA application data; do not fall back to IndexedDB or volatile memory for application writes.
- Keep the existing service-worker Free Play media split: Cache Storage stores media bytes and `mathventure-offline-media` IndexedDB stores only media status/active-cache metadata.
- Route online and offline application mutations through the same local-first repository path; online mode only adds eager synchronization.
- Never store a raw password. Store only a salted Web Crypto verifier and device-scoped lease/session metadata.
- Renew the seven-day offline lease only after successful online authentication or a completed authenticated synchronization cycle.
- Preserve pending, failed, and conflicted local work across bootstrap, reload, worker restarts, service-worker updates, and transient cloud failures.
- Use client-generated operation/entity IDs, idempotent server application, dependency ordering, per-operation results, and explicit conflicts.
- Support provisional local student IDs and transactional remapping to server IDs after offline roster provisioning.
- Keep account creation, first enrollment, password reset/change, and re-authentication after lease expiry online-only.
- Preserve existing frontend and Supabase tests; never use focused tests, skipped tests, weakened assertions, or disabled CI lanes.
- Run targeted tests after each task and the complete CI-equivalent gates before completion:
  - `npm run typecheck --prefix frontend`
  - `timeout 110s npm test --prefix frontend`
  - `npm run build --prefix frontend`
  - `timeout 110s deno test --allow-env --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen test/supabase`
- Keep unrelated dirty files untouched: `LICENSE.md`, `.tmp-shape-matching-build/`, `deno.lock`, `dev-dist/`, `docs/DepEd/`, existing unrelated plans, and `frontend/dev-dist/`.
- Make each task a coherent non-empty commit; retain the existing offline feature's granular delivery discipline and do not create empty commits.

## File Map

Create:

- `frontend/src/lib/offline/sqlite/migrations.ts` — canonical application schema and versioned SQL migrations.
- `frontend/src/lib/offline/sqlite/adapter.ts` — typed database/transaction contract.
- `frontend/src/lib/offline/sqlite/memoryAdapter.ts` — deterministic SQL-like adapter for unit tests.
- `frontend/src/lib/offline/sqlite/workerProtocol.ts` — typed worker request/response messages.
- `frontend/src/lib/offline/sqlite/sqlite.worker.ts` — SQLite WASM worker and OPFS database lifecycle.
- `frontend/src/lib/offline/sqlite/pwaAdapter.ts` — main-thread worker client.
- `frontend/src/lib/offline/sqlite/runtime.ts` — browser runtime selection and storage-health errors.
- `frontend/src/lib/offline/sqlite/legacyImport.ts` — one-time IndexedDB classroom import.
- `frontend/src/lib/offline/sqlite/legacyImport.test.ts` — legacy import behavior tests.
- `frontend/src/lib/offline/classroom/idMapping.ts` — provisional-to-server ID remapping.
- `frontend/src/lib/offline/classroom/lease.ts` — sliding seven-day lease transitions.
- `frontend/src/lib/offline/classroom/freePlay.ts` — local Free Play progress and event writes.
- `frontend/test/src/lib/offline/sqlite/` — SQLite adapter, schema, worker, migration, and runtime tests.

Modify:

- `frontend/package.json`, `frontend/package-lock.json` — pin SQLite WASM dependency.
- `frontend/src/lib/offline/classroom/types.ts`, `store.ts`, `repository.ts`, `snapshot.ts`, `sync.ts`, `bootstrap.ts`, `index.ts` — SQLite-backed contracts, merge, outbox, sync, and bootstrap.
- `frontend/src/lib/offline/classroom/memoryStore.ts` and existing classroom tests — adapt test storage to the new SQL repository boundary.
- `frontend/src/lib/auth/auth.ts`, `useAuth.tsx`, `profile.ts`, `session-state.ts` — lease-backed session restoration and online enrollment.
- `frontend/src/lib/api/client.ts`, `hooks.ts` — unified local-first reads/mutations.
- `frontend/src/lib/offline/classroom/useOfflineClassroom.ts`, `App.tsx`, `components/layout.tsx` — database lifecycle and app events.
- `frontend/src/pages/QuizPage.tsx`, `frontend/src/pages/free-play.tsx`, `frontend/src/lib/games/free-play.ts` — local progress/event persistence.
- `frontend/src/pwa/sw.ts`, `frontend/vite.config.ts` — preserve media IndexedDB and precache SQLite WASM worker assets.
- `frontend/src/components/offline/*.tsx` — lease, storage health, sync, and conflict UX.
- `supabase/migrations/0014_offline_sync.sql` and new migrations — revision/idempotency/conflict/mapping schema.
- `supabase/functions/_shared/offline_snapshot.ts`, `offline_operations.ts`, `offline-bootstrap/*`, `offline-sync/*` — full snapshot and protocol behavior.
- `docs/offline-classroom.md`, `docs/offline-free-play.md`, `README.md` — operational setup and recovery instructions.

---

### Task 1: Pin the SQLite WASM runtime

**Files:**
- Modify: `frontend/package.json` and `frontend/package-lock.json`
- Create: `frontend/test/src/lib/offline/sqlite/dependency.test.ts`

**Interfaces:**
- Produces the importable package `@sqlite.org/sqlite-wasm` at exact version `3.53.4-build2`.

- [ ] **Step 1: Add the dependency as the configuration exception to test-first implementation.**

```powershell
npm install --prefix frontend --save-exact '@sqlite.org/sqlite-wasm@3.53.4-build2'
```

- [ ] **Step 2: Write the dependency smoke test.**

```ts
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

Deno.test('SQLite WASM package is importable by the frontend toolchain', () => {
  if (typeof sqlite3InitModule !== 'function') throw new Error('sqlite3InitModule export is missing');
});
```

- [ ] **Step 3: Run the focused test.**

Run: `npm test --prefix frontend -- test/src/lib/offline/sqlite/dependency.test.ts`
Expected: PASS after dependency installation.

- [ ] **Step 4: Verify the lockfile and typecheck.**

Run: `npm run typecheck --prefix frontend`
Expected: exit 0.

- [ ] **Step 5: Commit.**

```powershell
git add frontend/package.json frontend/package-lock.json frontend/test/src/lib/offline/sqlite/dependency.test.ts
git commit -m "build: add sqlite wasm runtime"
```

### Task 2: Define the canonical SQL schema

**Files:**
- Create: `frontend/src/lib/offline/sqlite/migrations.ts`
- Create: `frontend/test/src/lib/offline/sqlite/migrations.test.ts`

**Interfaces:**
- Produces `SQLITE_DATABASE_NAME = 'mathventure-app'`, `SQLITE_SCHEMA_VERSION`, and `SQLITE_MIGRATIONS: readonly SqlMigration[]`.
- `SqlMigration` is `{ version: number; name: string; statements: readonly string[] }`.

- [ ] **Step 1: Write the failing schema test.**

```ts
import { assert, assertEquals } from 'jsr:@std/assert';
import { SQLITE_MIGRATIONS, SQLITE_SCHEMA_VERSION } from '@/lib/offline/sqlite/migrations.ts';

Deno.test('schema includes durable app, session, classroom, Free Play, outbox, and conflict tables', () => {
  const sql = SQLITE_MIGRATIONS.flatMap((migration) => migration.statements).join('\n');
  for (const table of ['app_meta', 'device_enrollment', 'local_sessions', 'profiles', 'classrooms', 'class_students', 'assignments', 'attempts', 'attempt_game_results', 'posts', 'free_play_sessions', 'free_play_progress', 'sync_outbox', 'sync_conflicts', 'entity_id_mappings']) {
    assert(sql.includes(`create table ${table}`) || sql.includes(`create table if not exists ${table}`), table);
  }
  assertEquals(SQLITE_SCHEMA_VERSION, SQLITE_MIGRATIONS.at(-1)?.version);
});
```

- [ ] **Step 2: Run the test to verify it fails because the migration module is missing.**

Run: `npm test --prefix frontend -- test/src/lib/offline/sqlite/migrations.test.ts`
Expected: FAIL with a missing-module error.

- [ ] **Step 3: Implement migrations.**

Define tables with text UUID keys, ISO-8601 timestamps, JSON payload text, integer revision columns, foreign keys where safe, and indexes for `sync_outbox(status, created_at)`, `sync_conflicts(status, created_at)`, `attempts(student_id, assignment_id)`, and `free_play_progress(profile_id, game_id)`. Include `schema_migrations(version primary key, name, applied_at)` and make every statement idempotent.

- [ ] **Step 4: Run the focused test and typecheck.**

Run: `npm test --prefix frontend -- test/src/lib/offline/sqlite/migrations.test.ts`
Expected: PASS.

Run: `npm run typecheck --prefix frontend`
Expected: exit 0.

- [ ] **Step 5: Commit.**

```powershell
git add frontend/src/lib/offline/sqlite/migrations.ts frontend/test/src/lib/offline/sqlite/migrations.test.ts
git commit -m "feat: define canonical sqlite schema"
```

### Task 3: Define the typed database adapter

**Files:**
- Create: `frontend/src/lib/offline/sqlite/adapter.ts`
- Create: `frontend/src/lib/offline/sqlite/memoryAdapter.ts`
- Create: `frontend/test/src/lib/offline/sqlite/adapter.test.ts`

**Interfaces:**
- `SqliteValue = string | number | null | Uint8Array`.
- `SqliteDatabase.query<T>(sql: string, params?: readonly SqliteValue[]): Promise<T[]>`.
- `SqliteDatabase.execute(sql: string, params?: readonly SqliteValue[]): Promise<void>`.
- `SqliteDatabase.transaction<T>(work: (tx: SqliteTransaction) => Promise<T>): Promise<T>`.
- `SqliteDatabase.health(): Promise<{ schemaVersion: number; durable: boolean }>` and `close(): Promise<void>`.

- [ ] **Step 1: Write the failing atomic-transaction test.**

```ts
import { assertEquals, assertRejects } from 'jsr:@std/assert';
import { createMemorySqlite } from '@/lib/offline/sqlite/memoryAdapter.ts';

Deno.test('memory SQLite adapter rolls back all statements when a transaction fails', async () => {
  const db = await createMemorySqlite();
  await assertRejects(() => db.transaction(async (tx) => {
    await tx.execute('insert into app_meta(key, value) values (?, ?)', ['one', '1']);
    throw new Error('abort');
  }));
  assertEquals(await db.query('select * from app_meta'), []);
});
```

- [ ] **Step 2: Run the focused test and record the missing-module failure.**

Run: `npm test --prefix frontend -- test/src/lib/offline/sqlite/adapter.test.ts`
Expected: FAIL because the adapter modules are missing.

- [ ] **Step 3: Implement the adapter interfaces and deterministic memory adapter.**

Use a copied table model for tests, implement only the SQL statements used by the repository, and expose rollback/commit behavior through cloned state. Do not make the production adapter depend on this test adapter.

- [ ] **Step 4: Run the focused test.**

Run: `npm test --prefix frontend -- test/src/lib/offline/sqlite/adapter.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit.**

```powershell
git add frontend/src/lib/offline/sqlite/adapter.ts frontend/src/lib/offline/sqlite/memoryAdapter.ts frontend/test/src/lib/offline/sqlite/adapter.test.ts
git commit -m "feat: add sqlite adapter contract"
```

### Task 4: Add the worker protocol

**Files:**
- Create: `frontend/src/lib/offline/sqlite/workerProtocol.ts`
- Create: `frontend/test/src/lib/offline/sqlite/workerProtocol.test.ts`

**Interfaces:**
- Requests: `{ requestId; type: 'query'|'execute'|'transaction'|'health'|'close'; sql?: string; params?: SqliteValue[] }`.
- Responses: `{ requestId; type: 'result'|'error'; rows?: unknown[]; error?: { message: string; code: string } }`.
- Produces `isSqliteWorkerRequest` and `isSqliteWorkerResponse` guards.

- [ ] **Step 1: Write tests for malformed and valid messages.**

```ts
Deno.test('worker protocol accepts a query and rejects an unknown command', () => {
  assert(isSqliteWorkerRequest({ requestId: 'r1', type: 'query', sql: 'select 1', params: [] }));
  assert(!isSqliteWorkerRequest({ requestId: 'r1', type: 'drop-database' }));
});
```

- [ ] **Step 2: Run the focused test and verify the missing export failure.**

Run: `npm test --prefix frontend -- test/src/lib/offline/sqlite/workerProtocol.test.ts`
Expected: FAIL because the protocol module is missing.

- [ ] **Step 3: Implement discriminated-union messages and runtime guards.**

Reject missing request IDs, unknown commands, non-array params, and responses without either rows or a structured error. Keep the protocol JSON-safe; serialize `Uint8Array` values as base64 only in the worker boundary.

- [ ] **Step 4: Run the focused test.**

Run: `npm test --prefix frontend -- test/src/lib/offline/sqlite/workerProtocol.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit.**

```powershell
git add frontend/src/lib/offline/sqlite/workerProtocol.ts frontend/test/src/lib/offline/sqlite/workerProtocol.test.ts
git commit -m "feat: define sqlite worker protocol"
```

### Task 5: Implement SQLite WASM worker persistence

**Files:**
- Create: `frontend/src/lib/offline/sqlite/sqlite.worker.ts`
- Create: `frontend/src/lib/offline/sqlite/pwaAdapter.ts`
- Create: `frontend/test/src/lib/offline/sqlite/pwaAdapter.test.ts`

**Interfaces:**
- Produces `createPwaSqliteDatabase(options?: { databaseName?: string; workerFactory?: () => Worker }): Promise<SqliteDatabase>`.

- [ ] **Step 1: Write a failing worker-client test with a fake Worker.**

```ts
Deno.test('PWA adapter correlates worker responses by request ID', async () => {
  const worker = new FakeSqliteWorker({ rows: [{ value: 1 }] });
  const db = await createPwaSqliteDatabase({ workerFactory: () => worker });
  assertEquals(await db.query<{ value: number }>('select 1'), [{ value: 1 }]);
});
```

- [ ] **Step 2: Run the focused test and verify the missing-module failure.**

Run: `npm test --prefix frontend -- test/src/lib/offline/sqlite/pwaAdapter.test.ts`
Expected: FAIL because the PWA adapter is missing.

- [ ] **Step 3: Implement the worker and client.**

Initialize `@sqlite.org/sqlite-wasm` inside the worker, open the database through the OPFS VFS, apply `SQLITE_MIGRATIONS` in order, serialize query/execute requests, and reject all pending requests when the worker errors. The main-thread client must never expose the SQLite handle.

- [ ] **Step 4: Run focused tests and build.**

Run: `npm test --prefix frontend -- test/src/lib/offline/sqlite/pwaAdapter.test.ts`
Expected: PASS.

Run: `npm run build --prefix frontend`
Expected: exit 0 with the worker and `.wasm` asset emitted.

- [ ] **Step 5: Commit.**

```powershell
git add frontend/src/lib/offline/sqlite/sqlite.worker.ts frontend/src/lib/offline/sqlite/pwaAdapter.ts frontend/test/src/lib/offline/sqlite/pwaAdapter.test.ts
git commit -m "feat: persist application data in sqlite wasm"
```

### Task 6: Add runtime selection and durable-storage health

**Files:**
- Create: `frontend/src/lib/offline/sqlite/runtime.ts`
- Create: `frontend/test/src/lib/offline/sqlite/runtime.test.ts`

**Interfaces:**
- Produces `OfflineDurableStorageError` and `openApplicationDatabase()`.

- [ ] **Step 1: Write tests for storage support and no-fallback behavior.**

```ts
Deno.test('runtime rejects an unavailable durable storage environment', async () => {
  await assertRejects(() => openApplicationDatabase({ storage: { persisted: async () => false } }));
});
```

- [ ] **Step 2: Run the focused test and verify it fails.**

Run: `npm test --prefix frontend -- test/src/lib/offline/sqlite/runtime.test.ts`
Expected: FAIL because runtime selection is missing.

- [ ] **Step 3: Implement browser checks and persistent-storage request.**

Call `navigator.storage.persist()` when available, reject if SQLite/OPFS is unavailable or persistence is denied, and return the PWA adapter. Keep a future `createNativeSqliteDatabase()` injection point in the interface without importing Tauri in the PWA bundle.

- [ ] **Step 4: Run the focused test and typecheck.**

Expected: PASS and typecheck exit 0.

- [ ] **Step 5: Commit.**

```powershell
git add frontend/src/lib/offline/sqlite/runtime.ts frontend/test/src/lib/offline/sqlite/runtime.test.ts
git commit -m "feat: enforce durable sqlite storage"
```

### Task 7: Import the existing classroom IndexedDB database

**Files:**
- Create: `frontend/src/lib/offline/sqlite/legacyImport.ts`
- Create: `frontend/test/src/lib/offline/sqlite/legacyImport.test.ts`
- Modify: `frontend/src/lib/offline/classroom/store.ts`

**Interfaces:**
- Produces `importLegacyClassroomDatabase(target, source)` and `LEGACY_MIGRATION_KEY = 'legacy-idb-migrated'`.

- [ ] **Step 1: Write a failing test preserving pending and failed operations.**

```ts
Deno.test('legacy import copies entities and preserves every unsynced outbox operation', async () => {
  const source = createLegacyFixture({ outbox: [{ key: 'op-1', value: { status: 'pending' } }, { key: 'op-2', value: { status: 'failed' } }] });
  const target = await createMemorySqlite();
  await importLegacyClassroomDatabase(target, source);
  assertEquals((await target.query('select operation_id from sync_outbox order by operation_id')).length, 2);
  assertEquals((await target.query('select value from app_meta where key = ?', ['legacy-idb-migrated'])).length, 1);
});
```

- [ ] **Step 2: Run the test and verify the import module is missing.**

Run: `npm test --prefix frontend -- test/src/lib/offline/sqlite/legacyImport.test.ts`
Expected: FAIL with a missing export/module error.

- [ ] **Step 3: Implement an idempotent importer.**

Read the ten existing classroom stores, validate record shapes, insert them inside one SQLite transaction, preserve outbox/conflict status, and write the migration marker only after commit. Never delete the legacy database.

- [ ] **Step 4: Run focused tests and existing store tests.**

Expected: new tests and `frontend/test/src/lib/offline/classroom/store.test.ts` pass.

- [ ] **Step 5: Commit.**

```powershell
git add frontend/src/lib/offline/sqlite/legacyImport.ts frontend/test/src/lib/offline/sqlite/legacyImport.test.ts frontend/src/lib/offline/classroom/store.ts
git commit -m "feat: migrate classroom data into sqlite"
```

### Task 8: Move classroom repository reads to SQLite

**Files:**
- Modify: `frontend/src/lib/offline/classroom/repository.ts`, `store.ts`, `types.ts`
- Modify: `frontend/test/src/lib/offline/classroom/repository.test.ts` and `store.test.ts`

- [ ] **Step 1: Add a failing test for a real atomic local mutation.**

```ts
Deno.test('assignment mutation is visible and queued in one sqlite transaction', async () => {
  const repository = createOfflineRepository(await createMemorySqlite(), () => '2026-10-16T00:00:00.000Z', () => 'op-1', 'device-1');
  await repository.applyMutation({ actorId: 'teacher-1', type: 'assignment.create', entityId: 'assignment-1', payload: { name: 'Practice' }, dependencies: [] });
  assertEquals((await repository.readByKey('assignments', 'assignment-1'))?.name, 'Practice');
  assertEquals((await repository.getOutbox()).map((operation) => operation.operationId), ['op-1']);
});
```

- [ ] **Step 2: Run the focused test and confirm it fails against the key/value-only implementation.**

Run: `npm test --prefix frontend -- test/src/lib/offline/classroom/repository.test.ts`
Expected: FAIL because the SQLite transaction/query path is not implemented.

- [ ] **Step 3: Replace key/value persistence with parameterized SQL.**

Implement `readCollection`, `readByKey`, `writeMeta`, `putSnapshot`, `persistBootstrap`, `applyMutation`, outbox updates, conflict reads, and diagnostics using prepared parameters. Keep existing public repository method names where consumers already use them.

- [ ] **Step 4: Run repository, snapshot, and store tests.**

Expected: all focused tests pass.

- [ ] **Step 5: Commit.**

```powershell
git add frontend/src/lib/offline/classroom/repository.ts frontend/src/lib/offline/classroom/store.ts frontend/src/lib/offline/classroom/types.ts frontend/test/src/lib/offline/classroom/repository.test.ts frontend/test/src/lib/offline/classroom/store.test.ts
git commit -m "feat: make classroom repository sqlite backed"
```

### Task 9: Add operation revisions and provisional ID mapping

**Files:**
- Create: `frontend/src/lib/offline/classroom/idMapping.ts`
- Modify: `frontend/src/lib/offline/classroom/types.ts`, `snapshot.ts`, `repository.ts`
- Create: `frontend/test/src/lib/offline/classroom/idMapping.test.ts`

- [ ] **Step 1: Write the failing mapping test.**

```ts
Deno.test('server ID mapping rewrites dependent rows and outbox payloads transactionally', async () => {
  const result = remapEntityId({ localId: 'student-local-1', serverId: 'student-server-1', rows: [{ student_id: 'student-local-1' }], operations: [{ payload: { studentId: 'student-local-1' } }] });
  assertEquals(result.rows[0].student_id, 'student-server-1');
  assertEquals(result.operations[0].payload.studentId, 'student-server-1');
});
```

- [ ] **Step 2: Run the focused test and verify the missing function failure.**

Run: `npm test --prefix frontend -- test/src/lib/offline/classroom/idMapping.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `baseRevision`, `localEntityId`, `serverEntityId`, and mapping helpers.**

Use operation payloads as typed JSON, rewrite only known ID-bearing fields, preserve the original operation ID, and keep a mapping row for diagnostics and retry safety.

- [ ] **Step 4: Run focused mapping, snapshot, and repository tests.**

Expected: PASS.

- [ ] **Step 5: Commit.**

```powershell
git add frontend/src/lib/offline/classroom/idMapping.ts frontend/src/lib/offline/classroom/types.ts frontend/src/lib/offline/classroom/snapshot.ts frontend/src/lib/offline/classroom/repository.ts frontend/test/src/lib/offline/classroom/idMapping.test.ts
git commit -m "feat: map provisional offline entity ids"
```

### Task 10: Implement the sliding offline lease

**Files:**
- Create: `frontend/src/lib/offline/classroom/lease.ts`
- Modify: `frontend/src/lib/offline/classroom/crypto.ts` and `frontend/src/lib/auth/auth.ts`
- Create: `frontend/test/src/lib/auth/offline-lease.test.ts`

**Interfaces:**
- `renewOfflineLease(now: string, enrollment: OfflineEnrollmentRecord): OfflineEnrollmentRecord`.
- `isOfflineLeaseValid(now: string, enrollment: OfflineEnrollmentRecord): boolean`.

- [ ] **Step 1: Write failing lease tests.**

```ts
Deno.test('online validation renews a sliding seven-day lease', () => {
  const next = renewOfflineLease('2026-10-16T12:00:00.000Z', enrollmentAt('2026-10-10T12:00:00.000Z'));
  assertEquals(next.offlineAccessUntil, '2026-10-23T12:00:00.000Z');
  assert(isOfflineLeaseValid('2026-10-23T11:59:59.000Z', next));
  assert(!isOfflineLeaseValid('2026-10-23T12:00:00.000Z', next));
});
```

- [ ] **Step 2: Run the focused test and record the missing-module failure.**

Run: `npm test --prefix frontend -- test/src/lib/auth/offline-lease.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement UTC lease arithmetic and enrollment persistence.**

Use injected timestamps in tests, set `offlineAccessUntil` to exactly seven 24-hour days after `lastOnlineValidatedAt`, and reject invalid/missing timestamps. Store the verifier and lease in SQLite, never the raw password.

- [ ] **Step 4: Run focused crypto, enrollment, unlock, and lease tests.**

Expected: PASS with no password string present in serialized enrollment data.

- [ ] **Step 5: Commit.**

```powershell
git add frontend/src/lib/offline/classroom/lease.ts frontend/src/lib/offline/classroom/crypto.ts frontend/src/lib/auth/auth.ts frontend/test/src/lib/auth/offline-lease.test.ts
git commit -m "feat: add sliding offline access lease"
```

### Task 11: Restore durable sessions across reloads

**Files:**
- Modify: `frontend/src/lib/auth/auth.ts`, `useAuth.tsx`, `session-state.ts`
- Modify: `frontend/test/src/lib/auth/offline-unlock.test.ts`, `useAuth.test.ts`

- [ ] **Step 1: Add failing tests for reload restoration and expired lease.**

```ts
Deno.test('offline session restores without a Supabase request while lease is valid', async () => {
  const session = await restoreOfflineSession({ now: '2026-10-16T12:00:00.000Z', online: false });
  assertEquals(session?.role, 'teacher');
});

Deno.test('expired offline lease returns needs-auth and preserves local data', async () => {
  await assertRejects(() => restoreOfflineSession({ now: '2026-10-24T12:00:00.000Z', online: false }));
  assertEquals(await repository.getOutbox(), pendingOperations);
});
```

- [ ] **Step 2: Run the focused auth tests and confirm failure.**

Run: `npm test --prefix frontend -- test/src/lib/auth/offline-unlock.test.ts test/src/lib/auth/useAuth.test.ts`
Expected: FAIL because session restoration does not enforce the lease.

- [ ] **Step 3: Implement SQLite-backed local-session restoration.**

On offline startup, read the active local session and lease before calling network APIs. On valid lease restore the teacher and cached student-view context. On expiry return `needs-auth` without deleting enrollment, classroom rows, outbox, or conflicts. Explicit sign-out clears only the active session.

- [ ] **Step 4: Run focused tests and typecheck.**

Expected: PASS and typecheck exit 0.

- [ ] **Step 5: Commit.**

```powershell
git add frontend/src/lib/auth/auth.ts frontend/src/lib/auth/useAuth.tsx frontend/src/lib/auth/session-state.ts frontend/test/src/lib/auth/offline-unlock.test.ts frontend/test/src/lib/auth/useAuth.test.ts
git commit -m "feat: restore offline sessions across reloads"
```

### Task 12: Make bootstrap SQLite-first and lease-aware

**Files:**
- Modify: `frontend/src/lib/offline/classroom/bootstrap.ts`, `useOfflineClassroom.ts`, `repository.ts`
- Modify: `frontend/test/src/lib/offline/classroom/bootstrap.test.ts`, `offline-online-flow.test.ts`

- [ ] **Step 1: Add a failing test for bootstrap preserving pending local work and renewing the lease.**

```ts
Deno.test('online bootstrap merges the pack without deleting local pending work', async () => {
  await repository.applyMutation({ actorId: 'teacher-1', type: 'assignment.create', entityId: 'local-a', payload: { name: 'Local' }, dependencies: [] });
  await bootstrapRepository(repository, () => serverPack);
  assertEquals((await repository.readByKey('assignments', 'local-a'))?.name, 'Local');
  assertEquals(await repository.readMeta('offlineAccessUntil'), '2026-10-23T00:00:00.000Z');
});
```

- [ ] **Step 2: Run the focused tests and record the failing behavior.**

Run: `npm test --prefix frontend -- test/src/lib/offline/classroom/bootstrap.test.ts test/src/lib/offline/classroom/offline-online-flow.test.ts`
Expected: FAIL until lease and SQLite merge are integrated.

- [ ] **Step 3: Implement atomic bootstrap merge.**

Validate the complete response, merge acknowledged rows, preserve all non-acknowledged outbox/conflict entities, persist revision/lastSyncedAt, and renew the lease only after authenticated bootstrap succeeds.

- [ ] **Step 4: Run focused tests.**

Expected: PASS.

- [ ] **Step 5: Commit.**

```powershell
git add frontend/src/lib/offline/classroom/bootstrap.ts frontend/src/lib/offline/classroom/useOfflineClassroom.ts frontend/src/lib/offline/classroom/repository.ts frontend/test/src/lib/offline/classroom/bootstrap.test.ts frontend/test/src/lib/offline/classroom/offline-online-flow.test.ts
git commit -m "feat: make bootstrap sqlite first"
```

### Task 13: Implement dependency-aware client synchronization

**Files:**
- Modify: `frontend/src/lib/offline/classroom/sync.ts`, `index.ts`, `types.ts`
- Modify: `frontend/test/src/lib/offline/classroom/sync.test.ts`

- [ ] **Step 1: Write failing tests for dependency ordering and partial results.**

```ts
Deno.test('sync sends parent before dependent operation and keeps retryable work queued', async () => {
  const sent: string[] = [];
  const result = await syncOfflineClassroom(repository, async (_name, options) => { sent.push(...readOperationIds(options)); return { results: [{ operationId: 'parent', status: 'applied' }, { operationId: 'child', status: 'retryable', error: 'temporary' }] }; });
  assertEquals(sent, ['parent', 'child']);
  assertEquals(result.remaining, 1);
});
```

- [ ] **Step 2: Run the focused test and verify the current sync loop fails.**

Run: `npm test --prefix frontend -- test/src/lib/offline/classroom/sync.test.ts`
Expected: FAIL because the current implementation has no per-operation result protocol.

- [ ] **Step 3: Implement topological ordering and result application.**

Send bounded batches, skip an operation until all dependencies are acknowledged, write applied/duplicate results before deleting outbox rows, store conflict/rejected rows, increment retry metadata for retryable results, and continue after independent failures.

- [ ] **Step 4: Run sync, snapshot, and repository tests.**

Expected: PASS.

- [ ] **Step 5: Commit.**

```powershell
git add frontend/src/lib/offline/classroom/sync.ts frontend/src/lib/offline/classroom/index.ts frontend/src/lib/offline/classroom/types.ts frontend/test/src/lib/offline/classroom/sync.test.ts
git commit -m "feat: synchronize sqlite outbox by dependency"
```

### Task 14: Add the Supabase revision and idempotency schema

**Files:**
- Create: `supabase/migrations/0015_offline_revision_conflicts.sql`
- Modify: `test/supabase/functions/_shared/offline_schema.test.ts`

- [ ] **Step 1: Write failing schema assertions.**

```ts
Deno.test('offline schema stores base revisions, results, conflicts, and ID mappings', async () => {
  const sql = await readMigration('0015_offline_revision_conflicts.sql');
  for (const column of ['base_revision', 'result_status', 'conflict_payload']) assert(sql.includes(column));
  assert(sql.includes('entity_id_mappings'));
});
```

- [ ] **Step 2: Run the focused Deno test and record the missing migration failure.**

Run: `deno test --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen test/supabase/functions/_shared/offline_schema.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the migration.**

Add server revision tracking to operation records, unique `(device_id, operation_id)` idempotency, conflict payload/status columns, and a mapping table keyed by teacher/device/local entity. Keep RLS enabled and add teacher-scoped indexes.

- [ ] **Step 4: Run the focused Supabase test.**

Expected: PASS.

- [ ] **Step 5: Commit.**

```powershell
git add supabase/migrations/0015_offline_revision_conflicts.sql test/supabase/functions/_shared/offline_schema.test.ts
git commit -m "feat: add offline revision and conflict schema"
```

### Task 15: Expand the offline bootstrap snapshot

**Files:**
- Modify: `frontend/src/lib/offline/classroom/types.ts`, `bootstrap.ts`
- Modify: `supabase/functions/_shared/offline_snapshot.ts`, `offline-bootstrap/handler.ts`
- Modify: `test/supabase/functions/offline-bootstrap/handler.test.ts`

- [ ] **Step 1: Add a failing contract test for Free Play data and revision metadata.**

```ts
Deno.test('offline bootstrap returns all classroom and Free Play application data', async () => {
  const response = await callOfflineBootstrap();
  assert(Array.isArray(response.freePlaySessions));
  assert(Array.isArray(response.freePlayProgress));
  assertEquals(typeof response.revision, 'number');
});
```

- [ ] **Step 2: Run the focused Supabase test and verify the response is incomplete.**

Run: `deno test --allow-env --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen test/supabase/functions/offline-bootstrap/handler.test.ts`
Expected: FAIL because the current contract lacks Free Play fields.

- [ ] **Step 3: Add validated snapshot fields and queries.**

Query only the authenticated teacher's classroom, roster, assignments, attempts, results, posts, Free Play user data, server revision, and timestamp. Update the frontend guard and transactional merge.

- [ ] **Step 4: Run focused frontend and Supabase contract tests.**

Expected: PASS.

- [ ] **Step 5: Commit.**

```powershell
git add frontend/src/lib/offline/classroom/types.ts frontend/src/lib/offline/classroom/bootstrap.ts supabase/functions/_shared/offline_snapshot.ts supabase/functions/offline-bootstrap/handler.ts test/supabase/functions/offline-bootstrap/handler.test.ts
git commit -m "feat: bootstrap complete offline application pack"
```

### Task 16: Harden server idempotency and per-operation results

**Files:**
- Modify: `supabase/functions/offline-sync/handler.ts`, `supabase/functions/offline-sync/index.ts`, `supabase/functions/_shared/offline_operations.ts`
- Modify: `test/supabase/functions/offline-sync/handler.test.ts`

- [ ] **Step 1: Write failing tests for duplicate and partial batch results.**

```ts
Deno.test('offline sync returns the stored result for a duplicate operation', async () => {
  const first = await syncOperation(validOperation);
  const second = await syncOperation(validOperation);
  assertEquals(second.status, 'duplicate');
  assertEquals(second.result, first.result);
});
```

- [ ] **Step 2: Run the focused test and verify duplicate handling is absent or incomplete.**

Run: `deno test --allow-env --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen test/supabase/functions/offline-sync/handler.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement authenticated batch processing.**

Validate device/actor ownership, read the idempotency row before applying, execute one operation in a database-safe unit, store the result/status, and return independent results for every batch member. Return `retryable` for transient persistence errors without marking the operation applied.

- [ ] **Step 4: Run all existing offline-sync tests.**

Expected: PASS for handler, activity, assignment, quiz, and roster suites.

- [ ] **Step 5: Commit.**

```powershell
git add supabase/functions/offline-sync/handler.ts supabase/functions/offline-sync/index.ts supabase/functions/_shared/offline_operations.ts test/supabase/functions/offline-sync/handler.test.ts
git commit -m "feat: make offline sync idempotent"
```

### Task 17: Add server revision conflicts and ID remapping

**Files:**
- Modify: `supabase/functions/_shared/offline_operations.ts`
- Modify: `test/supabase/functions/offline-sync/assignment-operations.test.ts`, `roster-operations.test.ts`

- [ ] **Step 1: Write failing tests for stale assignment edits and provisional students.**

```ts
Deno.test('stale mutable assignment returns conflict without overwriting the server row', async () => {
  const result = await applyAssignmentUpdate({ baseRevision: 4, serverRevision: 5 });
  assertEquals(result.status, 'conflict');
});

Deno.test('offline roster provisioning returns a canonical student mapping', async () => {
  const result = await applyRosterAdd({ localStudentId: 'local-student-1' });
  assertEquals(result.mappings[0].localId, 'local-student-1');
});
```

- [ ] **Step 2: Run focused tests and verify current handlers lack these outcomes.**

Run: `deno test --allow-env --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen test/supabase/functions/offline-sync/assignment-operations.test.ts test/supabase/functions/offline-sync/roster-operations.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement base-revision checks and mapping persistence.**

Reject stale mutable writes as conflicts with both versions, keep append-only activity idempotent, and return `{ localId, serverId }` mappings for provisioned students. Validate that the actor owns the class before creating any server row.

- [ ] **Step 4: Run assignment, roster, and handler suites.**

Expected: PASS.

- [ ] **Step 5: Commit.**

```powershell
git add supabase/functions/_shared/offline_operations.ts test/supabase/functions/offline-sync/assignment-operations.test.ts test/supabase/functions/offline-sync/roster-operations.test.ts
git commit -m "feat: resolve offline revisions and identity mappings"
```

### Task 18: Preserve append-only activity and quiz semantics

**Files:**
- Modify: `supabase/functions/_shared/offline_operations.ts`
- Modify: `test/supabase/functions/offline-sync/activity-operations.test.ts`, `quiz-operations.test.ts`

- [ ] **Step 1: Add failing tests for duplicate attempt/game events and dependency-aware quiz completion.**

```ts
Deno.test('duplicate attempt submission is accepted idempotently without a second attempt row', async () => {
  const first = await applyActivityOperation(validAttemptOperation);
  const second = await applyActivityOperation(validAttemptOperation);
  assertEquals(second.status, 'duplicate');
  assertEquals(await countAttempts(validAttemptOperation.entityId), 1);
});
```

- [ ] **Step 2: Run focused tests and observe the duplicate/append failure.**

Run: `deno test --allow-env --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen test/supabase/functions/offline-sync/activity-operations.test.ts test/supabase/functions/offline-sync/quiz-operations.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement append-only inserts and safe quiz checkpoints.**

Use client IDs for attempts/results, reject an assignment quiz checkpoint before its start dependency is applied, and make completion update only the owning attempt while inserting each game result idempotently.

- [ ] **Step 4: Run focused suites.**

Expected: PASS.

- [ ] **Step 5: Commit.**

```powershell
git add supabase/functions/_shared/offline_operations.ts test/supabase/functions/offline-sync/activity-operations.test.ts test/supabase/functions/offline-sync/quiz-operations.test.ts
git commit -m "feat: preserve offline quiz and activity events"
```

### Task 19: Route teacher API hooks through local-first mutations

**Files:**
- Modify: `frontend/src/lib/api/hooks.ts`, `frontend/src/lib/offline/classroom/mutations.ts`, `queries.ts`
- Modify: `frontend/test/src/lib/offline/classroom/offline-online-flow.test.ts` and relevant hook tests

- [ ] **Step 1: Write a failing test proving online and offline assignment writes share the repository path.**

```ts
Deno.test('online assignment creation commits locally before eager sync', async () => {
  const result = await createAssignmentWithSync({ online: true, input: { lessonId: 'lesson-1', name: 'Practice' } });
  assertEquals(result.assignment.name, 'Practice');
  assertEquals(result.localCommitBeforeNetwork, true);
});
```

- [ ] **Step 2: Run the focused test and verify the online hook still calls Supabase directly.**

Run: `npm test --prefix frontend -- test/src/lib/offline/classroom/offline-online-flow.test.ts`
Expected: FAIL.

- [ ] **Step 3: Convert teacher writes.**

Route create/update/delete assignments, roster additions/removals, and posts through local repository mutations regardless of `navigator.onLine`; trigger `syncNow()` when online and invalidate query keys after the local transaction.

- [ ] **Step 4: Run teacher hook and existing page tests.**

Expected: PASS.

- [ ] **Step 5: Commit.**

```powershell
git add frontend/src/lib/api/hooks.ts frontend/src/lib/offline/classroom/mutations.ts frontend/src/lib/offline/classroom/queries.ts frontend/test/src/lib/offline/classroom/offline-online-flow.test.ts
git commit -m "feat: make teacher mutations local first"
```

### Task 20: Route student and quiz writes through SQLite

**Files:**
- Modify: `frontend/src/lib/offline/classroom/quiz.ts`, `frontend/src/lib/api/hooks.ts`, `frontend/src/pages/QuizPage.tsx`
- Modify: `frontend/test/src/lib/offline/classroom/quiz.test.ts`, `frontend/test/src/pages/QuizPage.test.ts`

- [ ] **Step 1: Add failing tests for durable start/checkpoint/complete.**

```ts
Deno.test('quiz checkpoint is readable after the mutation call returns', async () => {
  const result = await checkpointAssignmentQuiz(repository, { attemptId: 'attempt-1', assignmentId: 'assignment-1', currentGameOrder: 2, score: 2, maxScore: 3 });
  assertEquals((await readAssignmentQuiz(repository, 'assignment-1', 'student-1')).currentGameOrder, 2);
});
```

- [ ] **Step 2: Run focused quiz/page tests and verify the current online branch bypasses SQLite.**

Run: `npm test --prefix frontend -- test/src/lib/offline/classroom/quiz.test.ts test/src/pages/QuizPage.test.ts`
Expected: FAIL.

- [ ] **Step 3: Make start/checkpoint/complete and standalone submissions local-first.**

Persist the attempt and detailed result rows before rendering the next game, include dependency IDs in outbox operations, and trigger eager sync only after the local transaction resolves.

- [ ] **Step 4: Run focused quiz/page tests.**

Expected: PASS.

- [ ] **Step 5: Commit.**

```powershell
git add frontend/src/lib/offline/classroom/quiz.ts frontend/src/lib/api/hooks.ts frontend/src/pages/QuizPage.tsx frontend/test/src/lib/offline/classroom/quiz.test.ts frontend/test/src/pages/QuizPage.test.ts
git commit -m "feat: persist quiz work before sync"
```

### Task 21: Add Free Play SQLite progress events

**Files:**
- Create: `frontend/src/lib/offline/classroom/freePlay.ts`
- Modify: `frontend/src/lib/games/free-play.ts`, `frontend/src/pages/free-play.tsx`, `frontend/src/lib/api/hooks.ts`
- Create: `frontend/test/src/lib/offline/classroom/freePlay.test.ts`

- [ ] **Step 1: Write the failing progress test.**

```ts
Deno.test('Free Play completion is stored in SQLite and queued for sync', async () => {
  await recordFreePlayCompletion(repository, { actorId: 'teacher-1', gameId: 'colors-1', score: 8, maxScore: 10 });
  assertEquals((await repository.readCollection('free_play_progress')).length, 1);
  assertEquals((await repository.getOutbox()).at(-1)?.type, 'freePlay.complete');
});
```

- [ ] **Step 2: Run the focused test and verify the module/operation is missing.**

Run: `npm test --prefix frontend -- test/src/lib/offline/classroom/freePlay.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement progress persistence without touching media storage.**

Record session start, checkpoint, completion, and score events in SQLite. Keep `FreePlayOfflinePanel`, service-worker media status, the media IndexedDB database, and Cache Storage behavior unchanged except for status wording that distinguishes media readiness from data sync.

- [ ] **Step 4: Run Free Play library/page and PWA isolation tests.**

Expected: PASS.

- [ ] **Step 5: Commit.**

```powershell
git add frontend/src/lib/offline/classroom/freePlay.ts frontend/src/lib/games/free-play.ts frontend/src/pages/free-play.tsx frontend/src/lib/api/hooks.ts frontend/test/src/lib/offline/classroom/freePlay.test.ts
git commit -m "feat: sync free play progress through sqlite"
```

### Task 22: Make dashboards, reports, posts, and student reads SQLite-first

**Files:**
- Modify: `frontend/src/lib/api/hooks.ts`, `frontend/src/lib/offline/classroom/queries.ts`, `reports.ts`
- Modify: `frontend/test/src/lib/offline/classroom/queries.test.ts`, `reports.test.ts`

- [ ] **Step 1: Add failing tests for pending data in dashboards/reports.**

```ts
Deno.test('offline report includes a locally completed attempt before cloud acknowledgement', async () => {
  const report = await buildOfflineTeacherClassReport(classrooms, students, [{ id: 'local-attempt', class_id: 'class-1', score: 9, max_score: 10 }], 'class-1', 'week');
  assertEquals(report.classroomSummary.attemptCount, 1);
});
```

- [ ] **Step 2: Run focused query/report tests and verify online-only branches fail the expectation.**

Run: `npm test --prefix frontend -- test/src/lib/offline/classroom/queries.test.ts test/src/lib/offline/classroom/reports.test.ts`
Expected: FAIL.

- [ ] **Step 3: Remove network-only reads from authenticated screens.**

Read classroom, student, assignment, post, dashboard, and report data from SQLite first. Use a background bootstrap/sync to refresh authoritative data, and keep cached data available when the network request fails.

- [ ] **Step 4: Run focused reads and existing teacher/student page suites.**

Expected: PASS.

- [ ] **Step 5: Commit.**

```powershell
git add frontend/src/lib/api/hooks.ts frontend/src/lib/offline/classroom/queries.ts frontend/src/lib/offline/classroom/reports.ts frontend/test/src/lib/offline/classroom/queries.test.ts frontend/test/src/lib/offline/classroom/reports.test.ts
git commit -m "feat: read dashboards and reports from sqlite"
```

### Task 23: Wire database lifecycle and app online/offline events

**Files:**
- Modify: `frontend/src/lib/offline/classroom/useOfflineClassroom.ts`, `frontend/src/App.tsx`, `frontend/src/components/layout.tsx`
- Create: `frontend/test/src/lib/offline/classroom/database-lifecycle.test.ts`

- [ ] **Step 1: Write failing lifecycle tests.**

```ts
Deno.test('provider opens one database, restores counts, and closes it on unmount', async () => {
  const lifecycle = await startOfflineProvider({ database: fakeDatabase });
  assertEquals(lifecycle.openCount, 1);
  await lifecycle.dispose();
  assertEquals(lifecycle.closeCount, 1);
});
```

- [ ] **Step 2: Run the focused test and verify the provider still constructs IndexedDB directly.**

Run: `npm test --prefix frontend -- test/src/lib/offline/classroom/database-lifecycle.test.ts`
Expected: FAIL.

- [ ] **Step 3: Initialize SQLite before authenticated queries and connect startup/online/visibility/manual sync events.**

Dispatch `storage-error` instead of creating a memory repository. Ensure network state changes only alter sync eligibility; they never discard local data.

- [ ] **Step 4: Run lifecycle, auth, and offline status tests.**

Expected: PASS.

- [ ] **Step 5: Commit.**

```powershell
git add frontend/src/lib/offline/classroom/useOfflineClassroom.ts frontend/src/App.tsx frontend/src/components/layout.tsx frontend/test/src/lib/offline/classroom/database-lifecycle.test.ts
git commit -m "feat: wire sqlite lifecycle into app shell"
```

### Task 24: Add status, lease, and storage-health UX

**Files:**
- Modify: `frontend/src/components/offline/OfflineStatusIndicator.tsx`, `OfflinePackPanel.tsx`, `OfflineConflictPanel.tsx`
- Modify: `frontend/test/src/components/offline-status-indicator.test.tsx`, `offline-pack-panel.test.tsx`, `offline-conflict-panel.test.tsx`

- [ ] **Step 1: Add failing UI assertions.**

```ts
test('offline pack panel shows lease expiry, storage health, and pending counts', () => {
  render(<OfflinePackPanel state={{ status: 'offline', pendingCount: 3, failedCount: 1, leaseExpiresAt: '2026-10-23T00:00:00.000Z', storage: 'healthy' }} />);
  expect(screen.getByText(/3 pending/i)).toBeTruthy();
  expect(screen.getByText(/October 23/i)).toBeTruthy();
});
```

- [ ] **Step 2: Run focused component tests and observe missing-state failures.**

Run: `npm test --prefix frontend -- test/src/components/offline-status-indicator.test.tsx test/src/components/offline-pack-panel.test.tsx test/src/components/offline-conflict-panel.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement the visible states and actions.**

Show `Online`, `Offline`, `Syncing`, `Needs sign-in`, and `Sync errors`; display last sync, lease expiry, storage health, pending/failed/conflict counts, sync/bootstrap controls, and diagnostics. Do not claim cloud acknowledgement for a local-only write.

- [ ] **Step 4: Run focused UI tests.**

Expected: PASS.

- [ ] **Step 5: Commit.**

```powershell
git add frontend/src/components/offline/OfflineStatusIndicator.tsx frontend/src/components/offline/OfflinePackPanel.tsx frontend/src/components/offline/OfflineConflictPanel.tsx frontend/test/src/components/offline-status-indicator.test.tsx frontend/test/src/components/offline-pack-panel.test.tsx frontend/test/src/components/offline-conflict-panel.test.tsx
git commit -m "feat: expose offline health and lease state"
```

### Task 25: Add explicit conflict resolution and diagnostics

**Files:**
- Modify: `frontend/src/lib/offline/classroom/repository.ts`, `snapshot.ts`
- Modify: `frontend/src/components/offline/OfflineConflictPanel.tsx`
- Modify: `frontend/test/src/lib/offline/classroom/snapshot.test.ts`, `offline-conflict-panel.test.tsx`

- [ ] **Step 1: Write failing tests for local/server resolution and redacted diagnostics.**

```ts
Deno.test('resolving a server conflict creates a resolution record without deleting unrelated outbox work', async () => {
  await repository.resolveConflict('assignment-1', 'server');
  assertEquals((await repository.getOutbox()).map((operation) => operation.operationId), ['unrelated-op']);
  assertEquals((await repository.readMeta('conflict:assignment-1')).choice, 'server');
});
```

- [ ] **Step 2: Run focused tests and verify the current conflict deletion is too destructive.**

Run: `npm test --prefix frontend -- test/src/lib/offline/classroom/snapshot.test.ts test/src/components/offline-conflict-panel.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement explicit resolution operations and diagnostics export.**

Keep local/server payloads until resolution is committed, create a follow-up mutation for local choice, mark server choice as acknowledged, and redact password verifiers/session secrets from exported diagnostics.

- [ ] **Step 4: Run focused conflict/diagnostic tests.**

Expected: PASS.

- [ ] **Step 5: Commit.**

```powershell
git add frontend/src/lib/offline/classroom/repository.ts frontend/src/lib/offline/classroom/snapshot.ts frontend/src/components/offline/OfflineConflictPanel.tsx frontend/test/src/lib/offline/classroom/snapshot.test.ts frontend/test/src/components/offline-conflict-panel.test.tsx
git commit -m "feat: resolve offline conflicts safely"
```

### Task 26: Keep service-worker media storage isolated and precache SQLite assets

**Files:**
- Modify: `frontend/src/pwa/sw.ts`, `frontend/src/pwa/cacheProtocol.ts`, `frontend/vite.config.ts`
- Modify: `frontend/test/src/pwa/offline-data-isolation.test.ts`, `pwa-config.test.ts`

- [ ] **Step 1: Add failing isolation assertions.**

```ts
Deno.test('media worker keeps status in its dedicated IndexedDB and never opens the application SQLite database', async () => {
  const source = await readText('src/pwa/sw.ts');
  assert(!source.includes('mathventure-app')) ;
  assert(source.includes('mathventure-offline-media'));
});
```

- [ ] **Step 2: Run the focused PWA tests and verify the new WASM asset is not precached.**

Run: `npm test --prefix frontend -- test/src/pwa/offline-data-isolation.test.ts test/src/pwa/pwa-config.test.ts`
Expected: FAIL.

- [ ] **Step 3: Configure injectManifest to include SQLite worker/WASM assets and preserve media isolation.**

Keep media byte caching and metadata behavior unchanged. Add explicit `globPatterns`/asset handling for the SQLite WASM file and ensure worker URL resolution works after build.

- [ ] **Step 4: Run PWA tests and build.**

Expected: PASS and the build output includes the SQLite WASM asset.

- [ ] **Step 5: Commit.**

```powershell
git add frontend/src/pwa/sw.ts frontend/src/pwa/cacheProtocol.ts frontend/vite.config.ts frontend/test/src/pwa/offline-data-isolation.test.ts frontend/test/src/pwa/pwa-config.test.ts
git commit -m "feat: precache sqlite without changing media storage"
```

### Task 27: Add browser-level local-first integration coverage

**Files:**
- Create: `frontend/test/src/lib/offline/sqlite/local-first.integration.test.ts`
- Modify: `frontend/test/src/lib/offline/classroom/offline-online-flow.test.ts`

- [ ] **Step 1: Write a failing end-to-end repository test.**

```ts
Deno.test('application remains usable after network failure and reload', async () => {
  const app = await createTestApplication({ online: true });
  await app.loginAndBootstrap();
  await app.createAssignment({ name: 'Practice' });
  app.setOnline(false);
  await app.reload();
  assertEquals((await app.readAssignments()).at(-1)?.name, 'Practice');
  assertEquals((await app.syncSummary()).pendingCount, 1);
});
```

- [ ] **Step 2: Run the focused integration test and verify it fails before all lifecycle pieces are connected.**

Run: `npm test --prefix frontend -- test/src/lib/offline/sqlite/local-first.integration.test.ts test/src/lib/offline/classroom/offline-online-flow.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the test harness around the memory adapter and fake network.**

Exercise login, bootstrap, local mutation, forced reload, offline read, reconnect, eager sync, and authoritative acknowledgement without mocking the repository methods under test.

- [ ] **Step 4: Run the focused integration tests.**

Expected: PASS.

- [ ] **Step 5: Commit.**

```powershell
git add frontend/test/src/lib/offline/sqlite/local-first.integration.test.ts frontend/test/src/lib/offline/classroom/offline-online-flow.test.ts
git commit -m "test: cover reload safe local first flow"
```

### Task 28: Add full Supabase protocol regression coverage

**Files:**
- Modify: `test/supabase/functions/offline-sync/handler.test.ts`, `activity-operations.test.ts`, `assignment-operations.test.ts`, `quiz-operations.test.ts`, `roster-operations.test.ts`
- Create: `test/supabase/functions/offline-sync/conflict-operations.test.ts`

- [ ] **Step 1: Add failing cases for authorization, stale revisions, duplicate IDs, malformed payloads, partial batches, and retryable errors.**

```ts
Deno.test('offline sync reports one rejected operation without hiding an independent applied operation', async () => {
  const response = await syncBatch([malformedOperation, validOperation]);
  assertEquals(response.results.map((result) => result.status), ['rejected', 'applied']);
});
```

- [ ] **Step 2: Run the complete offline-sync suite and record failures.**

Run: `deno test --allow-env --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen test/supabase/functions/offline-sync`
Expected: FAIL until all protocol behavior is covered.

- [ ] **Step 3: Implement/fix only the server behavior required by the failing cases.**

Keep authorization checks explicit, do not swallow errors, and preserve the per-operation status in the stored idempotency row.

- [ ] **Step 4: Run the complete offline-sync suite.**

Expected: PASS.

- [ ] **Step 5: Commit.**

```powershell
git add test/supabase/functions/offline-sync
git commit -m "test: cover complete offline sync protocol"
```

### Task 29: Document field operation and recovery

**Files:**
- Modify: `docs/offline-classroom.md`, `docs/offline-free-play.md`, `README.md`
- Modify: `frontend/test/src/lib/offline/classroom/documentation-contract.test.ts`

- [ ] **Step 1: Add failing documentation assertions.**

```ts
Deno.test('offline documentation explains enrollment, seven-day lease, SQLite, and media-cache split', async () => {
  const text = await readDocs();
  for (const phrase of ['SQLite', 'seven days', 'force-reload', 'Sync now', 'Cache Storage']) assert(text.includes(phrase), phrase);
});
```

- [ ] **Step 2: Run the focused documentation test and confirm missing guidance.**

Run: `npm test --prefix frontend -- test/src/lib/offline/classroom/documentation-contract.test.ts`
Expected: FAIL.

- [ ] **Step 3: Document the exact field workflow.**

Explain online enrollment, offline unlock, sliding lease renewal, forced reloads, media download versus data sync, pending/conflict recovery, diagnostic export, and the online-only account actions. Include the exact CI commands for maintainers.

- [ ] **Step 4: Run the focused documentation test.**

Expected: PASS.

- [ ] **Step 5: Commit.**

```powershell
git add docs/offline-classroom.md docs/offline-free-play.md README.md frontend/test/src/lib/offline/classroom/documentation-contract.test.ts
git commit -m "docs: document sqlite offline operations"
```

### Task 30: Run the complete verification gate

**Files:**
- No production files; inspect the complete diff and generated build output.

- [ ] **Step 1: Run frontend typecheck.**

Run: `npm run typecheck --prefix frontend`
Expected: exit 0.

- [ ] **Step 2: Run the complete frontend test lane within the 110-second budget.**

Run: `timeout 110s npm test --prefix frontend`
Expected: exit 0 with no focused/skipped test warnings.

- [ ] **Step 3: Run the production build.**

Run: `npm run build --prefix frontend`
Expected: exit 0 with app shell, worker, and SQLite WASM assets emitted.

- [ ] **Step 4: Run the complete Supabase test lane within the 110-second budget.**

Run: `timeout 110s deno test --allow-env --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen test/supabase`
Expected: exit 0.

- [ ] **Step 5: Inspect status and diff for scope.**

Run: `git status --short; git diff --check; git diff master...HEAD --stat`
Expected: only planned files are committed; unrelated dirty files remain unstaged/unchanged; diff check has no output.

- [ ] **Step 6: Commit the verification record if the repository convention requires it.**

```powershell
git status --short
```

Do not create an empty verification commit. Report the four fresh command results and any remote GitHub Actions run as verified or unverified.

## Plan self-review

- Spec coverage: storage/runtime boundary is covered by Tasks 1–7 and 26; sync and multi-device semantics by Tasks 9 and 13–18 and 28; sliding lease/reload behavior by Tasks 10–12; full product coverage by Tasks 19–22; UX/recovery by Tasks 23–26; tests/CI/docs by Tasks 27–30.
- Plan completeness: all commands, interfaces, expected outcomes, and file paths are concrete; no unresolved placeholders or deferred implementation steps are used.
- Type consistency: `SqliteDatabase`, `SqliteTransaction`, `SqliteValue`, `createMemorySqlite`, `createPwaSqliteDatabase`, `openApplicationDatabase`, `remapEntityId`, and lease helpers are named consistently across tasks.
- Scope: the plan replaces the current classroom application store and routes existing authenticated operations through it; the service-worker media IndexedDB exception and future Tauri adapter are explicitly bounded.
- Verification: the final task runs the exact blocking frontend and Supabase CI-equivalent commands from the repository workflow.
