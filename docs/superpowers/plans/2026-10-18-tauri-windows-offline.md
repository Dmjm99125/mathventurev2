# Windows Tauri Offline Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Windows-only Tauri 2 host with native SQLite transactions while preserving the existing web/PWA offline runtime and allowing browser best-effort storage when `persist()` is declined.

**Architecture:** Keep the existing `SqliteDatabase` repository boundary. Browser execution uses SQLite WASM in the OPFS worker; Tauri execution dynamically loads the SQL plugin for normal operations and uses Rust-managed SQLite connections for atomic transactions. Runtime selection occurs before platform-specific storage checks, and no domain code imports Tauri.

**Tech Stack:** React 19, TypeScript 5.9, Vite 6, Deno tests, SQLite WASM/OPFS, Tauri 2, `@tauri-apps/plugin-sql`, Rust, `rusqlite`, GitHub Actions, Windows NSIS.

## Global Constraints

- Work inline in the current worktree; do not create a git worktree.
- Preserve unrelated dirty files: `LICENSE.md`, `.tmp-shape-matching-build/`, `deno.lock`, `dev-dist/`, `docs/DepEd/`, existing unrelated plans, and `frontend/dev-dist/`.
- Keep the existing `SqliteDatabase` contract as the domain boundary.
- Never fall back to volatile memory in a production runtime.
- Browser `persist() === false` is best-effort storage, not a startup failure, when SQLite/OPFS health is durable.
- Tauri uses native SQLite at `sqlite:mathventure-app.sqlite3` and Windows-only packaging for this phase.
- Keep the TypeScript migration manifest canonical; do not duplicate classroom schema SQL manually in Rust.
- Keep the service-worker media IndexedDB/Cache Storage system isolated from classroom SQLite data on the web.
- Route all local application writes through the same repository and outbox transaction path in web and Tauri.
- Do not use focused tests, skipped tests, weakened assertions, swallowed failures, or disabled CI gates.
- Run targeted checks after each task and the complete relevant CI-equivalent gates before completion.
- Commit each coherent task with only files belonging to that task.

## File Map

Create:

- `frontend/src/lib/offline/sqlite/platform.ts` — safe Tauri-runtime detection without loading Tauri packages in browsers.
- `frontend/src/lib/offline/sqlite/sqlPlaceholders.ts` — tested `?` to `$n` SQLite placeholder normalization.
- `frontend/src/lib/offline/sqlite/tauriAdapter.ts` — native `SqliteDatabase` implementation with injected plugin/invoke dependencies.
- `frontend/src/lib/offline/tauriFreePlayOfflineClient.ts` — bundled-media offline client for Tauri.
- `frontend/test/src/lib/offline/sqlite/sqlPlaceholders.test.ts` — placeholder parser tests.
- `frontend/test/src/lib/offline/sqlite/tauriAdapter.test.ts` — native adapter tests with fakes.
- `frontend/test/src/lib/offline/tauriFreePlayOfflineClient.test.ts` — bundled-media client tests.
- `src-tauri/Cargo.toml` — native Tauri project dependencies.
- `src-tauri/Cargo.lock` — resolved Rust dependencies.
- `src-tauri/build.rs` — Tauri build script.
- `src-tauri/src/main.rs` — Windows Tauri binary entrypoint.
- `src-tauri/src/lib.rs` — Tauri builder, SQL plugin, managed state, and command registration.
- `src-tauri/src/db.rs` — native SQLite transaction bridge and Rust unit tests.
- `src-tauri/tauri.conf.json` — Tauri/Vite/Windows bundle configuration.
- `src-tauri/capabilities/default.json` — main-window SQL permissions.
- `src-tauri/icons/` — generated Windows bundle icons from the existing MathVenture icon.

Modify:

