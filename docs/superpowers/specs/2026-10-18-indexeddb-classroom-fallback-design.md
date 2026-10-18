# IndexedDB Classroom Fallback Design

## Goal

Make the complete classroom experience work offline in a browser where SQLite WASM cannot use OPFS, while preserving SQLite/OPFS as the preferred web backend and native SQLite for Windows Tauri.

## Scope

The fallback covers the same application-storage consumers as the SQLite path:

- classroom bootstrap snapshots and reloads;
- cached teacher, classroom, roster, assignment, attempt, post, and Free Play data;
- offline mutations and their sync outbox;
- conflict records and diagnostics;
- offline teacher enrollment, session restoration, sign-in, and sign-out.

Public guest Free Play media remains on its existing Cache Storage/IndexedDB path. This work does not merge SQLite and IndexedDB databases or delete either database when the preferred backend changes.

## Storage selection

The runtime exposes one `ApplicationStorage` boundary:

1. Windows Tauri opens native SQLite through the Rust bridge.
2. A supported browser first opens the SQLite WASM worker backed by OPFS.
3. If the browser reports an OPFS, cross-origin-isolation, or non-durable SQLite capability failure, the runtime probes and opens the durable `mathventure-classroom` IndexedDB store.
4. Other SQLite failures remain visible as startup errors; the fallback must not hide migrations, corruption, or unexpected application failures.
5. If IndexedDB is also unavailable or blocked, the app shows a specific storage error. It never uses volatile memory as an implicit production fallback.

The IndexedDB path is reported as `best-effort` because browser eviction policy still applies. The repository and auth layers must not need to know which storage implementation was selected.

## IndexedDB adapter

The existing `mathventure-classroom` database name, version, object-store names, and record shape remain the compatibility contract. Existing records must remain readable.

Compound repository operations will execute through one IndexedDB read-write transaction. The store contract will provide a transaction-scoped store facade so operations such as “write entity plus outbox entry,” bootstrap replacement, lease renewal, ID remapping, and conflict resolution cannot partially commit when IndexedDB is available.

The memory adapter used by tests will implement the same scoped contract without changing its observable behavior. Individual non-transactional reads and writes will continue to open their own short-lived IndexedDB transactions.

## Data flow

The provider and auth services obtain `ApplicationStorage` from the runtime. The existing repository factory selects the SQLite repository for `SqliteDatabase` and the legacy-compatible repository for `OfflineStore`. Both repositories expose the same classroom API, so pages, sync, quizzes, reports, and diagnostics remain unchanged.

When the browser is offline, the app reads the last IndexedDB snapshot, writes local changes immediately, and appends pending operations to the IndexedDB outbox. When connectivity returns, the existing dependency-ordered sync coordinator sends and acknowledges those operations through the same path used by SQLite.

## Error handling

- Capability-only SQLite failures may select IndexedDB.
- Database migration, schema, validation, and unexpected worker failures remain actionable errors unless their cause explicitly identifies missing OPFS durability/isolation.
- IndexedDB open, upgrade, blocked, request, transaction, and quota failures are surfaced as offline-storage errors.
- The UI must distinguish `best-effort` browser retention from unavailable storage.

## Verification

Add regression coverage for:

- capability failure selecting an IndexedDB store;
- bootstrapping a classroom into the fallback store and reading it after a new repository instance is created;
- saving a local classroom mutation together with its outbox operation;
- restoring offline enrollment/session metadata from the fallback store;
- keeping unrelated SQLite failures fatal;
- preserving Tauri/native selection.

Run the repository's frontend typecheck, full frontend test lane, and production build. Manually verify in the running browser that an IndexedDB-only path can load the classroom, save a quiz/mutation offline, reload, and show the pending work for sync.

## Non-goals

- replacing SQLite/OPFS on browsers where it works;
- merging pre-existing SQLite rows into IndexedDB automatically;
- changing Supabase APIs or sync conflict policy;
- supporting non-Windows Tauri targets in this task.
