# Subtraction Assigned-Quiz Raw Scoring

## Goal

Make every subtraction game behave consistently in assigned quiz mode: each submitted answer consumes exactly one item, correct answers add one point, wrong answers add zero points, and the final result is reported as a raw score out of the fixed game maximum.

## Scope

Apply the behavior to all nine subtraction games routed by `QuizPage`:

- SubtractionBalloon
- FruitSubtraction
- GentleMathDrift
- SubtractionAdventure
- SubtractionPop
- DinoEgg
- FarmHideSeek
- FeedTheHippo
- SpaceBlast

Free Play behavior remains unchanged, including retry feedback and replay controls.

## Behavior

When `allowSkip === false`:

1. Every answer interaction increments the answered-item count.
2. A correct answer increments the score; a wrong answer does not.
3. The game advances to a fresh question after feedback, regardless of correctness.
4. The game completes after five answered items.
5. The Continue action reports `(score, MAX_SCORE)` rather than using attempts as the denominator.
6. Replay and bypass controls remain unavailable.

When `allowSkip !== false`, existing free-play retry and no-argument skip behavior is preserved.

## Implementation and Testing

Use the existing per-game state and interaction flows, adding a strict assigned-mode branch rather than refactoring all game implementations into a shared abstraction. Extend `test/subtraction-quiz-scoring.test.ts` to require fixed assigned completion, raw-score callbacks, and assigned replay gating for every game. Run the targeted subtraction test, typecheck, build, and the full test suite; unrelated pre-existing failures will be reported separately.