- `package.json`, `package-lock.json` — root Tauri CLI dependencies and scripts.
- `frontend/package.json`, `frontend/package-lock.json` — Tauri guest packages.
- `frontend/src/lib/offline/sqlite/adapter.ts` — storage-quality health type.
- `frontend/src/lib/offline/sqlite/runtime.ts` — browser best-effort behavior and Tauri selection.
- `frontend/src/lib/offline/sqlite/pwaAdapter.ts`, `workerProtocol.ts`, `sqlite.worker.ts` — health quality propagation.
- `frontend/src/lib/offline/sqlite/memoryAdapter.ts` — test health quality.
- `frontend/src/lib/offline/classroom/status.ts`, `useOfflineClassroom.ts` — best-effort storage state.
- `frontend/src/components/offline/OfflinePackPanel.tsx` — storage quality copy.
- `frontend/src/main.tsx` — browser-only service-worker registration.
- `frontend/src/lib/offline/freePlayOfflineClient.ts` — Tauri/web client selection.
- `frontend/vite.config.ts` — Tauri base path, target, and watch configuration.
- `.github/workflows/ci.yml` — blocking Windows Tauri job.
- `README.md`, `docs/offline-classroom.md` — setup and runtime documentation.

---

### Task 1: Add Tauri guest tooling and define storage-quality types

**Files:**
- Modify: `package.json`, create/update root `package-lock.json`
- Modify: `frontend/package.json`, `frontend/package-lock.json`
- Create: `frontend/src/lib/offline/sqlite/platform.ts`
- Modify: `frontend/src/lib/offline/sqlite/adapter.ts`
- Modify: `frontend/src/lib/offline/sqlite/memoryAdapter.ts`
- Test: `frontend/test/src/lib/offline/sqlite/platform.test.ts`

**Interfaces:**
- Produces `isTauriRuntime(): boolean`.
- Produces `SqliteStorageQuality = 'persistent' | 'best-effort' | 'native' | 'unknown'`.
- Extends `SqliteDatabase.health()` to return `{ schemaVersion: number; durable: boolean; quality: SqliteStorageQuality }`.

- [ ] **Step 1: Add exact frontend and root dependencies.**

Run from the repository root:

```powershell
npm.cmd install --save-dev --save-exact @tauri-apps/cli@2.9.6
npm.cmd install --prefix frontend --save-exact @tauri-apps/api@2.9.1 @tauri-apps/plugin-sql@2.3.1
```

Add these root scripts without changing the existing web scripts:

```json
"tauri:dev": "tauri dev",
"tauri:build": "tauri build",
"tauri:info": "tauri info"
```

- [ ] **Step 2: Write the failing platform and health-type tests.**

```ts
import { assertEquals } from 'jsr:@std/assert';
import { isTauriRuntime } from '../../../../../src/lib/offline/sqlite/platform.ts';

Deno.test('ordinary test runtime is not detected as Tauri', () => {
  assertEquals(isTauriRuntime(), false);
});
```

Update the existing health fixtures so every result declares `quality: 'unknown'` for the memory adapter.

- [ ] **Step 3: Run the focused test and verify the missing module/type failure.**

Run:

```powershell
deno test --allow-read --config frontend/deno.json frontend/test/src/lib/offline/sqlite/platform.test.ts
```

Expected: FAIL because `platform.ts` and the new health shape are not implemented.

- [ ] **Step 4: Implement safe runtime detection and the health type.**

Use a guarded global check; do not reference `window.__TAURI_INTERNALS__` without checking that `window` exists:

```ts
export function isTauriRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  return '__TAURI_INTERNALS__' in window;
}
```

Define the quality union in `adapter.ts`, update `EMPTY_SQLITE_HEALTH`, and update the memory adapter to return `quality: 'unknown'` while retaining `durable: false`.

- [ ] **Step 5: Run the focused test and frontend typecheck.**

Run:

```powershell
deno test --allow-read --config frontend/deno.json frontend/test/src/lib/offline/sqlite/platform.test.ts
npm.cmd run typecheck --prefix frontend
```

Expected: PASS and exit code 0.

- [ ] **Step 6: Commit.**

