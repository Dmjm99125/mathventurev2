# Teacher Multi-Class Management Design

**Date:** 2026-10-18
**Status:** Approved

## Goal

Restore teacher-side multi-class management while preserving the current single-class student experience and every existing class-scoped record.

## Requirements

- Teachers can create, list, select, rename, archive, and unarchive classes.
- `/teacher` is the teacher's class list; selecting a class opens its isolated workspace.
- The existing `Classroom` class remains the teacher's first visible class, with all existing data and students intact.
- "Delete" means reversible archive only. No class row or child data is physically deleted.
- Students keep the current hidden teacher-provisioned account flow and remain attached to their existing single class.
- Students do not receive a class picker, join-code flow, or automatic class reassignment.
- Teachers can list and switch among all downloaded classes while offline.
- Class metadata changes - create, rename, archive, and unarchive - require an online connection.
- The existing `frontend/public/favicon.svg` becomes the canonical icon for browser, PWA, and Tauri app surfaces.

## Data safety boundary

The migration is additive and non-destructive:

- Add nullable `archived_at` to `public.classes`.
- Drop only the singleton uniqueness index on `public.classes.teacher_id`.
- Preserve the existing `Classroom` row, its ID, and every related student, assignment, attempt, post, and report record.
- Update the new-teacher trigger so it creates an initial `Classroom` only when one does not already exist; it must not rely on a uniqueness conflict after the singleton index is removed.
- Add indexes needed for teacher class listing and archived-state filtering.
- Do not backfill, rename, move, detach, or rewrite existing data during migration.

Explicit teacher actions may update only the selected class metadata:

- Rename updates that class's `name`.
- Archive sets that class's `archived_at`.
- Unarchive clears that class's `archived_at`.

None of these actions mutate child rows. Archived classes remain readable for historical roster and report inspection. Roster changes, assignments, posts, student removal, and other class mutations are rejected for archived classes.

## Backend architecture

The existing class-scoped schema and edge-function boundaries remain the foundation. Singleton-specific helpers and responses are replaced with teacher-owned class resolution.

### Class management API

`classes-list` returns teacher-owned active and archived class summaries. Student callers retain a single-class response compatible with the current student flow.

`classes-create` accepts a required trimmed class name and creates one active class owned by the authenticated teacher. The new row has a null join code because students are still provisioned by teachers rather than joining with codes.

`classes-update` accepts a teacher-owned `classId` and one explicit operation:

- `rename` with a required trimmed name;
- `archive`;
- `unarchive`.

Every teacher-facing class endpoint accepts or derives a `classId` and verifies `classes.teacher_id = authenticatedTeacherId`. There is no fallback to "the only class." Archived class reads are permitted; archived writes are not.

The following existing operations become class-scoped:

- roster listing and student detail;
- add and remove students;
- assignments and assignment mutations;
- posts;
- teacher reports;
- teacher dashboard aggregates.

The student endpoints remain single-class and continue returning the student's existing membership. No student endpoint is expanded to expose multiple classes.

## Teacher navigation and UI

Routes:

- `/teacher` - active and archived class list;
- `/teacher/classes/:classId` - selected class workspace;
- `/teacher/classes/:classId/students` - class roster;
- `/teacher/classes/:classId/assignments` - class assignments;
- `/teacher/classes/:classId/reports` - class reports.

The class list shows active classes first, with name, student count, and creation date. It provides a New Class action and per-class Rename and Archive actions. Archived classes appear in a separate section with Unarchive actions and remain selectable for read-only roster/report inspection.

The selected workspace shows the class name, an All Classes link, and the existing teacher tools scoped to the route's `classId`. Query keys, loading state, errors, and mutations all include the class ID so switching classes cannot reuse another class's cached data.

Existing unscoped teacher routes redirect to `/teacher` rather than silently selecting a class. An archived workspace visibly indicates its read-only state and disables student, assignment, post, and other mutations.

## Student invariants

Existing student accounts and memberships are preserved exactly. New students are provisioned into the teacher-selected class only. Because each provisioned student account remains associated with one class, the current login, dashboard, classroom page, assignments, and lesson return routes continue to work without a class-selection UI.

## Offline behavior

The offline teacher snapshot changes from one `classroom` record to a collection of teacher-owned class records, including each class's `archived_at` state. Related students, assignments, attempts, game results, posts, and free-play records retain their class IDs.

Offline reads and local mutations require the selected class ID and filter every collection by that ID. The offline repository and query keys must never fall back to the first cached class. The teacher can list, select, inspect, and use downloaded classes while offline. Creating, renaming, archiving, and unarchiving classes remain online-only because the current offline operation protocol does not need to invent local class identities or conflict rules for this feature.

Student offline behavior remains single-class and continues to use the student's cached membership.

## Icon packaging

`frontend/public/favicon.svg` is the canonical source of the MathVenture icon. The existing artwork is not redesigned.

- Keep the SVG as the browser favicon.
- Regenerate the checked-in Tauri PNG, ICO, and platform icon outputs from the SVG.
- Ensure the PWA manifest points to favicon-derived icon assets so web-installed and desktop versions match.
- Preserve the existing Tauri bundle configuration and validate that its referenced icon files contain the favicon artwork.

## Error handling

- Unauthenticated requests return the existing unauthorized response.
- Non-teachers cannot manage teacher classes.
- A class ID not owned by the teacher returns a not-found/forbidden response without revealing another teacher's data.
- Rename rejects blank or whitespace-only names.
- Archive and unarchive are idempotent for the selected class.
- Archived class mutations return a clear archived/read-only error.
- Client errors are shown in the class list or selected workspace without changing route state or cached data.
- Offline-only metadata actions explain that an internet connection is required.

## Testing and verification

Tests are written first for the changed behavior and must demonstrate the expected failure before implementation.

Focused regression coverage includes:

- singleton-index removal and additive archive-column migration contract;
- new-teacher initial-class trigger behavior;
- class list/create/rename/archive/unarchive handlers;
- teacher ownership and archived mutation checks;
- preservation of existing class IDs and child records;
- class-scoped teacher routes, query keys, and cache isolation;
- unchanged single-class student provisioning and login behavior;
- offline multi-class snapshot, selection, filtering, and write isolation;
- favicon-to-PWA/Tauri icon asset consistency.

Resource guardrails are part of the verification plan: run commands sequentially, avoid parallel test shards, do not run a dev server beside tests or builds, and do not start Supabase or Tauri unless the targeted check requires it. The relevant CI-equivalent lanes are run in order with the repository's 110-second test limit, followed by typecheck, build, and the required Rust/Tauri checks.

## Non-goals

- No student multi-class experience.
- No class join codes or self-service student joining.
- No physical class deletion.
- No migration of existing student, assignment, attempt, post, report, or offline records.
- No unrelated teacher-dashboard redesign.
