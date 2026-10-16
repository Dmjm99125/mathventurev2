# Offline-First SQLite Application Design

**Date:** 2026-10-16  
**Status:** Approved in conversation; awaiting written-spec review  
**Supersedes:** `docs/superpowers/specs/2026-10-07-offline-first-classroom-design.md` where the storage model conflicts

## Goal

Make the entire authenticated MathVenture product usable when internet access is effectively unavailable. A teacher must log in online once to enroll the device and download the classroom pack, then use the PWA through forced reloads and connectivity loss. Local changes must synchronize to Supabase later, and the local data boundary must be suitable for a future Tauri desktop app.

The offline access lease is sliding: every successful online authentication or completed cloud synchronization extends access for seven days.

## Product scope

Offline-capable workflows include:

- teacher dashboard, classroom snapshot, roster, assignments, posts, reports, and cached student-account switching;
- student classroom views, assigned quizzes, quiz start/checkpoint/resume/complete, dashboards, and posts;
- standalone attempts, detailed game results, and Free Play scores/completion/progress;
- local-first online operation, so online and offline writes use the same domain path;
- PWA shell, cached application data, sync status, conflicts, diagnostics, and recovery.

The following remain online-only because they create or change server identity or require Supabase Auth directly:

- teacher account creation;
- first online login and first-device enrollment;
- password reset and password change;
- server-side re-authentication after the local seven-day lease expires.

Offline roster additions are supported as provisional local students. Server provisioning and canonical ID assignment occur during synchronization.

This phase does not build the Tauri application. It establishes the adapter and migration boundaries that allow Tauri to use native SQLite later without changing the domain layer.

## Architecture decision

Use one canonical SQLite schema and repository contract for application data. In the PWA, SQLite runs in a dedicated worker using SQLite WASM and persists through OPFS. In a future Tauri build, the same repository contract is backed by a native SQLite adapter, such as the Tauri SQL plugin.

```text
React UI / React Query / games
              |
       domain repository
              |
       SQLite adapter contract
          /             \
 PWA SQLite worker       Tauri native adapter later
 SQLite WASM + OPFS     native SQLite app database
```

No UI component or query hook directly accesses IndexedDB, OPFS, SQLite, Supabase, or Tauri. The current IndexedDB classroom adapter is replaced by the SQLite adapter behind the existing offline repository boundary.

The PWA media system is a deliberate exception:

- Cache Storage owns the downloaded video/audio bytes;
- the service worker's small `mathventure-offline-media` IndexedDB database owns media download status and the active cache version;
- SQLite owns Free Play user data, including scores, attempts, completion records, progress, sync state, and session/application metadata.

The media worker remains independent from application-data migrations.

SQLite's OPFS persistence model is documented by the [official SQLite WASM persistence guide](https://sqlite.org/wasm/doc/trunk/persistence.md). The future native integration can use the [official Tauri SQL plugin](https://v2.tauri.app/plugin/sql/).

## Local database

Create a versioned SQL migration manifest shared by the browser adapter and the future Tauri adapter. The schema includes focused tables for:

- `app_meta` — schema metadata, last successful snapshot revision, last sync time, and health markers;
- `device_enrollment` — device ID, teacher profile reference, salted password verifier metadata, last online validation, and lease expiry;
- `local_sessions` — the active device-scoped teacher session and cached student-view context;
- `profiles`, `classrooms`, `class_students`, `assignments`, `attempts`, `attempt_game_results`, and `posts` — classroom application data;
- `free_play_sessions` and `free_play_progress` — local Free Play state and completion/progress data;
- `sync_outbox` — durable local-first operations and retry state;
- `sync_conflicts` — local/server versions and explicit resolution state;
- `entity_id_mappings` — provisional-to-server IDs and reference-rewrite metadata.

Every entity has a stable client or server ID. Outbox records include a stable operation ID, device ID, actor ID, operation type, entity ID, typed payload, dependency IDs, base revision, creation time, attempt count, and status.

All local writes that change application state also append their outbox record in the same SQLite transaction. A successful local transaction is the definition of immediate user-visible success. Online mode then starts eager synchronization; it does not bypass SQLite with a direct Supabase mutation.

The adapter must expose typed operations for opening/migrating, querying, executing, transactions, health checks, and closing. The PWA worker owns the database connection so React code never handles OPFS file locking or WASM database objects directly.

The adapter requests persistent browser storage. If SQLite, OPFS, migration, quota, or persistence setup fails, the app presents a durable-storage error and diagnostics action. It never silently falls back to memory.

### Existing-data migration

Because the current implementation has an IndexedDB classroom database, the first SQLite startup must perform a one-time import from `mathventure-classroom`:

1. open and validate the legacy stores;
2. copy acknowledged local entities, enrollment/session metadata, outbox records, and conflicts into SQLite;
3. preserve pending and failed operations exactly;
4. write an idempotent `legacy-idb-migrated` marker only after a successful transaction;
5. leave the legacy database intact until migration succeeds and the app has completed a health check.

The service-worker media metadata database is not part of this migration.

## Synchronization protocol

Supabase remains the cloud authority. Synchronization is a durable replication protocol with per-operation outcomes.

The client synchronizes at startup, after online authentication, on the browser `online` event, when the app returns to the foreground, and through a manual `Sync now` action. Background Sync may optimize retries but is not required for correctness.

The client topologically orders operations by dependency and sends bounded batches. The server validates every operation, authorization, payload, actor, device, and base revision. Each operation is idempotent by `(device_id, operation_id)`.

