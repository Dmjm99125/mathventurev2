# All-Topic Assigned Quiz Audit Implementation Plan

> **For agentic workers:** Use test-first development and verify each topic batch before moving to the next. Steps use checkbox syntax for tracking.

**Goal:** Make every classroom-assigned quiz topic score wrong answers as zero, use a stable game-specific maximum, and preserve free-play retry/replay behavior.

**Architecture:** Keep each game’s existing interaction and visual flow. Assigned mode remains `allowSkip === false`; only its round advancement and completion callback change where the audit finds a violation. `QuizPage` remains the owner of aggregate scoring, detailed game-result persistence, checkpoints, and final submission.

**Tech Stack:** React, TypeScript, Deno source-contract tests, npm TypeScript/build checks.

## Scoring contract

- A classroom-assigned answer consumes exactly one item, whether correct or wrong.
- Correct answers add one point; wrong answers add zero.
- Assigned completion reports `onComplete(score, fixedMaxScore)`, never `onComplete(score, attempts)`.
- Free play keeps its current retry-until-correct, replay, skip, and setup behavior.
- Existing position-based scoring in Sequencing and Comparison is preserved where it already models partial placement correctly.
- Drawing-board activities remain Free Play-only.

## Topic batches

### Batch 1: Addition

- Audit the fixed-round replacement game and the retry-until-correct games.
- Add failing source-contract tests proving wrong assigned answers advance and completion uses the existing fixed maximum.
- Patch assigned branches only; keep free-play retry feedback and skip controls.

### Batch 2: Subtraction

- Audit all nine games for wrong-answer retry loops and attempt-based completion maxima.
- Add failing tests for wrong assigned choices, fixed maxima, and replay isolation.
- Patch shared patterns carefully while preserving game-specific answer-lock and animation behavior.

### Batch 3: Numbers

- Audit CountMatch, DeepDive, DragCorrectNumber, NumberMonster, NumberReplacementGame, and ToyFactory.
- Convert assigned completion from attempt-based maxima to each game’s fixed item total where needed.
- Ensure wrong selections consume an item rather than requiring retry; leave replacement wrapper games unchanged except for forwarding assigned mode.

### Batch 4: Existing stronger contracts

- Re-check Colors, Shapes, Sequencing, Measurement, Comparison, and Clock against the same contract.
- Add regression tests only where current coverage misses a concrete path, such as final-answer ordering or a drag/tap alternative.
- Preserve specialized scoring models such as positional placement and collision-bounded results.

### Batch 5: Integrated verification

- Run the focused topic tests and full test command if the Deno executable is available.
- Run `npm.cmd run typecheck` and `npm.cmd run build`.
- Inspect `git diff --check` and preserve unrelated working-tree changes.
