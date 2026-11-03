# Subtraction Assigned Raw Score Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all nine subtraction games consume wrong assigned-quiz answers as scored items and report raw results out of five.

**Architecture:** Preserve each game’s existing state and feedback UI. Add an early `allowSkip === false` branch inside each answer handler so assigned mode advances after every answer, while the existing retry logic remains the free-play path. Gate only replay/reset controls in assigned mode and report `onComplete?.(score, MAX_SCORE)` from the assigned completion action.

**Tech Stack:** React, TypeScript, Vite, Deno source-level tests, npm scripts.

## Global Constraints

- Every assigned answer consumes exactly one item.
- Correct answers add one point; wrong answers add zero points.
- Assigned completion occurs after five answered items.
- Assigned continuation reports `(score, MAX_SCORE)`.
- Free Play retry, skip, and replay behavior remains unchanged.
- Do not stage or modify the unrelated `.tmp-shape-matching-build/` directory.

---

### Task 1: Add the subtraction scoring regression contract

**Files:**
- Modify: `test/subtraction-quiz-scoring.test.ts`

**Interfaces:**
- Consumes: the nine paths in `GAME_FILES` and each game’s `MAX_SCORE`/`allowSkip` source contract.
- Produces: failing assertions that every subtraction game has fixed assigned completion and no dynamic assigned maximum.

- [ ] **Step 1: Write the failing test**

Extend the existing terminal-completion test after the current callback assertions:

