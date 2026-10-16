# Offline classroom operation

MathVenture classroom work is offline-first after the device has been provisioned once.

## One-time online setup

1. Complete the first online login with the teacher account.
2. Open the classroom and wait for the offline classroom pack to finish downloading.
3. Confirm that the classroom, roster, assignments, lesson catalog, and recent progress are visible before leaving coverage.

The device stores a salted password verifier, never the raw password. The first online login, account creation, first classroom provisioning, password reset, and password change require a network connection. A successful online validation starts a sliding seven-day offline lease. The lease renews after a successful bootstrap or sync; a reload or force-reload never renews it.

## Working without internet

After setup, reload the installed PWA and use the cached teacher login. Teachers can view the cached roster, switch to a cached student account, assign quizzes, edit or remove assignments, add or remove roster entries, publish classroom posts, and view cached dashboards/reports. Students can open assigned lessons, start quizzes, save every checkpoint, complete quizzes, and submit standalone attempts.

Every local write is saved to SQLite WASM in OPFS immediately and placed in a durable outbox. The PWA keeps the database behind a worker boundary so the same repository can use native SQLite when the app moves to Tauri. The status indicator distinguishes Offline, Syncing, Online, Needs sign-in, and Sync error. Pending work is not described as reaching Supabase until it is acknowledged.

## Returning online

When coverage returns, MathVenture syncs dependency-ordered operations automatically. Use **Sync now** to retry manually. Use **Refresh classroom pack** while online to download an updated server snapshot; pending local work is preserved during refresh. Rejected operations remain available in the conflict/recovery panel. Server duplicates are safe to retry, stale mutable edits become explicit conflicts, and roster provisioning returns canonical server IDs for local rows.

## Storage and recovery

Classroom application data uses the `mathventure-app` SQLite database in OPFS. Free Play media metadata remains in its separate IndexedDB database and media bytes remain in Cache Storage; that media cache is not the classroom database. Authenticated Free Play progress and sessions are application data and sync through SQLite, while public guest Free Play remains local. Clearing browser storage removes the local classroom copy and pending work, so export diagnostics or sync before clearing storage. Diagnostics exclude passwords and password verifiers.

Student accounts in this app are teacher-provisioned classroom profiles. Creating accounts, changing or resetting a teacher password, and the first device provisioning remain online-only.

## Maintainer verification

Run the same blocking lanes used by CI from the repository root:

```powershell
npm run typecheck --prefix frontend
npm test --prefix frontend
npm run build --prefix frontend
deno test --allow-env --allow-read --config frontend/deno.json --lock=frontend/deno.lock --frozen test/supabase
```
