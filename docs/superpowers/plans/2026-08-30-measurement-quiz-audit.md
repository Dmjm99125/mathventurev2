# Measurement Assigned Quiz Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all six measurement games enforce fixed-item assigned quiz scoring and classroom-only navigation rules without changing free play.

**Architecture:** Each game keeps its existing local state and visual identity, but assigned mode gets an explicit answered-item boundary. The game calls `onComplete(score, fixedMaxScore)` only through the classroom completion control after the boundary is reached; free play retains its existing auto-completion and retry path. The parent `QuizPage` contract is unchanged.

**Tech Stack:** React, TypeScript, Framer Motion, Deno source-contract tests, npm TypeScript/build checks.

## Global Constraints

- Assigned mode is `allowSkip === false`.
- Every wrong assigned response consumes one quiz item and contributes zero points.
- Assigned completion uses a fixed game maximum, never the number of attempts.
- Assigned mode must not expose replay, reset, back, or skip bypasses.
- Free-play retry, replay, skip, and setup behavior must remain available.
- Do not add `DrawingCanvas` to the classroom route.
- Each game must land at least four meaningful commits: failing tests, wrong-item implementation, control/completion tests, and control/completion implementation.

---

### Task 1: SlowFun assigned quiz contract

**Files:**
- Modify: `src/components/games/7-measurement/SlowFun.tsx`
- Test: `test/measurement-quiz-scoring.test.ts` or a dedicated `test/slow-fun-quiz.test.ts`
- Test: `test/src/components/measurement-skip-layout.test.ts`

**Requirements:** Use a fixed assigned item count of five. A wrong mole consumes the current item and schedules the next round; assigned mode must not show the setup Back/reset bypass or Play Again. Completion passes `score` and `5`. Free play retains retry behavior.

**Commit sequence:**
- [ ] Write and commit a failing test for wrong assigned mole consumption.
- [ ] Implement and commit assigned wrong-item advancement.
- [ ] Write and commit failing tests for fixed completion and hidden assigned controls.
- [ ] Implement and commit fixed completion/control behavior.

---

### Task 2: SmallShort assigned quiz contract

**Files:**
- Modify: `src/components/games/7-measurement/SmallShort.tsx`
- Test: `test/measurement-quiz-scoring.test.ts` or a dedicated `test/small-short-quiz.test.ts`
- Test: `test/src/components/measurement-skip-layout.test.ts`

**Requirements:** Use a fixed assigned item count of ten. Both BIG and SMALL selections consume the item; a wrong selection advances instead of displaying a retry-only state. Assigned completion passes `score` and `10`, hides Play Again, and leaves free-play retry intact.

**Commit sequence:**
- [ ] Write and commit a failing test for wrong assigned size consumption.
- [ ] Implement and commit assigned wrong-item advancement.
- [ ] Write and commit failing tests for fixed completion and hidden replay.
- [ ] Implement and commit fixed completion/control behavior.

---

### Task 3: LightHeavy assigned quiz contract

**Files:**
- Modify: `src/components/games/7-measurement/LightHeavy.tsx`
- Test: `test/measurement-quiz-scoring.test.ts` or a dedicated `test/light-heavy-quiz.test.ts`
- Test: `test/src/components/measurement-skip-layout.test.ts`

**Requirements:** Use a fixed assigned item count of ten. Correct and wrong choices each consume one item; assigned completion is based on answered items, with `score` and `10` reported. Hide assigned replay/reset controls while preserving free-play retries.

**Commit sequence:**
- [ ] Write and commit a failing test for wrong assigned weight consumption.
- [ ] Implement and commit assigned item counting/advancement.
- [ ] Write and commit failing tests for fixed completion and hidden replay.
- [ ] Implement and commit fixed completion/control behavior.

---

### Task 4: TinyBuilderRuler assigned quiz contract

**Files:**
- Modify: `src/components/games/7-measurement/TinyBuilderRuler.tsx`
- Test: `test/measurement-quiz-scoring.test.ts` or a dedicated `test/tiny-builder-ruler-quiz.test.ts`
- Test: `test/src/components/measurement-skip-layout.test.ts`

**Requirements:** Use a fixed assigned item count of ten. A wrong length choice consumes the item and immediately generates the next item; do not permit multiple guesses for one assigned item. Assigned completion passes `score` and `10`, hides replay, and free play retains multiple guesses/retry behavior.

**Commit sequence:**
- [ ] Write and commit a failing test for wrong assigned length consumption.
- [ ] Implement and commit assigned one-response-per-item behavior.
- [ ] Write and commit failing tests for fixed completion and hidden replay.
- [ ] Implement and commit fixed completion/control behavior.

---

### Task 5: MagicRainbowBridge assigned quiz contract

**Files:**
- Modify: `src/components/games/7-measurement/MagicRainbowBridge.tsx`
- Test: `test/measurement-quiz-scoring.test.ts` or a dedicated `test/magic-rainbow-bridge-quiz.test.ts`
- Test: `test/src/components/magic-rainbow-bridge-target-bounds.test.ts`
- Test: `test/src/components/measurement-skip-layout.test.ts`

**Requirements:** Use a fixed assigned item count of ten. Every release consumes one item, including too-short and too-long measurements; assigned completion is based on answered items, reports the current score and `10`, and hides replay. Correct the stale final-attempt reporting in free play. Preserve the board interaction and mobile layout.

**Commit sequence:**
- [ ] Write and commit a failing test for assigned release consumption and final-attempt reporting.
- [ ] Implement and commit assigned item accounting.
- [ ] Write and commit failing tests for fixed completion, hidden replay, and skip layout contract.
- [ ] Implement and commit fixed completion/control/layout behavior.

---

### Task 6: SnakeGame assigned quiz contract

**Files:**
- Modify: `src/components/games/7-measurement/SnakeGame.tsx`
- Test: `test/measurement-quiz-scoring.test.ts` or a dedicated `test/snake-game-quiz.test.ts`
- Test: `test/src/components/growing-inchworm-mobile-scroll.test.ts`
- Test: `test/src/components/measurement-skip-layout.test.ts`

**Requirements:** Use a fixed assigned target of five food items. A collision is a wrong terminal item and must count in the assigned result without exposing Play Again. Render exactly one classroom Continue action after collision, with a fixed maximum of `5`; successful completion also reports `score` and `5`. Free play keeps its collision replay behavior and mobile controls.

**Commit sequence:**
- [ ] Write and commit a failing test for collision scoring and replay suppression.
- [ ] Implement and commit assigned collision/result behavior.
- [ ] Write and commit failing tests for successful fixed completion and single Continue control.
- [ ] Implement and commit fixed completion/control behavior.

---

### Task 7: Integrated verification

**Files:**
- Modify: none unless test contracts need a targeted correction
- Test: all measurement-focused tests

- [ ] Run the complete measurement focused suite and confirm all measurement tests pass.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Run the full repository test suite and report unrelated failures separately.
- [ ] Confirm `git status` contains no generated changes beyond the pre-existing `.tmp-shape-matching-build/` directory.