```powershell
git add package.json package-lock.json frontend/package.json frontend/package-lock.json frontend/src/lib/offline/sqlite/platform.ts frontend/src/lib/offline/sqlite/adapter.ts frontend/src/lib/offline/sqlite/memoryAdapter.ts frontend/test/src/lib/offline/sqlite/platform.test.ts
git commit -m "build: add Windows Tauri guest tooling"
```

### Task 2: Allow browser best-effort persistence without unsafe fallback

**Files:**
- Modify: `frontend/src/lib/offline/sqlite/runtime.ts`
- Modify: `frontend/src/lib/offline/sqlite/pwaAdapter.ts`
- Modify: `frontend/src/lib/offline/sqlite/workerProtocol.ts`
- Modify: `frontend/src/lib/offline/sqlite/sqlite.worker.ts`
- Modify: `frontend/src/lib/offline/classroom/status.ts`
- Modify: `frontend/src/lib/offline/classroom/useOfflineClassroom.ts`
- Modify: `frontend/src/components/offline/OfflinePackPanel.tsx`
- Test: `frontend/test/src/lib/offline/sqlite/runtime.test.ts`
- Test: `frontend/test/src/lib/offline/classroom/status.test.ts`

**Interfaces:**
- `openApplicationDatabase()` calls a factory with `{ quality: SqliteStorageQuality }` when the factory accepts the optional context.
- The runtime defines a `validateOpenedDatabase(database)` helper that runs migrations, checks `health.durable`, and closes the database if validation fails.
- Browser PWA health reports `quality: 'persistent'` after a successful persistence grant and `quality: 'best-effort'` after a denied/missing grant.
- `OfflineLifecycleState.storage` accepts `'healthy' | 'best-effort' | 'unavailable' | 'unknown'`.

- [ ] **Step 1: Replace the persistence-denial test with a failing best-effort test.**

Change the existing test so the factory is called when persistence is denied:

```ts
Deno.test('runtime opens durable SQLite when the browser declines persistent-storage protection', async () => {
  let receivedQuality: string | undefined;
  const memory = await createMemorySqlite();
  const database = await openApplicationDatabase({
    storage: { persist: async () => false },
    databaseFactory: async ({ quality }) => {
      receivedQuality = quality;
      return {
        ...memory,
        health: async () => ({ schemaVersion: 1, durable: true, quality }),
      };
    },
  });

  assertEquals(receivedQuality, 'best-effort');
  assertEquals((await database.health()).durable, true);
});
```

Add a second test proving that a durable-health failure still rejects and that the factory is closed when necessary.

- [ ] **Step 2: Run the focused runtime tests to verify the old gate fails.**

Run:

```powershell
deno test --allow-read --config frontend/deno.json frontend/test/src/lib/offline/sqlite/runtime.test.ts
```

Expected: FAIL because the current runtime rejects `persist() === false` before opening SQLite.

- [ ] **Step 3: Implement the quality-aware browser path.**

The runtime must calculate quality without treating a denied request as fatal:

```ts
const granted = storage.persist
  ? await storage.persist()
  : storage.persisted
    ? await storage.persisted()
    : false;
const quality: SqliteStorageQuality = granted ? 'persistent' : 'best-effort';
const database = await databaseFactory({ quality });
```

Keep the existing hard failures for no storage manager, adapter creation errors, `health.durable === false`, and migration/OPFS errors. Update the PWA adapter/worker response health type and `OfflinePackPanel` text so best-effort storage reads as “ready; browser-managed retention” rather than “unavailable.”

- [ ] **Step 4: Wire provider state from database health.**

After the provider opens the database, read its health and dispatch:

```ts
dispatch({
  type: 'storage-health',
  storage: health.quality === 'best-effort' ? 'best-effort' : 'healthy',
});
```

Keep the blocking error screen for actual storage failures. Do not dispatch `healthy` before `health.durable` has passed.

- [ ] **Step 5: Add reducer/UI tests and run targeted checks.**

Test that `storage-health` accepts `best-effort` and that `OfflinePackPanel` renders browser-managed retention copy. Run:

