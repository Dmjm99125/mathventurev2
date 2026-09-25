# Skip to Games from Lesson Stages

## Goal

Allow any learner to bypass the instructional video and lesson slides and continue to the existing games introduction screen.

## User experience

- The video stage shows a `Skip to games` action alongside the existing `Next: Lesson` action.
- The lesson stage shows a `Skip to games` action alongside the existing slide navigation.
- Activating either action moves the learner to the existing `quiz-intro` state.
- The games introduction screen remains responsible for starting or resuming the games, so the change does not bypass assigned-quiz start/resume behavior.
- The action is available for both free-play and assigned-quiz contexts; no scoring, checkpoint, completion, or persistence behavior changes.

## Architecture

`QuizPage` already owns the stage state machine (`theme`, `video`, `lesson`, `quiz-intro`, `playing`, `feedback`, and `completed`). Add a stage helper for the skip action that sets `gameState` to `quiz-intro`. Render the handler from both the video and lesson stage navigation controls. Keep the existing `goToLesson` and `goToQuiz` handlers unchanged for learners who follow the normal path.

The video element does not need special cleanup: changing the rendered stage unmounts it, which stops playback through the existing React lifecycle. The lesson slide index does not need to be reset because entering the games stage does not expose the lesson; normal navigation still resets the index when returning to the lesson from the video.

## Testing

- Add a focused source-level regression test for the stage transition contract, asserting that the skip action is present in both instructional stages and targets `quiz-intro`.
- Run the focused test first and confirm it fails before implementation, then run it after implementation.
- Run the frontend typecheck, test suite, and production build because the change affects a React page and its rendered controls.

## Scope boundaries

This change does not alter game behavior, assigned-quiz restrictions, attempt recording, lesson content, routes, or the destination of the existing exit action.
