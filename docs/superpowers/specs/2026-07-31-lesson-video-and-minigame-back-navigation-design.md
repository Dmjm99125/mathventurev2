# Lesson Video and Minigame Back Navigation Design

## Summary

Refine the student lesson flow so the intro video screen is simpler, lesson slide language cards stop using the `1eng.png` and `1fil.png` assets, and ongoing minigames expose back navigation only when they truly have an internal previous screen.

The behavior should stay lightweight and local to the current lesson/minigame UI. This work should not redesign lesson structure, replace language markers with new badges, or add global back behavior where no prior in-game page exists.

## Goals

- Remove the `Skip Video` action from the lesson intro video screen.
- Make the lesson intro video display larger than it does today.
- Stop using `1eng.png` and `1fil.png` in lesson slide cards.
- Add a `Back` option during ongoing minigames only when the game has a real previous in-game screen.
- Make each supported minigame return to its immediate prior setup page instead of jumping to a generic menu.

## Non-Goals

- Replacing `1eng.png` or `1fil.png` with any new icon, badge, or label.
- Enlarging videos embedded inside lesson slides.
- Adding a back button to minigames that launch directly into gameplay with no internal setup state.
- Changing lesson order, quiz scoring, or attempt submission behavior.
- Reworking existing post-game completion screens unless required for a consistent return target.

## Approved Direction

The approved direction is `Local, state-aware back navigation`.

The lesson intro video screen in `QuizPage` should lose the extra skip action and give more visual emphasis to the main video player. Lesson slide language cards should become text-and-audio only, with the icon rows removed entirely.

For minigames, back navigation should be added only where the component already has a multi-step internal state flow. The back action should move from the active gameplay state to the immediate preceding state in that same component, such as `game -> difficulty`, `game -> world-map`, or `game -> menu`.

## Product Constraints

- The intro video screen must keep a clear forward path into the lesson stage.
- The larger video treatment must apply only to the lesson intro video stage rendered from `QuizPage`.
- `LessonSlideCard` must no longer reference `/assets/images/1eng.png`.
- `LessonSlideCard` must no longer reference `/assets/images/1fil.png`.
- English and Filipino lesson text content must remain visible after the asset removal.
- Ongoing minigames may show a `Back` control only when a real previous internal screen exists in that minigame's state machine.
- Straight-to-game minigames must show no back button.
- The new behavior must not change quiz progression for games that complete normally.

## User Experience

## Intro Video Stage

The student opens a lesson and sees the video stage with a larger player and the existing `Next: Lesson` primary action.

The `Skip Video` button is removed entirely so the screen has one obvious forward action instead of a secondary bypass action.

This larger treatment should feel specific to the pre-lesson viewing step rather than a site-wide change to every lesson media surface.

## Lesson Slide Language Cards

The bilingual lesson cards should continue to show the English and Filipino text blocks and their audio controls when present.

The small language image markers are removed without replacement. The layout should remain balanced after the icon row is simplified.

## Minigame Back Navigation

Back navigation appears only while the player is actively in a gameplay screen and only for minigames that already have an earlier internal screen in their flow.

Expected examples:

- a pet-selection plus difficulty game returns from `game` to `difficulty`
- a character-select game returns from `game` to `menu`
- a world-map flow returns from `game` to `world-map`

Minigames that start directly in gameplay and have no internal setup screen should not gain a back button. Their behavior remains unchanged.

## Technical Notes

- The intro video UI changes live in `src/pages/QuizPage.tsx`.
- The lesson slide icon removal lives in `src/components/LessonSlideCard.tsx`.
- Minigame back behavior should be implemented inside each affected minigame component instead of through a global lesson wrapper.
- Each affected minigame should reuse its current local state machine so the back action aligns with the game's actual flow.
- Shared quiz submission and completion plumbing in `QuizPage` should stay intact.

## Testing Strategy

- Add or update stable tests around `LessonSlideCard` so the component no longer references `1eng.png` or `1fil.png`.
- Add focused tests for any extracted or easily testable minigame state behavior where practical.
- Run targeted tests for the touched files first.
- Run the closest project-wide verification command after the targeted checks pass.
- Manually verify representative game flows to confirm that:
  - the intro video screen no longer shows `Skip Video`
  - the intro video is visibly larger
  - lesson slide language cards no longer render the removed assets
  - only multi-screen minigames show `Back`
  - `Back` returns to the immediate previous in-game screen for those games