```powershell
deno test --allow-read --config frontend/deno.json frontend/test/src/lib/offline/sqlite/runtime.test.ts frontend/test/src/lib/offline/classroom/status.test.ts
npm.cmd run typecheck --prefix frontend
```

Expected: PASS and exit code 0.

- [ ] **Step 6: Commit.**

```powershell
git add frontend/src/lib/offline/sqlite/runtime.ts frontend/src/lib/offline/sqlite/pwaAdapter.ts frontend/src/lib/offline/sqlite/workerProtocol.ts frontend/src/lib/offline/sqlite/sqlite.worker.ts frontend/src/lib/offline/classroom/status.ts frontend/src/lib/offline/classroom/useOfflineClassroom.ts frontend/src/components/offline/OfflinePackPanel.tsx frontend/test/src/lib/offline/sqlite/runtime.test.ts frontend/test/src/lib/offline/classroom/status.test.ts
git commit -m "fix: allow browser best-effort offline storage"
```

### Task 3: Build and test the Tauri TypeScript SQLite adapter

**Files:**
- Create: `frontend/src/lib/offline/sqlite/sqlPlaceholders.ts`
- Create: `frontend/src/lib/offline/sqlite/tauriAdapter.ts`
- Create: `frontend/test/src/lib/offline/sqlite/sqlPlaceholders.test.ts`
- Create: `frontend/test/src/lib/offline/sqlite/tauriAdapter.test.ts`

**Interfaces:**
- `normalizeSqlitePlaceholders(sql: string): string` preserves quoted/comment `?` characters and converts executable placeholders to `$1`, `$2`, and so on.
- `createTauriSqliteDatabase(options?: TauriSqliteAdapterOptions): Promise<SqliteDatabase>`.
- `TauriSqliteAdapterOptions` injects `loadDatabase`, `invoke`, `databasePath`, and `idFactory` for deterministic tests.
- Native transaction commands use `sqlite_begin_transaction`, `sqlite_query_transaction`, `sqlite_execute_transaction`, `sqlite_commit_transaction`, and `sqlite_rollback_transaction`.

- [ ] **Step 1: Write placeholder tests before implementation.**

```ts
import { assertEquals } from 'jsr:@std/assert';
import { normalizeSqlitePlaceholders } from '../../../../../src/lib/offline/sqlite/sqlPlaceholders.ts';

Deno.test('normalizes executable question-mark placeholders', () => {
  assertEquals(
    normalizeSqlitePlaceholders('select * from users where id = ? and role = ?'),
    'select * from users where id = $1 and role = $2',
  );
});

Deno.test('preserves question marks in strings and comments', () => {
  assertEquals(
    normalizeSqlitePlaceholders("select '?' as literal /* ? */ from users where id = ? -- ?"),
    "select '?' as literal /* ? */ from users where id = $1 -- ?",
  );
});
```

- [ ] **Step 2: Run the placeholder test and verify the missing-module failure.**

Run:

```powershell
deno test --allow-read --config frontend/deno.json frontend/test/src/lib/offline/sqlite/sqlPlaceholders.test.ts
```

Expected: FAIL because the normalizer module does not exist.

- [ ] **Step 3: Implement the SQL scanner.**

Implement a single-pass scanner with states for normal SQL, single-quoted strings, double-quoted identifiers, backtick identifiers, line comments, and block comments. Only a `?` in normal SQL increments the parameter index and becomes `$<index>`.

- [ ] **Step 4: Write adapter tests using injected fakes.**

The fake plugin must record normalized SQL and return deterministic rows. The fake invoke function must record transaction command names and transaction IDs. Cover:

