# Teacher Add Students: Unlimited Manual Entry

## Context

The teacher's Add Students flow already uses a row-based manual editor, but the experience does not make its unbounded behavior clear enough for larger rosters. A teacher should be able to add more than eight students in one manual-entry batch without losing access to the controls or encountering an arbitrary UI ceiling.

## Direction

Keep the existing row-based manual editor and make it explicitly continuous. The manual editor will use the existing Organic teacher visual language: earth-tone surfaces, rounded cards, clear hierarchy, and restrained motion. The differentiator is a live student count paired with an always-available “Add another student” action, making the lack of a row ceiling visible in the interface.

## Goals

- Allow a teacher to append any number of manual student rows needed for one submission.
- Keep the add and review controls reachable when the row list is long.
- Make the current number of entered students visible.
- Preserve existing row validation, review, submission, removal, and import behavior.
- Add regression coverage for a manual batch larger than eight students.

## Non-goals

- Changing XLSX or JSON import formats.
- Adding a server-side batch limit or changing backend creation semantics.
- Adding bulk text parsing, pagination, virtualization, or a new full-page workflow.
- Changing student identity, duplicate-name, or account-provisioning rules.

## User experience

The manual step remains a card inside the Add Students dialog or mobile drawer.

- The card header identifies the manual step and displays the current count, using singular/plural copy correctly.
- The row list is the scrollable region inside the card so the footer stays reachable as rows accumulate.
- “Add another student” appends one blank row without applying a maximum.
- “Remove” continues to delete a row and remains disabled when only one row exists.
- “Review students” continues to normalize and validate all rows before advancing.
- Existing validation errors remain visible near the form controls.

## Implementation boundaries

`TeacherAddStudentsManualEditor` remains responsible for editable row state, row IDs, add/remove interactions, and manual validation. The parent dialog and shared normalization utilities remain unchanged unless required by the layout.

The editor will use a min-height-safe flex layout:

1. header/count area
2. independently scrollable row list
3. persistent action footer

The row array will continue to be submitted in full through the existing `onContinue` callback. No `slice`, fixed row constant, or count-based guard will be introduced.

## Error handling

- Empty submission remains rejected by `normalizeTeacherAddStudentRows`.
- Any incomplete row continues to block review with the existing validation message.
- Removing the final row remains prevented by the existing disabled state.
- Backend errors and review errors continue to use the existing dialog error surfaces.

## Testing

Add a focused regression check for the manual editor that verifies:

- the continuous-add copy and live count are present;
- the row list uses an internal scroll region while the action footer remains outside it;
- the implementation does not introduce a fixed eight-row limit;
- a batch containing more than eight rows is preserved for review/submission.

Run the affected frontend test first, then the complete frontend CI-equivalent checks: typecheck, frontend test suite, and production build. The Supabase suite is unchanged by this design but remains part of the repository CI gate if the full local verification is run.

## Acceptance criteria

1. A teacher can add nine or more students manually in one Add Students session.
2. The count reflects the current number of rows as rows are added or removed.
3. The add and review controls remain reachable without expanding the dialog beyond its existing bounds.
4. Existing validation and review behavior remains intact.
5. No unrelated files or workflows are changed.
