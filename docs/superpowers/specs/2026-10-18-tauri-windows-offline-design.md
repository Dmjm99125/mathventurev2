# Windows Tauri Offline Runtime Design

**Date:** 2026-10-18  
**Status:** Approved in conversation; awaiting written-spec review  
**Related design:** `docs/superpowers/specs/2026-10-16-offline-first-sqlite-design.md`

## Goal

Make the existing offline-first MathVenture application run as a Windows-only Tauri 2 desktop app without changing its domain, repository, synchronization, or authentication behavior. The hosted web application must continue to work, including its PWA shell, browser SQLite/OPFS storage, service-worker media cache, and existing online flows.

The Tauri application will use the same React/Vite frontend and the same canonical SQLite schema. Its application data will live in a native SQLite file instead of browser OPFS. The app must remain useful offline after the same one-time online classroom provisioning flow, and local writes must preserve the existing atomic entity-plus-outbox behavior.

## Scope

### In scope

- Tauri 2 Windows desktop scaffold under `src-tauri/`.
- Tauri development and Windows installer commands.
- Native SQLite adapter implementing the existing `SqliteDatabase` contract.
- Runtime selection between browser SQLite/WASM and native Tauri SQLite.
- Atomic native transactions through a small Rust command bridge.
- Reuse of the existing TypeScript migration manifest.
- Browser storage behavior that tolerates a denied `navigator.storage.persist()` request when OPFS itself is available.
- Tauri-safe asset paths, app startup, and offline media behavior.
- Frontend, Rust, and CI verification.
- Documentation for Windows setup and the distinction between web and Tauri storage.

### Out of scope

- macOS, Linux, mobile, or Android/iOS packaging.
- Rewriting domain logic, repository logic, Supabase functions, or the sync protocol.
- Replacing the existing browser SQLite worker.
- Adding a second authentication model for desktop.
- Native background sync, system tray behavior, auto-update, deep links, or native classroom features.
- Moving Free Play media into a separate native download manager in this phase.

## Architecture decision

Keep a single domain-facing storage boundary:

```text
React UI / React Query / games
                |
        offline repository and sync
                |
          SqliteDatabase contract
             /              \
  Browser/PWA runtime       Tauri Windows runtime
  SQLite WASM + OPFS        SQL plugin + Rust transactions
```

No React component, query hook, or classroom repository may import Tauri APIs, access OPFS directly, open SQLite handles, or query Supabase tables directly. The runtime layer owns platform selection and returns the same `SqliteDatabase` interface to the rest of the application.

The browser path remains the current dedicated SQLite WASM worker backed by OPFS. The Tauri path is loaded only when the Tauri runtime is detected, so browser execution does not require Tauri globals or invoke commands that do not exist on the web.

## Runtime selection and storage policy

### Tauri detection

Add a small runtime predicate in the platform/storage layer. It must safely return `false` during SSR-like tooling, Deno tests, ordinary browser execution, and Vite preview. It must not import Tauri packages as a side effect of evaluating the web runtime path.

`openApplicationDatabase()` will select the native adapter before attempting any browser storage checks:

1. If Tauri is active, open the native SQLite adapter and skip `navigator.storage` checks.
2. Otherwise, obtain the browser storage manager and open the PWA adapter.
3. Require the resulting adapter health check to report an actual durable database.
4. Never fall back to the in-memory adapter in a production runtime.

### Browser persistence request

The current implementation treats `navigator.storage.persist() === false` as a fatal startup error. That behavior is too strict for a normal web tab: the browser may decline persistent-storage protection even when SQLite/OPFS is available and usable.

Change the browser path so that:

- a missing storage manager, unavailable OPFS, failed SQLite initialization, failed migration, or non-durable health result remains a blocking storage error;
- a `persist()` result of `false` is recorded as browser-managed or best-effort storage, but does not block the app if the PWA SQLite adapter opens successfully;
- no volatile-memory fallback is introduced;
- the offline pack UI distinguishes unavailable storage from best-effort browser storage;
- the UI explains that installing the PWA may improve storage retention, without implying that a browser permission prompt must appear.

Extend the storage health model with an explicit quality value, such as `persistent`, `best-effort`, or `native`, while retaining the existing `durable` boolean for the production safety check. Native Tauri storage reports `native`; OPFS with a successful persistence grant reports `persistent`; OPFS without that grant reports `best-effort`.

