# Comparison Quiz Mode Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every comparison game behave as a fixed, one-attempt-per-item classroom quiz while preserving free-play retries and replay.

**Architecture:** Keep the existing `allowSkip === false` classroom-mode signal. Each game will count an answered item separately from correct score, advance after either a correct or incorrect response, submit a fixed per-game maximum, and hide replay/bypass controls in classroom mode. Position-based games will retain their existing per-position scoring rules.

**Tech Stack:** React, TypeScript, Framer Motion, Deno source-contract tests, Vite.

## Global Constraints

- Classroom quiz mode is identified by `allowSkip === false`.
- Every wrong answer consumes the current classroom quiz item and advances.
- Classroom completion reports `score` and the fixed item maximum, not an attempt count.
- Classroom mode hides replay and active-game bypass controls.
- Free play retains its existing retry, skip, and replay behavior.
- Each affected game receives at least four substantive commits: failing wrong-item test, wrong-item fix, failing completion-controls test, and completion-controls fix.

---

### Task 1: Add comparison quiz regression tests

**Files:**
- Modify: `test/comparison-quiz-scoring.test.ts`
- Modify: `test/src/components/comparison-skip-layout.test.ts` only if a shared control contract needs expansion

- [ ] **Step 1: Add one wrong-item test and one completion-controls test per affected game.**

  The wrong-item assertions must require an answered-item counter and an assigned-mode branch that advances or completes after the fixed maximum. The completion assertions must require a fixed callback maximum, assigned replay gating, and a classroom-only Next Game action.

- [ ] **Step 2: Run the comparison tests and confirm the new assertions fail against the current implementations.**

  Run: `deno test --allow-read test/comparison-quiz-scoring.test.ts`

  Expected: existing scoring tests pass, while the new per-game quiz-behavior assertions fail because wrong answers retry and/or replay remains visible.

- [ ] **Step 3: Commit the regression tests.**

  Use one test commit per game so every game begins its required four-commit series.

---

### Task 2: Fix `AyusinAngLaki.tsx`

**Files:**
- Modify: `src/components/games/8-comparison/AyusinAngLaki.tsx`
- Test: `test/comparison-quiz-scoring.test.ts`

- [ ] **Step 1: Make each wrong assigned size placement consume its position and advance to the next round.**
- [ ] **Step 2: Report `score` with the fixed `MAX_SCORE * 3` maximum and hide assigned replay.**
- [ ] **Step 3: Run the focused comparison test and commit the production changes.**

  Run: `deno test --allow-read test/comparison-quiz-scoring.test.ts`

---

### Task 3: Fix `BarnyardBalance.tsx`, `CatchFall.tsx`, and `MadScientist.tsx`

**Files:**
- Modify: `src/components/games/8-comparison/BarnyardBalance.tsx`
- Modify: `src/components/games/8-comparison/CatchFall.tsx`
- Modify: `src/components/games/8-comparison/MadScientist.tsx`
- Test: `test/comparison-quiz-scoring.test.ts`

- [ ] **Step 1: Make wrong clicks/catches consume assigned items and advance.**
- [ ] **Step 2: Gate assigned replay and submit fixed maxima for each game.**
- [ ] **Step 3: Run focused tests and keep each game’s four commits separate.**

  Run: `deno test --allow-read test/comparison-quiz-scoring.test.ts`

---

### Task 4: Fix `MaramiKaunti.tsx`, `MataasMababa.tsx`, and `Paghahambing1.tsx`

**Files:**
- Modify: `src/components/games/8-comparison/MaramiKaunti.tsx`
- Modify: `src/components/games/8-comparison/MataasMababa.tsx`
- Modify: `src/components/games/8-comparison/Paghahambing1.tsx`
- Test: `test/comparison-quiz-scoring.test.ts`

- [ ] **Step 1: Make wrong assigned choices consume one item and advance.**
- [ ] **Step 2: Gate replay and use fixed classroom maxima in completion callbacks.**
- [ ] **Step 3: Run focused tests and commit each game’s test/fix/control series independently.**

  Run: `deno test --allow-read test/comparison-quiz-scoring.test.ts`

---

### Task 5: Fix `MatchingTypeA.tsx`

**Files:**
- Modify: `src/components/games/8-comparison/MatchingTypeA.tsx`
- Test: `test/comparison-quiz-scoring.test.ts`

- [ ] **Step 1: Consume wrong assigned matches without allowing the same pair to be retried indefinitely.**
- [ ] **Step 2: Submit the fixed match maximum and hide assigned replay.**
- [ ] **Step 3: Run the focused test and complete the four-commit series.**

  Run: `deno test --allow-read test/comparison-quiz-scoring.test.ts`

---

### Task 6: Fix `SkyExplorer.tsx`, `WhichIsComp.tsx`, and `WhichIsLonger.tsx`

**Files:**
- Modify: `src/components/games/8-comparison/SkyExplorer.tsx`
- Modify: `src/components/games/8-comparison/WhichIsComp.tsx`
- Modify: `src/components/games/8-comparison/WhichIsLonger.tsx`
- Test: `test/comparison-quiz-scoring.test.ts`

- [ ] **Step 1: Consume wrong assigned daytime/size choices and advance.**
- [ ] **Step 2: Gate replay and submit fixed classroom maxima.**
- [ ] **Step 3: Run focused tests and complete each game’s four-commit series.**

  Run: `deno test --allow-read test/comparison-quiz-scoring.test.ts`

---

### Task 7: Verify the comparison roster and application

**Files:**
- Test: `test/comparison-quiz-scoring.test.ts`
- Test: `test/src/components/comparison-skip-layout.test.ts`
- Test: `test/src/pages/QuizPage.test.ts`

- [ ] **Step 1: Run all comparison and assigned-quiz tests.**

  Run: `deno test --allow-read test/comparison-quiz-scoring.test.ts test/src/components/comparison-skip-layout.test.ts test/src/pages/QuizPage.test.ts`

- [ ] **Step 2: Run typecheck and production build.**

  Run: `npm run typecheck`
  Run: `npm run build`

- [ ] **Step 3: Confirm each affected game has at least four substantive commits and confirm free-play branches remain available.**

  Run: `git log --oneline -- src/components/games/8-comparison`

