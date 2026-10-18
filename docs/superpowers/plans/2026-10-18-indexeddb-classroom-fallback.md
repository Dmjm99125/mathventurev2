# IndexedDB Classroom Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the complete offline classroom flow durable and reload-safe when the browser uses the `mathventure-classroom` IndexedDB fallback.

**Architecture:** Keep SQLite/OPFS as the preferred browser backend and native SQLite as the Windows Tauri backend. Extend the existing `OfflineStore` contract with a transaction-scoped facade, adapt the legacy repository to use that facade, and make the real IndexedDB adapter execute compound writes in one IndexedDB transaction. Keep the application provider and auth services behind the existing `ApplicationStorage` union.

**Tech Stack:** React 19, TypeScript 5.9, Vite 6, Deno tests, browser IndexedDB, SQLite WASM/OPFS, Windows Tauri 2.

## Global Constraints

- The existing `mathventure-classroom` IndexedDB name, version, stores, and record shape remain compatible.
- SQLite/OPFS remains preferred on browsers where it works.
- Windows Tauri continues to use native SQLite through the Rust bridge.
- Capability-only OPFS failures may select IndexedDB; migration, corruption, and unexpected SQLite failures remain fatal.
- IndexedDB is reported as `best-effort`; no volatile-memory production fallback is added.
- Existing tests and coverage remain enabled; no focused or skipped CI lanes.
- Work stays inline in the current worktree, and unrelated dirty files remain unstaged.

---

### Task 1: Define a transaction-scoped OfflineStore contract

**Files:**
- Modify: `frontend/src/lib/offline/classroom/store.ts`
- Modify: `frontend/src/lib/offline/classroom/memoryStore.ts`
- Test: `frontend/test/src/lib/offline/classroom/store.test.ts`

**Interfaces:** Change `OfflineStore.transaction` to accept `work: (store: OfflineStore) => Promise<T>`. The callback receives a facade whose operations participate in the one transaction.

- [x] **Step 1: Write the failing test.** Add this to `store.test.ts`:

```ts
Deno.test('offline store transactions expose a scoped store facade', async () => {
  const store = createMemoryStore();
  await store.transaction(['meta'], async (transactionStore) => {
    await transactionStore.put('meta', { key: 'transaction', value: true });
  });
  assertEquals(await store.get('meta', 'transaction'), { key: 'transaction', value: true });
});
```

- [x] **Step 2: Run the focused test and verify it fails.**

```powershell
deno test --allow-read --allow-env --import-map=deno.json test/src/lib/offline/classroom/store.test.ts
```

Expected: TypeScript reports that the current transaction callback has no argument.

- [x] **Step 3: Implement the minimal contract.** Update `OfflineStore` and `createMemoryStore()` so the memory transaction invokes `work(transactionStore)`, using the memory store itself as the scoped facade.

- [x] **Step 4: Run the focused test and verify it passes.** Run the same command; expect all store tests to pass.

- [x] **Step 5: Commit.**

```powershell
git add frontend/src/lib/offline/classroom/store.ts frontend/src/lib/offline/classroom/memoryStore.ts frontend/test/src/lib/offline/classroom/store.test.ts
git commit -m "refactor: scope offline store transactions"
```

### Task 2: Route legacy repository writes through the scoped store

**Files:**
- Modify: `frontend/src/lib/offline/classroom/repository.ts:90-270`
- Modify: `frontend/src/lib/offline/sqlite/legacyImport.ts:291-310` only if required by the new type
- Test: `frontend/test/src/lib/offline/classroom/repository.test.ts`

**Interfaces:** Every legacy repository transaction callback receives `transactionStore` and uses it for all reads/writes inside that callback. SQLite repository transactions remain unchanged.

- [x] **Step 1: Add the failing/typing regression.** Keep the existing legacy mutation test and add an assertion that the entity and outbox operation are both present after one `applyMutation` call. Use `createMemoryStore()`, fixed clock `2026-10-18T00:00:00.000Z`, and ID `op-1`.

- [x] **Step 2: Run the focused test.**

```powershell
deno test --allow-read --allow-env --import-map=deno.json test/src/lib/offline/classroom/repository.test.ts
```

Expected: callback type errors or failure until repository callbacks use the scoped store.

- [x] **Step 3: Update all legacy callbacks.** Replace every `store.transaction(stores, async () => { ... store.* ... })` with `store.transaction(stores, async (transactionStore) => { ... transactionStore.* ... })`. Cover lease renewal, snapshots/bootstrap, mutations, ID remapping, and conflicts. No `store.*` calls remain inside those callbacks.

- [x] **Step 4: Run focused repository coverage.**

```powershell
deno test --allow-read --allow-env --import-map=deno.json test/src/lib/offline/classroom/repository.test.ts test/src/lib/offline/classroom/bootstrap.test.ts test/src/lib/offline/sqlite/legacyImport.test.ts
```

Expected: all focused tests pass.

- [x] **Step 5: Commit.**

```powershell
git add frontend/src/lib/offline/classroom/repository.ts frontend/src/lib/offline/sqlite/legacyImport.ts frontend/test/src/lib/offline/classroom/repository.test.ts
git commit -m "fix: keep legacy classroom writes transactional"
```

### Task 3: Implement real IndexedDB transactions

**Files:**
- Modify: `frontend/src/lib/offline/classroom/store.ts:70-170`
- Test: `frontend/test/src/lib/offline/classroom/indexeddb-contract.test.ts`
- Test: `frontend/test/src/lib/offline/classroom/store.test.ts`