```ts
Deno.test('Tauri adapter delegates normal query and execute calls', async () => {
  const calls: string[] = [];
  const database = await createTauriSqliteDatabase({
    loadDatabase: async () => ({
      select: async () => [{ value: 1 }],
      execute: async () => { calls.push('execute'); },
      close: async () => true,
    }),
    invoke: async () => undefined,
  });

  assertEquals(await database.query('select ? as value', [1]), [{ value: 1 }]);
  await database.execute('delete from values where id = ?', ['one']);
  assertEquals(calls, ['execute']);
});

Deno.test('Tauri adapter rolls back the Rust transaction after callback failure', async () => {
  const commands: string[] = [];
  const database = await createTauriSqliteDatabase({
    loadDatabase: async () => ({ select: async () => [], execute: async () => {}, close: async () => true }),
    invoke: async (command) => { commands.push(command); return undefined; },
  });

  await assertRejects(() => database.transaction(async (tx) => {
    await tx.execute('insert into app_meta(key, value) values (?, ?)', ['one', '1']);
    throw new Error('abort');
  }));
  assertEquals(commands, ['sqlite_begin_transaction', 'sqlite_execute_transaction', 'sqlite_rollback_transaction']);
});
```

- [ ] **Step 5: Run adapter tests and verify they fail before implementation.**

Run:

```powershell
deno test --allow-read --config frontend/deno.json frontend/test/src/lib/offline/sqlite/tauriAdapter.test.ts
```

Expected: FAIL because `tauriAdapter.ts` does not exist.

- [ ] **Step 6: Implement the adapter.**

Use dynamic imports for default dependencies:

```ts
async function defaultLoadDatabase(path: string): Promise<TauriDatabaseLike> {
  const { default: Database } = await import('@tauri-apps/plugin-sql');
  return Database.load(path);
}

async function defaultInvoke<T>(command: string, args: Record<string, unknown>): Promise<T> {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<T>(command, args);
}
```

Serialize all non-transaction operations through a promise queue. During `transaction()`, hold the queue lock, generate a transaction ID, invoke begin, route `tx.query/execute` to transaction commands, commit on success, and rollback on every failure before rethrowing the original error. `close()` must close the plugin database and reject/rollback any active transaction state.

- [ ] **Step 7: Run focused adapter tests, typecheck, and commit.**

Run:

```powershell
deno test --allow-read --config frontend/deno.json frontend/test/src/lib/offline/sqlite/sqlPlaceholders.test.ts frontend/test/src/lib/offline/sqlite/tauriAdapter.test.ts
npm.cmd run typecheck --prefix frontend
```

Expected: PASS and exit code 0.

```powershell
git add frontend/src/lib/offline/sqlite/sqlPlaceholders.ts frontend/src/lib/offline/sqlite/tauriAdapter.ts frontend/test/src/lib/offline/sqlite/sqlPlaceholders.test.ts frontend/test/src/lib/offline/sqlite/tauriAdapter.test.ts
git commit -m "feat: add native Tauri SQLite adapter"
```

### Task 4: Scaffold the Rust Tauri host and transaction bridge

**Files:**
- Create: `src-tauri/Cargo.toml`, `src-tauri/build.rs`, `src-tauri/src/main.rs`, `src-tauri/src/lib.rs`, `src-tauri/src/db.rs`
- Create: `src-tauri/tauri.conf.json`, `src-tauri/capabilities/default.json`
- Create: `src-tauri/Cargo.lock`
- Test: Rust unit tests in `src-tauri/src/db.rs`

**Interfaces:**
- Rust managed state owns `PathBuf` database path and `HashMap<String, rusqlite::Connection>` active transactions.
- Commands accept JSON-safe SQL parameters and return structured `Result<T, String>` errors.
- `run()` registers the SQL plugin and all five transaction commands.

- [ ] **Step 1: Write Rust unit tests for the bridge behavior.**

Add tests inside `db.rs` before the implementation for:

```rust
#[test]
fn failed_transaction_rolls_back_entity_and_outbox_writes() {
    let path = test_database_path("rollback");
    let state = SqliteState::new(path.clone());
    begin_transaction(&state, "tx-1".into()).unwrap();
    execute_transaction(&state, "tx-1".into(), "create table values_table(id text primary key)".into(), vec![]).unwrap();
    rollback_transaction(&state, "tx-1".into()).unwrap();
    let connection = rusqlite::Connection::open(path).unwrap();
    assert!(connection.prepare("select * from values_table").is_err());
}
```

