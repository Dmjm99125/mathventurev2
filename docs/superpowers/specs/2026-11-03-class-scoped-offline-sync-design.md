# Class-Scoped Offline Roster Sync Design

**Date:** 2026-11-03
**Status:** Approved

## Goal

Ensure teacher roster mutations queued by the browser are persisted to the selected class, never silently routed to the teacher's first class, and remain safe when one account is open in multiple browsers.

## Evidence and root cause

The live teacher settings page reports `0 pending, 1 failed` and the conflict message `A student named test1, test already exists.` The selected class can still show that student because the local optimistic roster is rendered from the offline repository.

The client includes `payload.classId` when creating `class.addStudents` and `class.removeStudent` operations. The server-side `createRosterOperationApplier` currently ignores that field and resolves `getTeacherClassroom(teacherId)` with the oldest teacher-owned class. A write intended for another class can therefore be created in the wrong class; a later retry then hits the global normalized-name duplicate check and is marked failed.

## Requirements

- `class.addStudents` must require and honor its target `classId`.
- `class.removeStudent` must require and honor its target `classId`.
- The server must verify that the authenticated teacher owns the target class.
- A missing or foreign target class must be rejected without provisioning or deleting any student membership.
- Existing student uniqueness behavior remains unchanged: a student identity cannot be provisioned twice.
- Existing local-first/offline behavior remains available; this fix changes routing and validation, not the offline storage model.
- The existing account data must not be silently deleted or moved by the application code. Any already-misrouted production records require explicit account reconciliation after deployment.

## Backend architecture

Extend `RosterOperationPersistence.getTeacherClassroom` to accept a required target class ID. The applier extracts `payload.classId` for roster mutations and resolves that exact teacher-owned class before validating or provisioning rows. `class.ensure` may use its entity ID as the class ID for compatibility with its existing operation shape.

The default Supabase persistence adds an exact `.eq("id", classId)` filter. It no longer orders teacher classes and limits to the first row. The operation result and id-mapping protocol remain unchanged, so successful local provisional students are still remapped to canonical profile IDs.

## Client and concurrency boundary

Current clients already serialize the selected class ID into roster mutation payloads. No direct online write path is introduced in this change; queued operations remain the single path for authenticated teacher mutations so online and offline behavior share the same validation. Multiple browser sessions may still attempt the same student identity concurrently; the existing server-side duplicate check remains the guard, and only one operation may succeed.

## Testing and verification

Tests are written first and must fail against the current first-class resolver. Focused backend coverage will assert that add and remove operations use the requested class ID, reject missing/foreign IDs, and never call the provisioning or membership-removal dependency after rejection. Existing roster and offline sync tests must remain green.

Run the affected Deno tests, then the repository's frontend Vitest/typecheck/build checks and the complete CI-equivalent lanes required by `AGENTS.md`. Remote Supabase/Netlify deployment state is not changed by this repository fix and must be verified separately when deployed.

## Out of scope

- Automatic deletion or movement of records already created in the wrong class.
- Relaxing global student-name uniqueness.
- Replacing the local-first mutation model with direct online requests.
- Changes to assignments, posts, reports, or student-facing class behavior.