**Interfaces:** `createIndexedDbStore(databaseName = OFFLINE_DB_NAME)` remains the factory. Its `transaction(stores, work)` opens one `readwrite` IndexedDB transaction over all requested stores and passes a scoped `OfflineStore` facade to `work`.

- [x] **Step 1: Add a failing IndexedDB contract test.** Extend the fake IndexedDB harness to record `database.transaction(stores, mode)` and assert a compound operation requests `{ stores: ['assignments', 'outbox'], mode: 'readwrite' }` once. The fake must resolve `get`, `getAll`, `put`, and `delete` requests and fire completion after the requests finish.

- [x] **Step 2: Run the focused contract test and verify it fails.**

```powershell
deno test --allow-read --allow-env --import-map=deno.json test/src/lib/offline/classroom/indexeddb-contract.test.ts
```

Expected: the current adapter records no transaction because its `transaction` method only calls `work()`.

- [x] **Step 3: Implement the adapter.** Keep standalone methods on short-lived one-store transactions. For compound transactions, open one database transaction, map each scoped operation to `transaction.objectStore(storeName)`, reject request/transaction/abort errors with `OfflineStorageError`, await completion, and close the database in `finally`. Preserve the database name, version, object-store key path, and upgrade logic.

- [x] **Step 4: Run adapter and repository tests.**

```powershell
deno test --allow-read --allow-env --import-map=deno.json test/src/lib/offline/classroom/indexeddb-contract.test.ts test/src/lib/offline/classroom/store.test.ts test/src/lib/offline/classroom/repository.test.ts
```

Expected: all pass, including the one-transaction assertion.

- [x] **Step 5: Commit.**

```powershell
git add frontend/src/lib/offline/classroom/store.ts frontend/test/src/lib/offline/classroom/indexeddb-contract.test.ts frontend/test/src/lib/offline/classroom/store.test.ts
git commit -m "feat: make IndexedDB classroom writes transactional"
```

### Task 4: Verify runtime fallback, bootstrap reload, and offline auth

**Files:**
- Modify: `frontend/src/lib/offline/sqlite/runtime.ts` only if capability classification is incomplete
- Test: `frontend/test/src/lib/offline/sqlite/runtime.test.ts`
- Test: `frontend/test/src/lib/offline/classroom/bootstrap.test.ts`
- Test: `frontend/test/src/lib/auth/offline-enrollment.test.ts`
- Test: `frontend/test/src/lib/auth/offline-unlock.test.ts`

- [x] **Step 1: Add regression coverage.** Test capability failure selecting an injected store, bootstrap followed by a new repository instance reading the classroom, generic SQLite failure remaining fatal, and Tauri selection remaining native. Existing auth tests continue to cover the shared storage contract used by the fallback.

- [x] **Step 2: Run focused fallback tests and verify the new cases fail before the wiring is complete.**

```powershell
deno test --allow-read --allow-env --import-map=deno.json test/src/lib/offline/sqlite/runtime.test.ts test/src/lib/offline/classroom/bootstrap.test.ts test/src/lib/auth/offline-enrollment.test.ts test/src/lib/auth/offline-unlock.test.ts
```

- [x] **Step 3: Keep runtime selection narrow.** Preserve SQLite first, fall back only for OPFS/cross-origin-isolation/non-durable capability errors, share the resolved store through `getApplicationStorage()`, and keep other failures visible.

- [x] **Step 4: Run the same focused command and expect all tests to pass.**

- [x] **Step 5: Commit.**

```powershell
git add frontend/src/lib/offline/sqlite/runtime.ts frontend/test/src/lib/offline/sqlite/runtime.test.ts frontend/test/src/lib/offline/classroom/bootstrap.test.ts frontend/test/src/lib/auth/offline-enrollment.test.ts frontend/test/src/lib/auth/offline-unlock.test.ts
git commit -m "test: verify IndexedDB classroom reload fallback"
```

### Task 5: Document and verify the complete feature

**Files:**
- Modify: `docs/offline-classroom.md`
- Modify: `docs/superpowers/specs/2026-10-18-indexeddb-classroom-fallback-design.md` only if implementation decisions differ

- [x] **Step 1: Document the final storage order.** State that SQLite/OPFS is preferred, IndexedDB is the durable browser fallback, existing `mathventure-classroom` records are preserved, and the UI reports browser-managed retention as best effort.

- [x] **Step 2: Run the frontend CI-equivalent checks.**

```powershell
npm run typecheck --prefix frontend
npm test --prefix frontend
npm run build --prefix frontend
```

Expected: typecheck and build exit 0; the complete test lane reports zero failures and includes the SQLite WASM/PWA assets.

- [x] **Step 3: Inspect the final diff.**

```powershell
git diff --check
git status --short
```

Keep `LICENSE.md`, generated directories, and unrelated user documents unstaged.

- [ ] **Step 4: Manually verify the running browser.** At `http://localhost:5173`, press `Ctrl+Shift+R`, load a classroom while online, go offline, reload, open the classroom, save a quiz/mutation, reload again, and confirm pending work remains for sync. This remains user-side verification because browser automation is unavailable in this workspace.

- [x] **Step 5: Commit docs/spec updates.**

```powershell
git add docs/offline-classroom.md docs/superpowers/specs/2026-10-18-indexeddb-classroom-fallback-design.md
git commit -m "docs: describe IndexedDB classroom fallback"
```