Use a unique `std::env::temp_dir()` database path per test process and delete it after each test. Add tests for commit persistence, missing transaction IDs, null/string/number/blob parameter conversion, and row-to-JSON conversion.

- [ ] **Step 2: Run Rust tests to record the unavailable-toolchain state.**

Run:

```powershell
cargo test --manifest-path src-tauri/Cargo.toml
```

Expected before scaffolding: FAIL because the manifest does not exist. If `cargo` is unavailable on the current machine, record that local Rust verification is blocked and continue; the Windows CI lane will run the same check after the scaffold exists.

- [ ] **Step 3: Add the Tauri manifest and dependencies.**

Use a Tauri 2 library/bin layout with `tauri`, `tauri-build`, `tauri-plugin-sql` with the `sqlite` feature, `rusqlite` with the `bundled` feature, `serde`, `serde_json`, and `thiserror`. Keep the library crate name distinct from the binary name to avoid Windows linker collisions.

- [ ] **Step 4: Implement `db.rs`.**

Implement:

```rust
pub struct SqliteState {
    pub db_path: PathBuf,
    pub transactions: Mutex<HashMap<String, Connection>>,
}

#[tauri::command]
pub fn sqlite_begin_transaction(state: State<'_, SqliteState>, transaction_id: String) -> Result<(), String>;
#[tauri::command]
pub fn sqlite_query_transaction(state: State<'_, SqliteState>, transaction_id: String, sql: String, params: Vec<serde_json::Value>) -> Result<Vec<serde_json::Map<String, serde_json::Value>>, String>;
#[tauri::command]
pub fn sqlite_execute_transaction(state: State<'_, SqliteState>, transaction_id: String, sql: String, params: Vec<serde_json::Value>) -> Result<(), String>;
#[tauri::command]
pub fn sqlite_commit_transaction(state: State<'_, SqliteState>, transaction_id: String) -> Result<(), String>;
#[tauri::command]
pub fn sqlite_rollback_transaction(state: State<'_, SqliteState>, transaction_id: String) -> Result<(), String>;
```

Open the dedicated connection against `SqliteState.db_path`, execute `PRAGMA foreign_keys = ON`, and start `BEGIN IMMEDIATE`. Convert JSON values to `rusqlite::types::Value`; encode blobs as an explicit `{ "__mathventure_type": "bytes", "base64": "..." }` object. Return column-name keyed JSON maps and structured error messages without leaking passwords or database contents.

- [ ] **Step 5: Implement `lib.rs`, `main.rs`, and capabilities.**

At setup, resolve `app.path().app_config_dir().join("mathventure-app.sqlite3")`, create the directory, manage `SqliteState`, and register:

```rust
tauri::generate_handler![
    db::sqlite_begin_transaction,
    db::sqlite_query_transaction,
    db::sqlite_execute_transaction,
    db::sqlite_commit_transaction,
    db::sqlite_rollback_transaction,
]
```

Register `tauri_plugin_sql::Builder::default().build()` without a duplicated Rust migration list. Add the SQL plugin default permission to `capabilities/default.json` for the main window.

- [ ] **Step 6: Run Rust formatting/tests and commit the native host.**

Run:

```powershell
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
```

Expected with Rust installed: formatting clean, unit tests PASS, clippy exit 0. If Rust remains unavailable locally, run the web checks and leave the native commands explicitly unverified.

```powershell
git add src-tauri
git commit -m "feat: add Rust Tauri transaction bridge"
```

### Task 5: Select the native runtime and package bundled offline media

**Files:**
- Modify: `frontend/src/lib/offline/sqlite/runtime.ts`, `frontend/src/lib/offline/sqlite/tauriAdapter.ts`, `frontend/src/main.tsx`, `frontend/vite.config.ts`, `frontend/src/lib/offline/freePlayOfflineClient.ts`
- Create: `frontend/src/lib/offline/tauriFreePlayOfflineClient.ts`
- Test: `frontend/test/src/lib/offline/sqlite/runtime.test.ts`, `frontend/test/src/lib/offline/tauriFreePlayOfflineClient.test.ts`

