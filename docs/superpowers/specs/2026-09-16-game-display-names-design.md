# Game Display Names Design

## Goal

Replace generated game labels such as `colors-1` and `addition-14` with the actual human-readable name of the game wherever teacher-facing game results are shown, with particular attention to PDF exports.

## Constraints and non-goals

- Keep persisted and API-facing game IDs unchanged (`colors:0`, `addition:13`, and so on).
- Keep game order, game counts, scoring, completion calculations, and assignment behavior unchanged.
- Use the visible title/name presented by the game component as the display name. When a component does not render a standalone title, use its established component or legacy-game name rather than a generated identifier.
- Do not refactor game components or change student-facing game screens as part of this work.

## Recommended approach

Keep one explicit display-name catalog in `src/lib/games/catalog.ts`. Each existing catalog entry will retain its `topicId`, `gameId`, `gameOrder`, and `maxScore`, while its `title` becomes a literal actual game name. This keeps reporting independent of React components and makes the names available to both browser PDF generation and server/shared report code.

The catalog remains keyed by the existing topic/order sequence used by `QuizPage.tsx`:

| Topic | Display names in game order |
| --- | --- |
| Colors | Color Matching Game; Balloon Finding Game; Rainbow Color Catcher; Rainbow Color Adventure Deluxe; Rainbow Galaxy Explorer; Choose Which Color; Multiple Choice |
| Shapes | Shape Matching; Find the Shape; Monster Cafe; Shape Matcher; Shape Hunter; Shape Racing; Shape Wizard; Hungry Dinosaur |
| Sequencing | Arrange Numbers; Alphabet Express; Size Sorter; Shortest to Longest; Smallest to Biggest Cake; Surprise Sequencing; Mega Animal & Vehicle Builder; Pattern Academy; Sandwich Maker |
| Addition | Addition Adventure; Dice Addition Adventure; Star Math; Rainbow Addition Garden; Addition Fun; Count the Apples; Fruit Pop Math; Addition Adventure; Addition Round 2; Animal Safari; Under the Sea; Magic Carnival; Ice Cream Shop; Magic Pizza Chef; Star Catcher |
| Subtraction | Balloon Pop Subtraction; Fruit Subtraction; Gentle Math Drift; Subtraction Adventure; Subtraction Pop; Magical Dino Egg Hatchery; Farmyard Hide & Seek; Feed the Hippo; Space Blast |
| Numbers | Drag the Correct Number; Count & Match Adventure; Animal Pop; Feed the Hungry Monster; Whack-a-Mole; Deep Diver: Number Explorer; The Magic Toy Factory; Number Monster |
| Measurement | Slow & Fun Measurement; Small & Short; Heavy or Light?; The Tiny Builder's Ruler; Magic Rainbow Bridge; Growing Inchworm |
| Comparison | Paghahambing ng Mahaba, Mas Mahaba, Pinakamahaba; Pag-aayos ng Laki; Marami o Kaunti?; Mataas o Mababa?; Match Big & Small Letters; The Barnyard Balance; The Sky Explorer; The Mad Scientist's Liquid Lab; Which is Longer?; Heavy or Light?; Catch & Measure! |
| Clock | Time Adventure; Time Matcher; Drag the Matching Clock; Fill in the Missing Time; Daily Routine Time; Build the Clock; What Time Is It? |

The exact capitalization and punctuation will be kept consistent in the catalog and covered by tests. Emoji used only as decorative heading content will not be included in PDF/report strings so names remain readable and portable.

## Data flow and consumers

1. `GAME_CATALOG` remains the source of truth for assignment game cards and assigned-quiz PDF rows.
2. `buildTeacherClassReport` continues resolving each result through `getGameCatalogEntry(topicId, gameOrder)`, but now emits the literal catalog title.
3. Recent-pass report data will carry a resolved `gameTitle` alongside the stable `gameId`. Teacher recent-activity components will render `gameTitle` and use the ID only for React keys or internal identity.
4. The assigned-quiz PDF model will continue using `game.title` for its `Game title` column, which automatically gives it the actual name.
5. The classroom report PDF model will expose game-detail rows from the topic breakdown with the actual game title, so its game section cannot fall back to a raw identifier when game details are present.

## Fallback and compatibility behavior

- Unknown or malformed historical rows must not break a report. If no catalog entry can be resolved, use the existing stable `gameId` as a last-resort label.
- Known catalog entries must never use a generated `topicId-gameNumber` label.
- New catalog entries must be added explicitly with a display name rather than generated from topic/order.

## Testing

Add or update Deno tests to verify:

- The first, representative middle, and last catalog entries have actual names and none match the old generated pattern.
- Report aggregation emits the catalog title for a known result and preserves the raw ID only for an unknown result.
- Assigned-quiz PDF model rows contain the actual game title.
- Classroom report PDF model game rows contain the actual game title.
- Recent activity report payloads expose the resolved display title.

Run the targeted catalog, report, and PDF tests first, then the complete project test, typecheck, and build scripts required by the repository CI gate.

## Error handling

The change is display-only. Existing validation of game IDs and game orders remains authoritative. Title resolution should be null-safe and deterministic; a missing catalog entry produces a readable stable-ID fallback rather than throwing during report generation.
