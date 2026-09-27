# Click-Based Colors Matching

## Goal

Make the Colors matching game usable on touchscreens by replacing its drag-and-drop interaction with a click-based interaction.

## User experience

- The learner clicks a visible object to select it.
- The selected object remains highlighted until the learner clicks a color bucket.
- Clicking the matching bucket records a correct match; clicking a different bucket preserves the existing wrong-attempt behavior.
- The game instruction tells the learner to click an object and then click its matching color.
- No drag gesture, native draggable behavior, or drop target is required.

## Architecture

`ColorMatchingGame` already owns selection state through `selectedItemId` and already has a `handleMatch(colorId)` path used by bucket clicks. Keep that state and scoring path as the single interaction contract. Remove the native drag event handlers from the game and remove `draggable` from item cards. Color buckets remain clickable and continue to call `handleMatch`.

The change is intentionally limited to `frontend/src/components/games/1-colors/ColorMatchingGame.tsx`. Other Colors games do not use drag-and-drop in the current implementation, so they do not need interaction changes. Assigned-quiz completion, wrong-item handling, free-play rounds, scoring, and navigation remain unchanged.

## Testing

- Add a focused source-level regression test to `frontend/test/colors-quiz-scoring.test.ts` that verifies the Colors matching game exposes click selection and bucket matching while no longer rendering native drag/drop behavior.
- Run the focused Colors test before implementation and confirm the new expectation fails for the current drag-enabled source.
- Implement the minimal change, rerun the focused test, then run the frontend typecheck, complete frontend test suite, and production build.

## Scope boundaries

This change does not modify scoring formulas, assigned-quiz attempt limits, item generation, visual styling beyond interaction affordances and instructions, other game topics, or global touch handling.
