# Color Matching Generated Sprites

## Goal

Wire the generated sprite assets into the existing Color Matching Game for the four playable colors currently supported by the game: red, green, yellow, and blue.

## Scope

- Keep the existing four color buckets, randomized item selection, matching behavior, scoring, and card layout unchanged.
- Replace the rendered emoji artwork with the generated PNG sprite for each selected item.
- Keep the existing emoji value as an image-failure fallback so a missing asset cannot make a card blank.
- Add accessible alternative text that identifies the color and object.
- Leave the generated orange and purple assets staged in `frontend/public/assets/images/`; do not add those colors to the game rules or color buckets in this change.

## Asset mapping

The `EMOJI_POOL` entries in `frontend/src/components/games/1-colors/ColorMatchingGame.tsx` will map to these project assets:

- Red: strawberry, apple, tomato, car, balloon, and the revised ladybug.
- Green: apple, tree, frog, turtle, and leaf.
- Yellow: sun, banana, lemon, cheese, and sunflower.
- Blue: water drop, fish, cap, and ice cube.

Each pool entry will retain its original emoji fallback, color ID, and randomized selection semantics while adding an asset path and human-readable label.

## Component behavior

The clickable item card will render the sprite image with a stable object-contain layout, descriptive `alt` text, and an `onError` fallback that hides the failed image and shows the original emoji. No state transitions or scoring logic will depend on image loading.

## Verification

- Add focused component coverage for the four supported color groups and sprite rendering/fallback behavior.
- Run the focused frontend test, frontend typecheck, full frontend test lane, and frontend build.
- Run the repository CI-equivalent checks required for the affected frontend lane before committing and pushing.