**Interfaces:**
- Tauri opens native SQLite before any browser `StorageManager` checks and validates the same TypeScript migration manifest.
- Browser runtime keeps the existing PWA adapter and best-effort storage behavior.
- Tauri free play reads the packaged media manifest and files without service workers, Cache Storage, or IndexedDB.

- [ ] **Step 1: Add failing runtime-selection and bundled-media tests.**

Cover these cases:

```ts
Deno.test('Tauri runtime bypasses browser persistence checks', async () => {
  const database = await openApplicationDatabase({
    runtime: 'tauri',
    databaseFactory: async ({ quality }) => fakeDurableDatabase({ quality }),
    storage: { persist: async () => { throw new Error('must not be called'); } },
  });
  assertEquals((await database.health()).quality, 'native');
});

Deno.test('bundled media client becomes ready from the packaged manifest', async () => {
  const client = createTauriFreePlayOfflineClient({
    fetchManifest: async () => ({ version: 1, files: ['assets/free-play/a.json'] }),
    fetchAsset: async (path) => new Response(`asset:${path}`),
  });
  await client.prepare();
  assertEquals(client.getStatus().state, 'ready');
});
```

- [ ] **Step 2: Run the new focused tests and verify they fail before implementation.**

Run:

```powershell
deno test --allow-read --config frontend/deno.json frontend/test/src/lib/offline/sqlite/runtime.test.ts frontend/test/src/lib/offline/tauriFreePlayOfflineClient.test.ts
```

Expected: FAIL because native runtime selection and the bundled-media client do not exist yet.

- [ ] **Step 3: Implement native runtime selection and migration bootstrap.**

Update `openApplicationDatabase()` to select the adapter before browser storage access:

```ts
if (isTauriRuntime() || options.runtime === 'tauri') {
  const database = await (options.databaseFactory ?? (() => createTauriSqliteDatabase()))({ quality: 'native' });
  return validateOpenedDatabase(database);
}
```

Keep `validateOpenedDatabase(database)` as the single path for running the canonical migration manifest, checking durable health, and closing on failure. The Tauri factory loads `sqlite:mathventure-app.sqlite3`, creates `schema_migrations` if needed, applies missing migrations inside the native transaction bridge, and records each migration only after its transaction commits. Native health returns `{ durable: true, quality: 'native' }`.

- [ ] **Step 4: Make Vite and service-worker behavior Tauri-safe.**

Use a relative asset base in Tauri and the existing web base otherwise. Keep the web PWA plugin enabled for web builds, but use `TAURI_ENV_PLATFORM` to avoid registering or building a service worker for Tauri. Preserve the existing target and port settings, set `clearScreen: false`, and ignore `../src-tauri/**` in Vite watch configuration. Register the service worker only when `isTauriRuntime()` is false:

```ts
if (!isTauriRuntime()) {
  registerSW({ immediate: true });
}
```

- [ ] **Step 5: Implement the packaged-media free-play client.**

Create `tauriFreePlayOfflineClient.ts` with the same public client shape used by the existing free-play screen. Resolve `free-play-media-manifest.json` against `document.baseURI`, fetch packaged assets using relative URLs, expose `ready`/`error` status, and make refresh/download controls deterministic no-ops because the assets are already bundled. Update `freePlayOfflineClient.ts` to choose this client in Tauri and the service-worker client in web builds.

- [ ] **Step 6: Run targeted frontend checks and commit.**

Run:

```powershell
deno test --allow-read --config frontend/deno.json frontend/test/src/lib/offline/sqlite/runtime.test.ts frontend/test/src/lib/offline/tauriFreePlayOfflineClient.test.ts
npm.cmd run typecheck --prefix frontend
npm.cmd run build --prefix frontend
```

Expected: PASS, with the web build still producing the PWA assets. Commit:

```powershell
git add frontend/src/lib/offline/sqlite/runtime.ts frontend/src/lib/offline/sqlite/tauriAdapter.ts frontend/src/main.tsx frontend/vite.config.ts frontend/src/lib/offline/freePlayOfflineClient.ts frontend/src/lib/offline/tauriFreePlayOfflineClient.ts frontend/test/src/lib/offline/sqlite/runtime.test.ts frontend/test/src/lib/offline/tauriFreePlayOfflineClient.test.ts
git commit -m "feat: wire Tauri runtime and bundled offline media"
```

### Task 6: Add Windows packaging and blocking CI coverage

**Files:**
- Create/modify: `src-tauri/tauri.conf.json`, `src-tauri/capabilities/default.json`, `src-tauri/icons/`, `.github/workflows/ci.yml`
- Modify: `README.md`, `docs/offline-classroom.md`
- Test: existing frontend PWA/config tests plus the Windows build job

**Interfaces:**
- `npm run tauri:dev` starts the Windows Tauri host.
- `npm run tauri:build -- --debug` produces a Windows debug bundle without changing the web build.
- GitHub Actions runs the native lane as a blocking job, not an advisory job.

- [ ] **Step 1: Write configuration assertions before adding the config.**

Add or extend a config test to assert that Tauri uses `frontend/dist` as `frontendDist`, `frontend/dev` as `devUrl`, `beforeDevCommand` and `beforeBuildCommand` invoke the frontend scripts, the bundle targets Windows NSIS, and the SQL capability is present.

- [ ] **Step 2: Add the Tauri configuration and icons.**

Configure the application identifier, window, security capability, Vite dev URL, static frontend directory, Windows NSIS target, and packaged media. Generate the required `.ico`/PNG icon set from the existing project icon without changing web assets. Keep the database in Tauri's app config directory so updates do not overwrite user data.

- [ ] **Step 3: Add the blocking Windows CI job.**

Add a `windows-tauri` job using `windows-latest`, Node 22, Rust stable, and lockfile-backed dependency setup. Run frontend typecheck/tests/build, `cargo fmt --check`, `cargo test`, `cargo clippy --all-targets -- -D warnings`, and `npm.cmd run tauri:build -- --debug`. Keep command output visible and upload Tauri build logs or artifacts only on failure without making artifact collection a second failure.

- [ ] **Step 4: Document both supported runtimes.**

Document web development/build commands, Windows Tauri prerequisites, native database location, the best-effort browser storage message, and the fact that Tauri ships free-play media while web continues to use the PWA cache/media path. Include the first-run behavior after an interrupted transaction and the supported Windows-only scope.

- [ ] **Step 5: Run configuration checks and commit.**

Run:

```powershell
git diff --check
npm.cmd run typecheck --prefix frontend
npm.cmd run build --prefix frontend
```

Commit:

```powershell
git add src-tauri/tauri.conf.json src-tauri/capabilities/default.json src-tauri/icons .github/workflows/ci.yml README.md docs/offline-classroom.md
git commit -m "ci: verify Windows Tauri packaging"
```

### Task 7: Run the complete local release gates

- [ ] **Step 1: Run the complete web gates from a clean dependency state.**

Run:

```powershell
npm.cmd run typecheck --prefix frontend
npm.cmd test --prefix frontend
npm.cmd run build --prefix frontend
deno test --allow-env --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen test/supabase
```

Run the Rust gates when the Rust toolchain is available:

```powershell
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
npm.cmd run tauri:build -- --debug
```

If Rust is unavailable locally, report those native checks as unverified and rely on the blocking Windows CI job rather than claiming the native build passed.

- [ ] **Step 2: Inspect the final diff and repository state.**

Run:

```powershell
git diff --check
git status --short
git log --oneline -8
```

Review that only the intended Tauri/offline files are in the task commits, unrelated dirty files remain untouched, no service-worker code is loaded in Tauri, no browser persistence denial blocks durable OPFS, and all write paths still use the entity-plus-outbox transaction boundary.

- [ ] **Step 3: Hand off with exact verification status.**

Report the commits, web verification output, native verification output, and any unavailable local toolchain or remote CI limitation. Do not mark the task complete until all required local checks have fresh output or the remaining limitation is explicitly identified.