```ts
assertMatch(source, /if \(allowSkip === false\)/);
assertMatch(source, /newAttempts >= MAX_SCORE/);
assertMatch(source, /onComplete\?\.\(score, MAX_SCORE\)/);
assertEquals(source.includes("onComplete?.(score, attempts)"), false, `${fileName} must use the fixed assigned maximum`);
assertMatch(source, /allowSkip !== false &&/);
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `deno test --no-check --allow-read test/subtraction-quiz-scoring.test.ts`

Expected: FAIL on the first subtraction game because the existing handlers retry wrong answers and completion still reports `onComplete?.(score, attempts)`.

- [ ] **Step 3: Keep the test focused**

Retain the existing assertions for free-play completion callbacks, no-argument skip callbacks, and direct DOM-event bypass protection. Do not weaken or skip any existing test.

### Task 2: Fix standard choice and visual answer games

**Files:**
- Modify: `src/components/games/5-subtraction/SubtractionBalloon.tsx`
- Modify: `src/components/games/5-subtraction/FruitSubtraction.tsx`
- Modify: `src/components/games/5-subtraction/GentleMathDrift.tsx`
- Modify: `src/components/games/5-subtraction/SubtractionAdventure.tsx`
- Modify: `src/components/games/5-subtraction/SubtractionPop.tsx`

**Interfaces:**
- Consumes: each component’s current answer handler, `attempts`, `score`, `currentQuestion`, `generateQuestion`, and `MAX_SCORE` state.
- Produces: fixed five-item assigned-mode progression while leaving the existing free-play branch intact.

- [ ] **Step 1: Add the assigned-mode branch after attempts increment**

For handlers receiving a numeric or option object answer, bind `answerValue` to the existing answer parameter (`selected` or `opt.value`), calculate `isCorrect`, update score only when true, show feedback, increment `currentQuestion`, and return after scheduling the next item:

```tsx
if (allowSkip === false) {
    const isCorrect = answerValue === correctAnswer;
    const newScore = score + (isCorrect ? 1 : 0);
    setScore(newScore);
    setMessage({
        text: isCorrect ? 'Correct! 🎉' : 'That answer is incorrect.',
        type: isCorrect ? 'success' : 'error',
    });
    setCurrentQuestion(q => q + 1);
    setTimeout(() => {
        if (newAttempts >= MAX_SCORE) {
            setIsCompleted(true);
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        } else {
            generateQuestion();
        }
    }, 1200);
    return;
}
```

For balloon/drift/pop variants, also reset their per-item visual state through `generateQuestion()` after non-final feedback. For `SubtractionAdventure`, set its completed state instead of `isCompleted` and preserve its menu/back gating.

- [ ] **Step 2: Fix assigned completion and replay controls**

Change each assigned completion callback to:

```tsx
onClick={() => onComplete?.(score, MAX_SCORE)}
```

Wrap each completion-screen replay button with `{allowSkip !== false && ...}`. Keep active answer buttons and the free-play no-argument skip button available.

- [ ] **Step 3: Run the focused regression test**

Run: `deno test --no-check --allow-read test/subtraction-quiz-scoring.test.ts`

Expected: the five updated games satisfy the new assertions; the remaining four games still identify the same missing contract.

### Task 3: Fix interactive nest, farm, hippo, and space games

**Files:**
- Modify: `src/components/games/5-subtraction/DinoEgg.tsx`
- Modify: `src/components/games/5-subtraction/FarmHideSeek.tsx`
- Modify: `src/components/games/5-subtraction/FeedTheHippo.tsx`
- Modify: `src/components/games/5-subtraction/SpaceBlast.tsx`

**Interfaces:**
- Consumes: each component’s existing interactive answer lock/wrong-selection state and `generateQuestion` function.
- Produces: assigned mode that advances after either a correct or wrong interaction, with existing free-play wrong-choice behavior preserved.

- [ ] **Step 1: Add assigned handling before free-play retry handling**

After `newAttempts` and its state update, add an assigned branch to each existing handler. The branch must compute `isCorrect` from the handler’s current answer value, add `isCorrect ? 1 : 0` to score, advance the item, and complete on `newAttempts >= MAX_SCORE`:

- `DinoEgg.handleTapNest(id, count)`: use `count === targetAnswer`, update the tapped nest’s hatched/wrong visual, then call `generateQuestion()` for non-final items.
- `FarmHideSeek.checkAnswer(selected)`, `FeedTheHippo.checkAnswer(selected)`, and `SpaceBlast.checkAnswer(selected)`: use `selected === num1 - num2`, preserve each game’s wrong-choice/answer-lock visual state, then call `generateQuestion()` for non-final items.
- For every game, set `isCompleted` (and any existing prize/confetti state) on the fifth answer, return before the free-play retry branch, and leave free-play wrong-choice blocking unchanged.

- [ ] **Step 2: Fix completion callbacks and replay buttons**

Use `onComplete?.(score, MAX_SCORE)` for assigned Continue actions and gate completion-screen Repeat buttons with `allowSkip !== false`. Do not gate the active answer controls.

- [ ] **Step 3: Run the focused regression test**

Run: `deno test --no-check --allow-read test/subtraction-quiz-scoring.test.ts`

Expected: all subtraction scoring and strict-mode source assertions pass.

### Task 4: Run repository verification

**Files:**
- Test: `test/subtraction-quiz-scoring.test.ts`
- Verify: all modified subtraction components and the approved design/plan documents.

**Interfaces:**
- Consumes: completed Tasks 1–3.
- Produces: verified subtraction behavior ready for review or commit.

- [ ] **Step 1: Run targeted subtraction tests**

Run: `deno test --no-check --allow-read test/subtraction-quiz-scoring.test.ts`

Expected: all subtraction tests pass.

- [ ] **Step 2: Run typecheck and build**

Run: `npm.cmd run typecheck`

Expected: TypeScript exits 0.

Run: `npm.cmd run build`

Expected: Vite exits 0; existing CSS/chunk-size warnings may remain non-blocking.

- [ ] **Step 3: Run the full suite**

Run: `deno test --no-check --allow-read --allow-env test`

Expected: subtraction and all unrelated suites pass; report any known pre-existing failures without changing them.

- [ ] **Step 4: Review repository state**

Run: `git diff --check` and `git status --short`.

Expected: no whitespace errors; only intended subtraction files and test changes are modified, with `.tmp-shape-matching-build/` still untracked and untouched.
