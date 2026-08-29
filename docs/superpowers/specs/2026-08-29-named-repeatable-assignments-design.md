# Named Repeatable Assignments and Reliable Quiz Scores

**Date:** 2026-08-29

## Goal

Make classroom quiz completion reliable and allow teachers to assign the same lesson repeatedly with a distinct name, status, overall score, and per-game score history for each assignment.

## Design

The existing assignment ID remains the identity boundary. Every create request inserts a new assignment row, even when lesson and class match an earlier row. Add a nullable-safe `name` column with a default fallback, expose it through assignment APIs, collect it in the teacher dialog, and display it in student classroom cards.

Teacher roster progress will keep the latest completed overall score for the compact row, then expose an assignment-level drawer. Each assignment entry includes its name, lesson, status, latest completed overall score, and every catalog game score from that assignment's attempt. Unstarted or in-progress games display `--`; prior assignments are never overwritten by a later assignment of the same lesson.

The score-save flow will treat the server response as authoritative. Quiz completion will remain in the completion state only after the assignment-quiz mutation succeeds. If saving fails, the current quiz remains retryable and shows the error, preventing a false “completed” state with an in-progress database attempt. Existing per-game checkpoints and final upserts remain the persistence path.

## Data flow and safety

- `assignments-create` validates and stores the supplied name.
- `assignments-list` returns names and retains one assignment row per unique assignment ID.
- `assignment-quiz` continues to key attempts by `(student_id, assignment_id)`; a new assignment therefore receives a new attempt.
- `classes-roster` joins classroom assignments to completed/in-progress attempts and detailed game results by `assignment_id`/`attempt_id`, scoped to the teacher’s classroom.
- Incomplete attempts are not used as completed overall scores, but their assignment status remains visible.

## Testing

Add regression coverage for failed completion state handling, named assignment creation/listing, duplicate lesson assignments, and assignment-level score separation. Run focused tests, typecheck, production build, and the full suite.