The server returns one of:

- `applied` — authoritative result and any canonical entity data;
- `duplicate` — the original result for a previously accepted operation;
- `conflict` — current server version plus local version information;
- `rejected` — validation or authorization failure;
- `retryable` — transient server/storage failure.

Applied and duplicate operations are removed from the outbox only after their authoritative result is written to SQLite. Retryable operations remain pending with bounded backoff. Rejected operations become visible failed records. One malformed or failed operation does not prevent unrelated safe operations from being processed.

Mutable assignment, roster, and post changes use base-revision checks. They never silently use last-write-wins. A conflict remains visible locally until the teacher explicitly chooses a server version, submits the local version as a new revision, or otherwise resolves the record through a follow-up operation.

Attempts, detailed game results, and Free Play completion events are append-oriented. They use client-generated IDs and idempotent inserts so multi-device submissions and retries do not overwrite prior work.

Bootstrap refresh and future server-delta responses merge acknowledged data into SQLite while preserving every pending, failed, or conflicted local record. Provisional local IDs are mapped to canonical server IDs, and dependent rows/outbox payloads are rewritten transactionally.

## Authentication and the sliding lease

The initial online teacher login performs these actions in order:

1. authenticate against Supabase;
2. create or update the device enrollment record;
3. create a salted Web Crypto password verifier without storing the raw password;
4. store the device-scoped local session;
5. download and persist the complete classroom/application pack;
6. begin eager synchronization.

The local lease stores `lastOnlineValidatedAt` and `offlineAccessUntil`. A successful online authentication or completed sync sets `lastOnlineValidatedAt` to the current trusted time and extends `offlineAccessUntil` by seven days.

On a forced reload, the app restores the local session from SQLite when the lease is valid. It does not require a Supabase refresh token to be usable offline. The local session is a device-scoped unlock, not proof of a live cloud session.

Cloud operations still require a valid online Supabase session. If online re-authentication or token refresh fails, local data remains available while the app reports `Needs sign-in` and keeps unsynchronized work intact. If the local lease expires while offline, the app blocks classroom actions and asks for online sign-in; it does not delete local data or the outbox.

Explicit sign-out clears the active local session but keeps the enrollment record, allowing offline password unlock again until the lease expires. Cached student switching uses the enrolled teacher's classroom pack and does not introduce a separate offline student-password flow.

## Product integration

All reads use repository-backed local queries. All mutations use the same local-first mutation helpers whether `navigator.onLine` is true or false. Successful local mutations invalidate relevant React Query keys immediately; sync results then refresh authoritative values and status markers.

Reports are derived from local attempts and game results, including unsynchronized work, and visibly identify that data as local/pending where appropriate. Quiz checkpoints are durable before the next game can begin. Free Play media download/update controls retain their current service-worker protocol, while Free Play user progress enters the SQLite outbox.

Pages with no provisioned classroom pack show a clear online provisioning state rather than an endless loading spinner. Account creation, password reset/change, and first enrollment controls explain that they require connectivity.

## UX and failure handling

The application shell exposes these states: `Online`, `Offline`, `Syncing`, `Needs sign-in`, and `Sync errors`.

The offline pack/status view shows:

- last successful sync and server revision;
- lease expiry;
- pending, failed, and conflicted operation counts;
- SQLite/storage health;
- manual bootstrap refresh and sync actions when online;
- a diagnostic export action.

SQLite and OPFS failures are actionable and durable. The app never silently switches to volatile memory. Database reset is not a casual action; any recovery flow must preserve or export diagnostics/local work first and require explicit confirmation.

The service worker continues to precache the application shell and SQLite WASM assets. Media cache updates cannot invalidate the SQLite database or classroom data.

## Testing and CI

Use test-first development for every new production behavior. Add tests for:

- schema creation, migration idempotence, and legacy IndexedDB import;
- SQLite adapter transactions, worker protocol, health checks, and durable-storage failures;
- local-first mutations and atomic outbox creation;
- bootstrap merge preservation, provisional ID mapping, and reference rewriting;
- dependency ordering, bounded batches, retries, duplicate IDs, partial results, conflicts, and resolution operations;
- sliding lease renewal, forced-reload restoration, expiry, sign-out, and raw-password absence;
- teacher, student, quiz, reports, posts, standalone attempts, and Free Play progress;
- media-worker IndexedDB/Cache Storage behavior remaining independent;
- status indicators, cached-page rendering, sync controls, diagnostics, and recovery states.

Before completion, run the repository's CI-equivalent gates without weakening them:

```text
npm run typecheck --prefix frontend
timeout 110s npm test --prefix frontend
npm run build --prefix frontend
timeout 110s deno test --allow-env --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen test/supabase
```

## Acceptance criteria

The feature is complete when:

1. A teacher can log in online once, provision the pack, force-reload, disconnect, and continue using all in-scope authenticated workflows.
2. Online and offline mutations follow the same local-first repository path.
3. Local work survives reloads, service-worker updates, transient failures, and lease-expiry prompts.
4. The sliding seven-day lease renews only after successful online authentication or completed synchronization.
5. Supabase sync is idempotent, dependency-aware, multi-device-safe, and conflict-visible.
6. No raw password is persisted, and no production path silently falls back to volatile memory.
7. Free Play media remains functional through Cache Storage/service-worker metadata while Free Play user progress is SQLite-backed and syncable.
8. The full frontend and Supabase CI-equivalent lanes pass with fresh output.
