# Teacher Add Students Workflow

## Summary

Add a real `+ Add` workflow to the teacher class workspace so a teacher can add students to a class in three ways:

- manual entry
- `xlsx` import
- `json` import

All three entry modes should converge into one shared review-and-confirm flow before any student accounts are created.

This feature should create and enroll hidden student accounts immediately, using the same name-based student sign-in model already used elsewhere in the app.

## Goals

- Turn the existing `+ Add` placeholder into a working teacher flow.
- Support manual entry, `xlsx` import, and `json` import.
- Normalize all three sources into one review table before creation.
- Create hidden student accounts immediately after teacher confirmation.
- Enroll created students into the selected class immediately.
- Keep the existing student login model: students sign in with `last name + first name` only.
- Reuse the current hidden-student account creation pattern rather than inventing a second student model.

## Non-Goals

- Solving duplicate-name edge cases in this phase.
- Adding student IDs, usernames, notes, or other optional fields.
- Supporting flexible import header mapping.
- Supporting partial-success batch creation.
- Adding file storage, background import jobs, or deferred roster placeholders.
- Changing the existing student authentication model.

## Chosen Direction

The approved direction is `Unified Multi-Source Add Students`.

The teacher uses one shared `Add Students` flow with three entry modes:

1. `Manual`
2. `Import XLSX`
3. `Import JSON`

No matter which source is chosen, the data is normalized into the same row shape:

- `lastName`
- `firstName`

The teacher reviews the parsed rows before anything is created. Only after confirmation does the app call the backend to create and enroll hidden student accounts.

## Product Constraints

- Teacher-added students must be real hidden student accounts, not roster placeholders.
- Teacher-added students must sign in later using `last name + first name` only.
- The first version requires only `Last Name` and `First Name`.
- `xlsx` import uses a strict two-column template: `lastName`, `firstName`.
- `json` import uses a strict array of objects: `{ "lastName": "...", "firstName": "..." }`.
- Duplicate-name handling is explicitly deferred for now.
- Creation should be all-or-nothing for a submitted batch.
- No new database schema is needed for this phase.

## User Experience

## Entry Point

The `+ Add` action in `/teacher/classes/:classId` becomes a real workflow.

When clicked, it opens a multi-step add flow:

1. choose source
2. enter or upload student data
3. review parsed rows
4. confirm creation
5. show result summary

## Source Picker

The first step presents three choices:

- `Manual`
- `Import XLSX`
- `Import JSON`

The source picker should make it clear that all three options end in the same review step before students are created.

## Manual Entry

Manual entry should support adding multiple rows in one session.

Each row contains:

- `Last Name`
- `First Name`

The teacher can add or remove rows before continuing to review.

## XLSX Import

`XLSX` import accepts a strict template only.

Expected columns:

- `lastName`
- `firstName`

If the uploaded sheet does not match the required shape, the flow should reject it and explain the required format.

## JSON Import

`JSON` import accepts a strict array only.

Expected shape:

```json
[
  { "lastName": "Santos", "firstName": "Maria" },
  { "lastName": "Cruz", "firstName": "Paolo" }
]
```

If the payload is not an array of objects with exactly the required fields, the flow should reject it and explain the expected format.

## Review Step

After manual entry or import, the app normalizes the rows and shows one shared review table.

The review table shows:

- `Last Name`
- `First Name`

This review step is the gate before creation. No students are created before the teacher confirms.

If any row is incomplete after trimming, the review step must block submission.

## Result Step

After confirmation succeeds, the UI should show a short result summary:

- how many students were created
- which class they were added to

After success, the class roster refreshes.

The success state may either close automatically after acknowledgement or keep a final confirmation state in the modal before closing.

## Backend And Data Flow

## Shared Backend Operation

Add a teacher-only backend entrypoint, such as `classes-add-students`, that accepts:

- `classId`
- `students: { lastName: string; firstName: string }[]`

The backend should:

1. verify the caller is a teacher
2. verify the teacher owns the class
3. validate the incoming rows
4. create hidden student accounts
5. update profile names and normalized name fields
6. enroll each created student into the selected class
7. return a creation summary

## Shared Server Helper

The current student registration flow already creates hidden student accounts and enrolls them into a class.

To avoid duplicated logic, the account-creation and enrollment steps should be extracted into a shared server helper that both of these flows can reuse:

- student self-registration
- teacher add/import students

This keeps normalization, hidden-account creation, and enrollment rules consistent.

## No New Schema

This feature should not create a new database table in its first version.

It should reuse:

- auth users for hidden student accounts
- profile updates for names and normalized name fields
- `class_students` for enrollment

## Validation And Error Handling

## Frontend Validation

The frontend should reject invalid source data before submission whenever possible.

Examples:

- empty manual rows
- wrong `xlsx` columns
- wrong `json` structure

## Backend Validation

The backend must still validate everything again before creating accounts.

If validation fails, it should return a clear error the teacher can act on.

## Batch Semantics

The first version should use all-or-nothing batch creation.

If one row fails, none of the students in that submitted batch should be created.

This avoids confusing half-imported roster states and keeps retry behavior simple.

## Deferred Duplicate Handling

The current identity model treats `last name + first name` as effectively unique in practice.

Duplicate-name resolution is intentionally deferred. This phase should not introduce a new identity system to solve that edge case preemptively.

If that edge case appears later, it can be handled in a dedicated follow-up design.

## Responsive Behavior

## Desktop

On larger screens, the add flow should appear as a centered modal/dialog layered over the teacher class workspace.

The review step should comfortably show multiple rows without forcing the main page to reflow awkwardly.

## Mobile

On mobile, the add flow should use a full-height sheet or dialog treatment.

The flow should stack vertically:

- source picker
- entry/upload area
- review content
- confirm/result actions

If the review list is long, the list itself should scroll inside the modal rather than making the whole page difficult to use.

## Component Boundaries

The feature should be broken into focused responsibilities:

- teacher add-students trigger inside the class workspace
- add-students source picker
- manual-entry form rows
- `xlsx` parser adapter
- `json` parser adapter
- shared review table
- result state
- teacher add-students mutation/hook
- shared backend student-creation helper
- teacher-only add-students edge function

The goal is to keep parsing, review logic, and backend creation logic isolated enough to test independently.

## Testing Strategy

Minimum implementation verification should cover:

- `+ Add` opens the workflow from the teacher class workspace
- source picker transitions into the correct input step
- manual mode supports multiple rows
- invalid manual rows block review or confirmation
- invalid `xlsx` shape is rejected
- invalid `json` shape is rejected
- valid `xlsx` rows normalize correctly
- valid `json` rows normalize correctly
- review step shows the normalized rows
- confirm submits only after successful review
- backend creates and enrolls all rows on success
- backend rejects unauthorized or non-owner teacher requests
- batch creation is all-or-nothing on failure
- roster refreshes after success
- mobile layout remains usable inside the add flow

## Manual Acceptance Criteria

This feature is successful when:

1. A teacher opens a class workspace and clicks `+ Add`.
2. The teacher can choose `Manual`, `Import XLSX`, or `Import JSON`.
3. Manual mode allows entering multiple students with `Last Name` and `First Name` only.
4. `XLSX` mode accepts only the strict template with `lastName` and `firstName`.
5. `JSON` mode accepts only the strict array-of-objects format.
6. All sources lead to one shared review step before creation.
7. Confirming the review creates hidden student accounts immediately.
8. The created students are enrolled in the selected class immediately.
9. Those students later sign in using `last name + first name` only.
10. If one row fails during backend creation, no students from that batch are created.

## Implementation Notes

- Keep the scope focused on the teacher add/import flow only.
- Reuse the existing hidden-account creation pattern already used by student registration.
- Prefer strict import templates for this first version rather than building a column-mapping system.
- Keep duplicate-name resolution out of scope for now rather than partially solving it.
- Do not introduce placeholder roster rows that later need conversion into real student accounts.
