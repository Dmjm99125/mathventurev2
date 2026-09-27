# Click-Based Shapes Interactions

## Goal

Make every Shapes game usable on touchscreens by replacing the two remaining drag-and-drop interactions with click-based interactions.

## Affected games and user experience

### Monster Cafe

- The learner clicks an item to feed it to the monster.
- The click immediately evaluates the item against the requested shape.
- Correct answers, wrong answers, attempts, score, assigned-quiz completion, confetti, and round advancement retain their current behavior.
- The instruction changes from a drag prompt to `Click an item to feed me!`.

### Shape Matcher

- The learner clicks a toy to select it; the selected toy is visibly highlighted.
- The learner clicks a target shape box to attempt the match.
- Correct matches, wrong assigned-quiz answers, free-play retry feedback, completion, scoring, and replay retain their current behavior.
- The instruction changes to `Click a toy, then click its matching shape box!`.

Neither game requires a drag gesture, pointer coordinate hit-testing, or Framer Motion drag props after this change. Other Shapes games are already click-based and remain unchanged.

## Architecture

`MonsterCafe` will extract the existing drop-result logic into a click handler that receives the selected item and applies the same state transitions currently performed when the item is released over the mouth. The monster mouth remains visual feedback, but it is no longer a coordinate-based drop target.

`ShapeMatcher` will keep its existing `matches`, `answeredItems`, and attempt state, add a selected item id, and route target clicks through a matching handler. The selected item card will use the existing item list and assigned/free-play guards; target clicks will perform the same correct or wrong result that the current drop path performs. Matched items will continue rendering in their target boxes.

The change is limited to `MonsterCafe.tsx`, `ShapeMatcher.tsx`, and the Shapes scoring regression test. No shared input hook or dependency change is needed because the two games have different click flows.

## Testing

- Add focused source-level regression coverage to `frontend/test/shapes-quiz-scoring.test.ts` for both click-only contracts.
- Verify Monster Cafe has an item click handler, no Framer Motion drag props, and click-oriented instruction copy.
- Verify Shape Matcher has item selection and target click handlers, no drag/drop coordinate path, and click-oriented instruction copy.
- Update the existing Shape Matcher assigned-quiz test so it checks the retained click matching path rather than the removed drop implementation.
- Run the focused Shapes test before implementation and confirm the new click-only assertions fail against the current drag-enabled source.
- After implementation, run the focused Shapes test, frontend typecheck, complete frontend test suite, and production build.

## Scope boundaries

This change does not alter quiz maxima, attempt counting rules, assigned-quiz locks, free-play retry behavior, game navigation, visual themes, other Shapes games, or global touch handling.
