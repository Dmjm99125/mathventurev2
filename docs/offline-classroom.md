# Offline classroom operation

MathVenture classroom work is offline-first after the device has been provisioned once.

## One-time online setup

1. Complete the first online login with the teacher account.
2. Open the classroom and wait for the offline classroom pack to finish downloading.
3. Confirm that the classroom, roster, assignments, lesson catalog, and recent progress are visible before leaving coverage.

The device stores a salted password verifier, never the raw password. The first online login, account creation, first classroom provisioning, password reset, and password change require a network connection.

## Working without internet

After setup, reload the installed PWA and use the cached teacher login. Teachers can view the cached roster, switch to a cached student account, assign quizzes, edit or remove assignments, add or remove roster entries, publish classroom posts, and view cached dashboards/reports. Students can open assigned lessons, start quizzes, save every checkpoint, complete quizzes, and submit standalone attempts.

Every local write is saved to IndexedDB immediately and placed in a durable outbox. The status indicator distinguishes Offline, Syncing, Online, Needs sign-in, and Sync error. Pending work is not described as reaching Supabase until it is acknowledged.

## Returning online

When coverage returns, MathVenture syncs dependency-ordered operations automatically. Use **Sync now** to retry manually. Use **Refresh classroom pack** while online to download an updated server snapshot; pending local work is preserved during refresh. Rejected operations remain available in the conflict/recovery panel.

## Storage and recovery

Classroom data uses the `mathventure-classroom` IndexedDB database. Free Play media uses a separate media database and cache prefix. Clearing browser storage removes the local classroom copy and pending work, so export diagnostics or sync before clearing storage. Diagnostics exclude passwords and password verifiers.

Student accounts in this app are teacher-provisioned classroom profiles. Creating accounts, changing or resetting a teacher password, and the first device provisioning remain online-only.