## Native SQLite adapter

Create `frontend/src/lib/offline/sqlite/tauriAdapter.ts` with a factory matching the existing adapter boundary. The adapter must expose:

- `query<T>()`;
- `execute()`;
- `transaction()`;
- `health()`;
- `close()`.

### Normal operations

Use `@tauri-apps/plugin-sql` for normal database loading, selects, executes, and closing. The connection string is `sqlite:mathventure-app.sqlite3`. The SQL plugin stores relative SQLite files in the Tauri app configuration directory, giving each Windows installation a per-user native database.

The adapter will dynamically import the plugin from the Tauri-only path. The web build may emit a lazy chunk for this path, but web execution must never load or call it.

The existing repository SQL uses positional `?` placeholders. The SQL plugin expects SQLite `$1`, `$2`, and similar placeholders. Add a tested SQL placeholder normalizer that rewrites only unquoted, non-comment `?` placeholders and preserves literal question marks, quoted strings, and comments. The normalizer must preserve parameter order and reject malformed parameter counts rather than silently binding the wrong values.

### Atomic transactions

The SQL plugin exposes normal query/execute operations but does not provide the transaction semantics required by the repository. In particular, issuing `BEGIN`, multiple execute calls, and `COMMIT` through a pooled API cannot guarantee that every statement uses one SQLite connection.

Add a small Rust transaction bridge in `src-tauri/src/`:

- `sqlite_begin_transaction(transaction_id)` opens a dedicated SQLite connection to the configured app database and starts `BEGIN IMMEDIATE`;
- `sqlite_query_transaction(transaction_id, sql, params)` queries that connection;
- `sqlite_execute_transaction(transaction_id, sql, params)` executes on that connection;
- `sqlite_commit_transaction(transaction_id)` commits and removes the connection;
- `sqlite_rollback_transaction(transaction_id)` rolls back and removes the connection.

Rust owns the transaction connections in managed application state keyed by transaction ID. The frontend never receives a native connection or file handle. Rust must roll back and discard any transaction that errors. App shutdown must roll back all active transactions before exit.

The frontend adapter serializes database operations through an adapter-level mutex. A transaction holds the mutex for the entire callback, so normal plugin queries cannot interleave with the dedicated Rust transaction connection. Inside the callback, `tx.query()` and `tx.execute()` invoke the transaction-specific Rust commands directly.

The bridge accepts the adapter's JSON-safe value model. `null`, strings, numbers, and blobs must be converted explicitly; `Uint8Array` values must use a documented byte encoding at the Tauri boundary and be restored to `Uint8Array` on the frontend.

The Rust layer contains only database plumbing, value conversion, transaction lifecycle, and health/error reporting. It must not contain classroom, authentication, sync, or UI business rules.

## Schema and migrations

The TypeScript migration manifest in `frontend/src/lib/offline/sqlite/migrations.ts` remains the canonical schema source for both runtimes. It must not be duplicated manually in Rust.

Native startup will:

1. load or create `sqlite:mathventure-app.sqlite3` through the SQL plugin;
2. ensure `schema_migrations` exists;
3. read applied migration versions;
4. apply missing TypeScript migration statements through the Rust transaction bridge in version order;
5. record each migration only after its statements commit;
6. return native health with the current schema version and `durable: true`.

Migration statements remain idempotent. A failed migration must roll back and prevent the application repository from opening against a partially applied schema.

## Tauri project and Windows packaging

Add a Tauri 2 project under `src-tauri/` with:

- `Cargo.toml` for Tauri, the SQL plugin with SQLite support, and the Rust SQLite transaction bridge;
- `src/lib.rs` and the Windows entrypoint generated for Tauri 2;
- `tauri.conf.json` with the existing root Vite commands;
- `capabilities/default.json` granting the SQL plugin permissions needed by the main window;
- Windows NSIS bundling configuration;
- icons derived from the existing MathVenture icon assets;
- a generated `Cargo.lock` committed with the native project.

The Tauri configuration will use:

