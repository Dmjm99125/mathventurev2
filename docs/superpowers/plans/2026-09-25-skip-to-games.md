# Skip to Games from Lesson Stages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let every learner skip the video and lesson stages and continue to the existing games introduction screen.

**Architecture:** Keep the existing `QuizPage` stage state machine. Add a `skipToGames` handler that sets `gameState` to `quiz-intro`, then render the same unconditional `Skip to games` button in the video and lesson stage navigation. The existing games introduction screen continues to own the Start/Resume transition, scoring, and assignment persistence.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Deno source-contract tests, Wouter.

## Global Constraints

- The video stage shows a `Skip to games` action alongside `Next: Lesson`.
- The lesson stage shows a `Skip to games` action alongside its existing slide navigation.
- Activating either action moves to the existing `quiz-intro` state.
- The action is available in both free-play and assigned-quiz contexts.
- Do not alter game behavior, assigned-quiz restrictions, attempt recording, lesson content, routes, or the existing exit action.
- Preserve all existing tests and CI quality gates; do not use focused/skipped tests or weakened assertions.

## File Map

- Modify `frontend/test/src/pages/QuizPage.test.ts`: add a source-contract regression test for the shared skip handler and both instructional-stage buttons.
- Modify `frontend/src/pages/QuizPage.tsx`: add the handler and render the two buttons.

### Task 1: Add the failing regression test

**Files:**
- Modify: `frontend/test/src/pages/QuizPage.test.ts`

**Interfaces:**
- Consumes: the existing `QuizPage.tsx` source-contract test pattern.
- Produces: a regression test that requires a shared `skipToGames` handler, the `quiz-intro` transition, and two visible `Skip to games` actions.

- [ ] **Step 1: Append the focused source-contract test**

Add this test to `frontend/test/src/pages/QuizPage.test.ts`:

```ts
Deno.test("video and lesson stages let every learner skip to the games intro", async () => {
  const source = await Deno.readTextFile(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("const skipToGames = () => {"), true);
  assertEquals(source.includes("setGameState('quiz-intro');"), true);
  assertEquals(source.includes("Skip to games"), true);
  assertEquals((source.match(/onClick=\{skipToGames\}/g) ?? []).length, 2);
  assertEquals(source.includes("!isAssignedQuiz && skipToGames"), false);
});
```

- [ ] **Step 2: Run the focused test and verify it fails for the missing behavior**

Run from `frontend/`:

```text
deno test --allow-read --allow-env --import-map=deno.json test/src/pages/QuizPage.test.ts
```

Expected: FAIL in the new test because `QuizPage.tsx` does not yet define `skipToGames` or render two `onClick={skipToGames}` controls. Existing tests should continue to run and pass.

### Task 2: Implement the shared skip action in both instructional stages

**Files:**
- Modify: `frontend/src/pages/QuizPage.tsx:230-255, 520-575, 590-650` (line ranges approximate; locate by the existing stage helpers and render branches)

**Interfaces:**
- Consumes: the existing `gameState` setter and the `Button`/`ChevronRight` imports.
- Produces: a local `skipToGames(): void` handler and two unconditional buttons that transition to `quiz-intro`.

- [ ] **Step 1: Add the minimal stage helper**

Immediately after `goToQuiz`, add:

```tsx
  const skipToGames = () => {
    setGameState('quiz-intro');
  };
```

Do not call `startGame`, reset scores, change `currentIndex`, or branch on `isAssignedQuiz`; skipping instruction must still land on the existing games introduction/resume screen for every learner.

- [ ] **Step 2: Add the video-stage button**

Replace the video stage's single-button navigation wrapper with a two-button row that preserves `Next: Lesson` and adds the unconditional skip action:

```tsx
          <div className="flex w-full flex-col justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              variant="jungle"
              className="gap-2 text-lg h-14 px-8 rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
              onClick={goToLesson}
            >
              Next: Lesson <ChevronRight className="h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 text-lg h-14 px-8 rounded-full"
              onClick={skipToGames}
            >
              Skip to games <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
```

- [ ] **Step 3: Add the lesson-stage button**

Keep the existing responsive slide-navigation grid unchanged, then add this full-width control immediately after it and before the closing lesson-stage containers:

```tsx
          <Button
            variant="outline"
            size="lg"
            className="w-full max-w-2xl gap-2 font-bold"
            onClick={skipToGames}
          >
            Skip to games <ChevronRight className="h-5 w-5" />
          </Button>
```

This makes the action available on every lesson slide, including the final slide, without replacing Back, Next, or Start Activities.

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```text
deno test --allow-read --allow-env --import-map=deno.json test/src/pages/QuizPage.test.ts
```

Expected: PASS, including the new skip regression test and all existing `QuizPage` source-contract tests.

- [ ] **Step 5: Commit the feature change**

```text
git add frontend/src/pages/QuizPage.tsx frontend/test/src/pages/QuizPage.test.ts
git commit -m "feat: allow learners to skip lesson instruction"
```

### Task 3: Run the complete frontend quality gates

**Files:**
- No source changes expected.

- [ ] **Step 1: Run the full frontend test lane**

From the repository root:

```text
npm test
```

Expected: exit code 0 with no failing Deno tests.

- [ ] **Step 2: Run the TypeScript check**

```text
npm run typecheck
```

Expected: exit code 0 with no TypeScript diagnostics.

- [ ] **Step 3: Run the production build**

```text
npm run build
```

Expected: exit code 0 with a successful Vite production bundle.

- [ ] **Step 4: Inspect the final diff and preserve unrelated worktree changes**

```text
git diff HEAD~1..HEAD --stat
git status --short
```

Confirm the feature commit contains only `QuizPage.tsx` and its focused test, while the pre-existing dirty files remain untouched and unstaged.
