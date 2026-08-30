# Teacher Assigned Quizzes View Design

**Date:** 2026-08-30
**Status:** Approved

## Goal

Extend the teacher classroom workspace with a dedicated **Quizzes Assigned** view. Teachers should be able to inspect the quizzes assigned in the current classroom, compare student overall scores, and drill into per-game scores for an individual student. The existing Student List and Student Progress views remain available through the same control.

## Navigation

Replace the current Student List / Student Progress tab buttons with an accessible dropdown backed by the existing Radix Select primitives.

- The selected view defaults to **Student List**.
- Options are **Student List**, **Student Progress**, and **Quizzes Assigned**.
- Selecting an option changes the content in place; no new route is introduced.
- The control remains usable at narrow widths and fits the existing responsive teacher workspace.
- The existing mobile hamburger navigation is unaffected.

## Quizzes Assigned view

Use a nested, progressive-disclosure layout:

1. Render one expandable card for each assigned quiz.
2. The collapsed card includes the quiz name, lesson/topic context, assigned date, due date when present, and a completion summary.
3. Expanding a quiz reveals the students associated with that assignment. Each student row includes last name, first name, overall score, status, and a **View games** control.
4. Expanding a student reveals the per-game scores for that quiz. Use the existing game catalog so the detail view has stable game labels and show `—` when a game has no score.
5. Keep one quiz and one student detail expansion active at a time to avoid an overly tall mobile layout. Changing or collapsing the quiz closes its student detail.

Score and status presentation must support students who have not started or are still in progress. These rows remain visible with a clear status and an em dash for unavailable scores.

Empty states:

- No assignments: explain that no quizzes have been assigned to the classroom yet.
- No available students for an assignment: explain that no students are currently available for that quiz.
- No score yet: retain the student row and show its not-started/in-progress state rather than hiding it.

## Data model and source

Use the existing teacher data sources; no backend endpoint or schema change is required.

- `useAssignments(classroom.id)` supplies assignment metadata, including assignments with no attempts yet.
- `useClassRoster()` supplies current classroom students and their assignment-level overall scores, statuses, and per-game scores.
- Add a small frontend aggregation helper that joins assignment metadata to roster students. Class-wide assignments include all current classroom students; directly targeted assignments include only the targeted student.
- Preserve the assignment metadata and roster score types rather than duplicating backend contracts.

The aggregated view model should provide each assignment with its metadata and an ordered student list containing the student identity plus the matching assignment score details. Missing assignment score records are represented as not started with null score values.

## Loading and error behavior

Assignment loading participates in the page's existing classroom loading state. If assignment loading fails, the Student List and Student Progress views remain usable and the Quizzes Assigned view displays a clear error state with a retry affordance through the query's existing refetch behavior.

## Verification

- Add focused tests for joining assignment metadata to roster students, including class-wide assignments, targeted assignments, unstarted students, and per-game data preservation.
- Update teacher workspace tests for the dropdown options/default and the Quizzes Assigned view's nested expansion structure.
- Run typecheck, targeted tests, the full test command with the repository's required permissions, and the production build.
