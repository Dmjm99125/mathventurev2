# Sequencing Free Play Replay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep every sequencing Free Play game on its completion screen after the final placement so the player can repeat that same game instead of being moved automatically to the next game.

**Architecture:** Preserve the existing `QuizPage` completion contract and the nine sequencing components' explicit next-game and replay controls. Remove only the `allowSkip`-guarded parent completion calls that run automatically from final-item success handlers; assigned-quiz completion callbacks remain on the explicit assigned continuation buttons.

**Tech Stack:** React 19, TypeScript, Vite, Deno tests, existing source-contract tests.

## Global Constraints

- This change is limited to sequencing Free Play completion behavior.
- Do not alter the shared quiz page, other topics' Free Play behavior, assigned quiz semantics, scoring formulas, or game content.
- Assigned quizzes keep their existing scoring and progression callbacks.
- Preserve explicit header next-game controls and existing same-game Free Play replay actions.
- Keep all existing test coverage; do not skip, focus, weaken, or swallow failures.
- Run the focused sequencing tests, frontend typecheck, frontend build, and full frontend test suite before completion.

---

## File Map

- Modify `frontend/test/sequencing-quiz-scoring.test.ts`: replace the stale assertion that requires automatic Free Play completion with assertions that prohibit that callback and preserve replay/explicit navigation controls.
- Modify `frontend/src/components/games/3-sequencing/ArrangeNumbers.tsx`: remove the automatic `onComplete` call from the final number-placement branch.
- Modify `frontend/src/components/games/3-sequencing/ArrangeLetters.tsx`: remove the automatic `onComplete` call from the final letter-placement branch.
- Modify `frontend/src/components/games/3-sequencing/SizeSorter.tsx`: remove the automatic `onComplete` call from the final size-placement branch.
- Modify `frontend/src/components/games/3-sequencing/ShortestLongest.tsx`: remove the automatic `onComplete` call from the final size-placement branch.
- Modify `frontend/src/components/games/3-sequencing/SmallestLargestCake.tsx`: remove the automatic `onComplete` call from the final cake-size placement branch.
- Modify `frontend/src/components/games/3-sequencing/SurpriseSequencing.tsx`: remove the automatic `onComplete` call from the final level branch.
- Modify `frontend/src/components/games/3-sequencing/AnimalVehicleBuilder.tsx`: remove the automatic `onComplete` call from the final puzzle branch.
- Modify `frontend/src/components/games/3-sequencing/PatternTrainAcademy.tsx`: remove the automatic `onComplete` call from the final train-level timeout branch.
- Modify `frontend/src/components/games/3-sequencing/SandwichMaker.tsx`: remove the automatic `onComplete` call from the final recipe-level branch.

### Task 1: Add the failing sequencing replay regression test

**Files:**
- Modify: `frontend/test/sequencing-quiz-scoring.test.ts:80-98`

**Interfaces:**
- Consumes: the existing `GAME_FILES` list and `readGameSource` helper.
- Produces: a test that fails against the current automatic callback in every sequencing game and protects the existing replay/explicit navigation controls.

- [ ] **Step 1: Replace the automatic-callback assertion and add replay assertions.**

Replace the current assertion that requires
`onComplete?.(correctItems + 1, correctItems + wrongAttempts + 1);` with:

```ts
    assertEquals(
      source.includes("onComplete?.(correctItems + 1, correctItems + wrongAttempts + 1);"),
      false,
      `${fileName} should not auto-advance Free Play after its final item`,
    );
    assertEquals(
      source.includes("onClick={allowSkip ?"),
      true,
      `${fileName} should keep an explicit same-game Free Play replay action`,
    );
```

Keep the adjacent assertions for the assigned completion score callback,
no-argument explicit callbacks, and all earlier scoring checks unchanged.

- [ ] **Step 2: Run the focused test and verify it fails for the current bug.**

Run from `frontend`:

```powershell
deno test --no-check --allow-read --import-map=deno.json test/sequencing-quiz-scoring.test.ts
```

Expected: `FAIL`, with the new no-auto-advance assertion failing because the
current nine files still contain the automatic callback string. Do not change
production code before observing this failure.

### Task 2: Remove automatic Free Play advancement from all sequencing games

**Files:**
- Modify: `frontend/src/components/games/3-sequencing/ArrangeNumbers.tsx`
- Modify: `frontend/src/components/games/3-sequencing/ArrangeLetters.tsx`
- Modify: `frontend/src/components/games/3-sequencing/SizeSorter.tsx`
- Modify: `frontend/src/components/games/3-sequencing/ShortestLongest.tsx`
- Modify: `frontend/src/components/games/3-sequencing/SmallestLargestCake.tsx`
- Modify: `frontend/src/components/games/3-sequencing/SurpriseSequencing.tsx`
- Modify: `frontend/src/components/games/3-sequencing/AnimalVehicleBuilder.tsx`
- Modify: `frontend/src/components/games/3-sequencing/PatternTrainAcademy.tsx`
- Modify: `frontend/src/components/games/3-sequencing/SandwichMaker.tsx`