- `beforeDevCommand`: the existing root frontend dev script;
- `devUrl`: `http://localhost:5173`;
- `beforeBuildCommand`: the existing root frontend build script;
- `frontendDist`: `../frontend/dist` relative to `src-tauri`;
- a Windows-appropriate WebView/Vite build target;
- a Tauri-specific relative asset base for packaged builds while retaining `/` for hosted web builds.

Add root/frontend scripts that make the workflows explicit without changing existing web commands:

- `tauri:dev`;
- `tauri:build`;
- `tauri:info` for local setup diagnostics.

The README will document Node/npm, Rust, the Tauri CLI, WebView2, Supabase environment variables, and the Windows commands. It will state that the current CI/local web gates remain required even when Tauri is being developed.

## PWA, shell, and media behavior

The hosted web build keeps the current service-worker registration, application-shell precache, Cache Storage media cache, and media metadata IndexedDB database.

The Tauri build skips service-worker registration because its application shell is already packaged locally. Vite still emits the static application assets and media manifest. The existing media files are included in the Windows bundle, so Free Play assets are available without a network connection immediately after installation.

The Free Play offline client gains a Tauri branch that reports bundled media as ready, supports the existing status shape, and does not attempt browser Cache Storage or service-worker messaging. Browser behavior remains unchanged. Free Play user progress and authenticated completion records continue to use the shared SQLite repository and sync outbox.

## Application behavior

The Tauri app follows the same product lifecycle as the PWA:

1. first online teacher login and device enrollment;
2. classroom-pack bootstrap and local persistence;
3. offline session unlock while the seven-day lease is valid;
4. local-first reads and mutations while offline or online;
5. eager or manual synchronization when coverage returns;
6. explicit conflicts, failed operations, diagnostics, and lease-expiry handling.

No Tauri-specific domain branch may bypass the repository or send a direct online mutation. The native storage adapter only changes where the same application data is persisted.

## Testing and CI

### Frontend tests

Add or update tests for:

- runtime selection in browser and Tauri environments;
- browser startup when `persist()` returns `false` but OPFS health is durable;
- blocking errors for missing storage, failed SQLite startup, failed migration, and non-durable adapters;
- best-effort storage status rendering;
- Tauri adapter query/execute delegation through injected plugin fakes;
- placeholder normalization, including literals and comments;
- transaction command correlation, commit, rollback, and adapter serialization;
- Tauri media client behavior;
- preservation of all existing SQLite, classroom, auth, sync, quiz, reports, and PWA tests.

### Rust tests and checks

Add unit tests for:

- transaction-state creation and cleanup;
- rollback after a failed statement;
- commit persistence;
- parameter conversion, including nulls, numbers, strings, and blobs;
- row conversion and structured errors;
- cleanup of active transactions on close.

Run:

```text
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
```

### Repository CI gates

Preserve the current frontend and Supabase blocking lanes:

```text
npm run typecheck --prefix frontend
timeout 110s npm test --prefix frontend
npm run build --prefix frontend
timeout 110s deno test --allow-env --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen test/supabase
```

Add a Windows Tauri lane that installs Node dependencies and Rust, runs the Rust checks, builds the frontend, and performs a debug Tauri build. The lane must surface the first failing command and must not convert native failures into advisory results. The first local verification may be blocked until Rust and the Windows Tauri toolchain are installed; that limitation must be reported rather than hidden.

## Acceptance criteria

The implementation is complete when:

1. The browser app starts successfully when `navigator.storage.persist()` returns `false` but SQLite/OPFS opens and reports a durable database.
2. The browser app still blocks unsafe storage failures and never falls back to volatile memory.
3. `npm run tauri:dev` opens the existing MathVenture frontend in a Windows Tauri window.
4. The Tauri app opens the native SQLite database and uses the existing repository without Tauri-specific domain code.
5. Local entity-plus-outbox writes commit atomically in Tauri, and failed transactions leave no partial local mutation.
6. Existing web/PWA behavior remains intact, including browser media downloads and service-worker shell handling.
7. Tauri users can use bundled Free Play media offline and authenticated application progress remains SQLite-backed and syncable.
8. The seven-day lease, offline authentication rules, sync protocol, conflict handling, and diagnostics remain unchanged.
9. Frontend CI-equivalent checks, Supabase tests, Rust checks, and Windows Tauri verification pass with fresh output.
