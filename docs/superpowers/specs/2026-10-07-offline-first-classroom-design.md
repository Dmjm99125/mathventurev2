# Offline-First Classroom Design

**Date:** 2026-10-07  
**Status:** Approved for implementation

## Goal

Allow MathVenture to support the classroom's normal learning and teaching workflows without an internet connection after an initial online provisioning step, then synchronize local work to Supabase when connectivity returns.

## Product boundary

The device must first be online for a successful account login and classroom-pack download. After that, the teacher can unlock the device offline with the same credentials, use the cached classroom, switch into cached student accounts using the existing teacher “View Account” model, assign quizzes, and complete classroom learning workflows. A separate student-password login is not introduced by this feature.

Account creation, password reset/change, and first-device provisioning remain online-only because they require Supabase Auth or server-created identities. The application must clearly communicate this boundary instead of presenting these actions as available offline.

## Architecture decision

Use a local IndexedDB replica behind a repository interface, plus a durable operation outbox and a synchronization coordinator. IndexedDB is the native browser persistence mechanism, is already used by the PWA service worker, and avoids the runtime and persistence complexity of SQLite compiled to WebAssembly/OPFS. The repository boundary keeps a future SQLite adapter possible if the application later becomes an Electron app.

Supabase remains the server authority. While online, the repository can refresh from Supabase through Edge Functions. While offline, reads use the local replica and writes update local state immediately while queueing a typed operation for later synchronization.

## Local storage and authentication

Create a versioned IndexedDB database with stores for:

- device metadata and the current local schema version;
- cached teacher/student profiles;
- classroom records and roster memberships;
- assignments and assignment tombstones where needed;
- attempts and detailed game results;
- class posts and locally derived dashboard/report inputs;
- the durable sync outbox and conflict records;
- bootstrap metadata, including the last successful snapshot timestamp and server revision.

On an authenticated online visit, download a complete classroom pack containing the teacher profile, classroom, roster, assignments, attempts/results, posts, and report inputs. The lesson/game catalog remains part of the PWA bundle, while existing service-worker media caching remains independent of app-data storage.

After online login, store only a salted password verifier and minimum profile/session metadata needed to unlock the local device. Never store the raw password. Offline unlock is device-scoped and must not be treated as proof that the account password is valid against Supabase. When the user is online again, synchronization requires a valid Supabase session; if refresh fails, local work remains stored and the UI asks for re-authentication.

Reads are exposed through repository methods so React Query hooks do not need to know whether the source is IndexedDB or Supabase. Mutations apply locally first and append an operation with a stable mutation ID to the outbox.

## Synchronization protocol

Add a versioned `offline-bootstrap` Edge Function that returns the complete classroom pack for the authenticated teacher. Add a versioned `offline-sync` Edge Function that accepts batches of typed operations.

Each operation includes:

- `deviceId`;
- `actorId`;
- a stable `operationId`;
- an operation type and typed payload;
- the local entity ID;
- creation time and dependencies.

The first operation set covers classroom reads and writes already represented by the app: roster changes, assignments, assignment quiz start/checkpoint/complete, standalone attempts, posts, dashboards, and reports. Account-management operations remain online-only.

Assignment IDs, attempt IDs, and operation IDs are client-generated UUIDs. The server stores an idempotency record keyed by device and operation ID, returns the original result for a duplicate retry, and validates authorization and payloads for every operation.

The client processes operations in dependency order. An acknowledged operation writes the server result into the local replica and is removed from the outbox. Transient failures remain queued for retry. Validation, authorization, and schema failures remain visible as failed operations and do not delete local data.

Quiz attempts and game results are append-oriented and must not be silently overwritten. Mutable assignment changes use server validation and explicit conflict records. Conflicts are shown to the teacher with the available resolution choices rather than being discarded or silently resolved by last-write-wins.

Synchronization runs on application startup, the browser `online` event, and a manual “Sync now” action. Batches are bounded so one malformed operation cannot prevent unrelated safe operations from being reported. A bootstrap refresh must preserve pending local operations; it may replace acknowledged records but must not erase unsynchronized local work.

## User experience and failure handling

The app shell shows a persistent state indicator: Online, Offline, Syncing, Needs sign-in, or Sync errors. An offline-pack/status view shows the last successful snapshot, pending operation count, failed operation count, and local storage health.

Offline pages render cached data with a “Last synced” timestamp instead of an indefinite loading state. Quiz checkpoints remain playable if synchronization fails; the checkpoint is durable in IndexedDB and retries later. Local records remain until the server acknowledges them.

If the browser reports storage quota or IndexedDB failures, the app shows a clear actionable error and offers an exportable diagnostic report. It must not silently switch to volatile memory. Service-worker media cache changes must not invalidate classroom data.

## Testing strategy

Use test-first development for all new production behavior. Add unit tests for the IndexedDB repository, auth verifier, snapshot merge, outbox ordering, dependency handling, idempotent retry behavior, conflicts, and storage errors. Add API contract tests for `offline-bootstrap` and `offline-sync`, including authorization, duplicate operation IDs, malformed payloads, partial batch results, and retryable failures. Add frontend tests for offline React Query behavior, status indicators, cached page rendering, and offline quiz completion.

Before completion, run the repository's CI-equivalent frontend typecheck, frontend test lane, frontend build, and Supabase Deno test lane. Do not weaken existing tests, skip checks, or make CI lanes advisory.

## Delivery discipline

Implementation commits will be small and coherent, with a minimum of 30 commits as requested. Commits will be organized around independently reviewable tests, storage primitives, auth, bootstrap, sync protocol, UI integration, conflict handling, and documentation. No unrelated changes or empty commits will be added merely to reach the count.