**Interfaces:**
- Consumes: each component's existing `allowSkip`, `onComplete`, local completion state, explicit header control, and Free Play replay control.
- Produces: sequencing components that render their local completion/replay UI after Free Play completion and only call the parent from explicit controls or assigned continuation paths.

- [ ] **Step 1: Remove the automatic callback from the five single-sequence games.**

In each of `ArrangeNumbers.tsx`, `ArrangeLetters.tsx`, `SizeSorter.tsx`,
`ShortestLongest.tsx`, and `SmallestLargestCake.tsx`, remove only this nested
block from the final-item success condition:

```tsx
        if (allowSkip) {
          onComplete?.(correctItems + 1, correctItems + wrongAttempts + 1);
        }
```

Leave the state updates, score updates, confetti, error handling, completion
panel, header next-game button, and assigned completion callback unchanged.

- [ ] **Step 2: Remove the automatic callback from the four multi-level games.**

In `SurpriseSequencing.tsx`, `AnimalVehicleBuilder.tsx`, and
`SandwichMaker.tsx`, remove the same nested `if (allowSkip)` block from the
final level branch. In `PatternTrainAcademy.tsx`, remove that same block from
the `level === 11` callback inside its existing timeout. Keep each component's
level transitions, final local completion state, explicit header next-game
button, and Free Play replay action unchanged.

- [ ] **Step 3: Confirm the production diff is limited to the planned callback removals.**

Run:

```powershell
git diff -- frontend/src/components/games/3-sequencing frontend/test/sequencing-quiz-scoring.test.ts
```

Expected: the test assertion changes plus removal of exactly one automatic
`onComplete?.(correctItems + 1, correctItems + wrongAttempts + 1);` callback
from each of the nine sequencing files. No `QuizPage.tsx` or other-topic file
should appear in the diff.

- [ ] **Step 4: Run the focused sequencing test and verify it passes.**

Run from `frontend`:

```powershell
deno test --no-check --allow-read --import-map=deno.json test/sequencing-quiz-scoring.test.ts
```

Expected: all sequencing tests pass, including the new no-auto-advance and
replay assertions.

### Task 3: Run the complete affected frontend gates

**Files:**
- No additional files; verify the Task 1 and Task 2 changes.

**Interfaces:**
- Consumes: the nine updated sequencing components and their focused test.
- Produces: fresh evidence that sequencing behavior, TypeScript compilation,
  production bundling, and the complete frontend test suite remain green.

- [ ] **Step 1: Run frontend typecheck.**

From the repository root, run:

```powershell
npm.cmd run typecheck
```

Expected: exit code `0` with no TypeScript errors.

- [ ] **Step 2: Run the production build.**

From the repository root, run:

```powershell
npm.cmd run build
```

Expected: exit code `0` and a completed Vite production build.

- [ ] **Step 3: Run the full frontend test suite.**

From the repository root, run:

```powershell
npm.cmd test
```

Expected: exit code `0` with no failed or skipped test lanes.

- [ ] **Step 4: Review the final diff and status.**

Run:

```powershell
git diff --check
git diff --stat
git status --short
```

Confirm that only the approved sequencing test and nine sequencing component
files are modified after the already-committed design/plan documents, and
that unrelated pre-existing untracked files remain untouched.

- [ ] **Step 5: Commit the implementation.**

Run:

```powershell
git add frontend/test/sequencing-quiz-scoring.test.ts frontend/src/components/games/3-sequencing/ArrangeNumbers.tsx frontend/src/components/games/3-sequencing/ArrangeLetters.tsx frontend/src/components/games/3-sequencing/SizeSorter.tsx frontend/src/components/games/3-sequencing/ShortestLongest.tsx frontend/src/components/games/3-sequencing/SmallestLargestCake.tsx frontend/src/components/games/3-sequencing/SurpriseSequencing.tsx frontend/src/components/games/3-sequencing/AnimalVehicleBuilder.tsx frontend/src/components/games/3-sequencing/PatternTrainAcademy.tsx frontend/src/components/games/3-sequencing/SandwichMaker.tsx
git commit -m "fix: keep sequencing free play repeatable"
```

Expected: one non-empty implementation commit containing only the approved
sequencing behavior and regression test.
