# Click-Based Colors Matching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Colors matching game's drag-and-drop interaction with a touchscreen-friendly click-to-select, click-to-match interaction.

**Architecture:** Reuse `ColorMatchingGame`'s existing `selectedItemId` state and `handleMatch(colorId)` scoring path. Remove only the native drag source/drop-zone handlers and update the instruction and interaction affordance; all scoring, assigned-quiz, free-play, and navigation behavior remains unchanged.

**Tech Stack:** React 19, TypeScript, Vite, Deno tests with `@std/assert`, npm scripts.

## Global Constraints

- Keep the change limited to the Colors matching game and its focused regression test.
- Preserve assigned-quiz completion, wrong-item handling, free-play rounds, scoring, and navigation behavior.
- Do not add dependencies or change global touch handling.
- Follow TDD: the new regression test must fail against the current drag-enabled source before production code is changed.
- Run targeted checks first, then the complete relevant frontend CI-equivalent checks: typecheck, tests, and production build.

## File Map

- Modify `frontend/test/colors-quiz-scoring.test.ts`: add a source-level regression test for click-only interaction.
- Modify `frontend/src/components/games/1-colors/ColorMatchingGame.tsx`: remove native drag/drop behavior and update the learner-facing instruction and cursor.

### Task 1: Add the click-only regression test

**Files:**
- Modify: `frontend/test/colors-quiz-scoring.test.ts` after the existing `ColorMatchingGame` interaction tests.

**Interfaces:**
- Consumes: `readSource(relativePath)` and the existing `assertEquals`/`assertMatch` helpers in the test file.
- Produces: a regression test proving the component exposes the two click handlers and no native drag/drop contract.

- [ ] **Step 1: Write the failing test**

Add this test after `ColorMatchingGame applies assigned wrong-item handling to drag and touch paths` (the test name may be updated to reflect click behavior):

```ts
Deno.test("ColorMatchingGame uses click selection instead of native drag and drop", async () => {
  const source = await readSource("src/components/games/1-colors/ColorMatchingGame.tsx");

  assertMatch(source, /onClick=\{\(\) => setSelectedItemId\(isSelected \? null : item\.id\)\}/);
  assertMatch(source, /onClick=\{\(\) => handleMatch\(color\.id\)\}/);
  assertMatch(source, /Click an object, then click the matching color!/);
  assertEquals(source.includes("draggable"), false);
  assertEquals(source.includes("onDragStart"), false);
  assertEquals(source.includes("onDragOver"), false);
  assertEquals(source.includes("onDrop"), false);
});
```

- [ ] **Step 2: Run the focused test and verify it fails for the expected reason**

Run from `frontend`:

```powershell
deno test --allow-read --allow-env --import-map=deno.json test/colors-quiz-scoring.test.ts
```

Expected result: the existing Colors tests run, and the new test fails because the current source still contains `draggable`, `onDragStart`, `onDragOver`, and `onDrop`, and still uses the drag-oriented instruction.

- [ ] **Step 3: Commit the test-only change**

```powershell
git add -- frontend/test/colors-quiz-scoring.test.ts
git commit -m "test: require click interaction for colors matching"
```

### Task 2: Convert the Colors matching game to clicks

**Files:**
- Modify: `frontend/src/components/games/1-colors/ColorMatchingGame.tsx` in the drag/drop handler section and the matching item/bucket JSX.

**Interfaces:**
- Consumes: the existing `selectedItemId` state, `setSelectedItemId`, `handleMatch(colorId)`, and the existing item scoring state.
- Produces: item cards selected by click and color buckets matched by click, with no native drag/drop event handlers.

- [ ] **Step 1: Remove the native drag/drop handlers**

Delete the `handleDragStart`, `handleDragOver`, and `handleDrop` functions. Keep `handleMatch` unchanged so the existing correct/wrong scoring and assigned-quiz behavior remain the single matching path.

- [ ] **Step 2: Update the learner-facing interaction copy**

Change the instruction paragraph from:

```tsx
<p className="text-lg text-muted-foreground">Drag or touch the object to the correct color!</p>
```

to:

```tsx
<p className="text-lg text-muted-foreground">Click an object, then click the matching color!</p>
```

- [ ] **Step 3: Remove drag props and keep click selection**

Change each color bucket to keep only its click matching handler:

```tsx
<div
  key={color.id}
  onClick={() => handleMatch(color.id)}
  className="w-32 h-32 md:w-40 md:h-40 rounded-2xl flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-105 active:scale-95"
  style={{ backgroundColor: color.hex }}
>
```

Change each item card to remove `draggable` and `onDragStart`, retain its existing click selection handler, and use a click cursor:

```tsx
<Card
  key={item.id}
  onClick={() => setSelectedItemId(isSelected ? null : item.id)}
  className={`w-24 h-24 md:w-28 md:h-28 flex items-center justify-center text-5xl md:text-6xl cursor-pointer transition-all ${isSelected ? 'ring-4 ring-primary scale-110 shadow-xl' : 'hover:scale-105 shadow-sm'
    }`}
>
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run from `frontend`:

```powershell
deno test --allow-read --allow-env --import-map=deno.json test/colors-quiz-scoring.test.ts
```

Expected result: all Colors tests pass, including `ColorMatchingGame uses click selection instead of native drag and drop`.

- [ ] **Step 5: Run the complete frontend checks**

Run from the repository root:

```powershell
npm run typecheck
npm test
npm run build
```

Expected result: each command exits with code 0; the typecheck reports no errors, the Deno suite reports no failures, and Vite produces the production build.

- [ ] **Step 6: Review the final diff and commit the implementation**

```powershell
git diff --check
git diff -- frontend/src/components/games/1-colors/ColorMatchingGame.tsx frontend/test/colors-quiz-scoring.test.ts
git status --short
git add -- frontend/src/components/games/1-colors/ColorMatchingGame.tsx
git commit -m "fix: make colors matching click-based"
```

Confirm the final commit contains only the production component, while the pre-existing unrelated worktree changes remain unstaged and untouched.
