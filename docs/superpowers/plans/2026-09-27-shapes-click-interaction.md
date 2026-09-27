# Click-Based Shapes Interactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the remaining Shapes drag-and-drop interactions with touchscreen-friendly click interactions in Monster Cafe and Shape Matcher.

**Architecture:** Monster Cafe will call its existing result-state logic from an item click, so every selected item is fed immediately without coordinate hit-testing. Shape Matcher will use a selected item id and target-box clicks, preserving its existing `matches`, `answeredItems`, attempt, scoring, and completion state. No shared hook or dependency change is needed because the two games have different click flows.

**Tech Stack:** React 19, TypeScript, Framer Motion, Vite, Deno tests with `@std/assert`, npm scripts.

## Global Constraints

- Make every Shapes game usable on touchscreens by replacing the two remaining drag-and-drop interactions with click-based interactions.
- Preserve quiz maxima, attempt counting rules, assigned-quiz locks, free-play retry behavior, game navigation, visual themes, other Shapes games, and global touch handling.
- Do not add a shared input hook or dependency.
- Follow TDD: new click-only assertions must fail against the current drag-enabled source before production code changes.
- Run targeted checks first, then frontend typecheck, the complete frontend test suite, and the production build.
- The repository test script requires Deno; if bare `deno` is unavailable locally, use `npx --yes deno` with the same arguments without changing package metadata.

## File Map

- Modify `frontend/test/shapes-quiz-scoring.test.ts`: add click-only regression coverage for both affected games and update the existing Shape Matcher assigned-quiz assertion to describe clicks rather than drops.
- Modify `frontend/src/components/games/2-shapes/MonsterCafe.tsx`: replace mouth coordinate drop handling with item clicks and update its instruction/cursor affordances.
- Modify `frontend/src/components/games/2-shapes/ShapeMatcher.tsx`: replace Framer Motion drag/drop and target hit-testing with selected-item and target-click handling.

### Task 1: Add the failing Shapes click-only regression tests

**Files:**
- Modify: `frontend/test/shapes-quiz-scoring.test.ts` after the existing Shape Matcher assigned-quiz test.

**Interfaces:**
- Consumes: `readGameSource(fileName)` and the existing `assertEquals`/`assertMatch` helpers.
- Produces: a regression test for Monster Cafe's item-click flow and Shape Matcher's item-selection/target-click flow.

- [ ] **Step 1: Add the click-only test**

Add this test:

```ts
Deno.test("Shapes drag games use click interactions for touchscreens", async () => {
  const monsterCafe = await readGameSource("MonsterCafe.tsx");
  const shapeMatcher = await readGameSource("ShapeMatcher.tsx");

  assertMatch(monsterCafe, /const handleItemClick = \(item: typeof ITEMS\[0\]\) =>/);
  assertMatch(monsterCafe, /onClick=\{\(\) => handleItemClick\(item\)\}/);
  assertMatch(monsterCafe, /Click an item to feed me!/);
  assertEquals(monsterCafe.includes("handleDragEnd"), false);
  assertEquals(monsterCafe.includes("onDragEnd"), false);
  assertEquals(monsterCafe.includes("dragSnapToOrigin"), false);

  assertMatch(shapeMatcher, /const \[selectedItemId, setSelectedItemId\] = useState<string \| null>\(null\)/);
  assertMatch(shapeMatcher, /onClick=\{\(\) => handleItemClick\(item\.id\)\}/);
  assertMatch(shapeMatcher, /onClick=\{\(\) => handleTargetClick\(target\.shape\)\}/);
  assertMatch(shapeMatcher, /Click a toy, then click its matching shape box!/);
  assertEquals(shapeMatcher.includes("handleDragEnd"), false);
  assertEquals(shapeMatcher.includes("onDragEnd"), false);
  assertEquals(shapeMatcher.includes("targetRefs"), false);
});
```

- [ ] **Step 2: Update the existing Shape Matcher test name and retained-path assertion**

Change the existing test name from:

```ts
Deno.test("ShapeMatcher treats every assigned-quiz drop as one scored item", async () => {
```

to:

```ts
Deno.test("ShapeMatcher treats every assigned-quiz click match as one scored item", async () => {
```

Replace its first assertion with the click handler contract while keeping the existing assigned-quiz assertions:

```ts
assertEquals(source.includes("const handleTargetClick = (targetShape: string) =>"), true);
```

- [ ] **Step 3: Run the focused Shapes test and verify the expected red state**

Run from `frontend`:

```powershell
npx --yes deno test --allow-read --allow-env --import-map=deno.json test/shapes-quiz-scoring.test.ts
```

Expected result: the existing Shapes tests run, and the new test fails because Monster Cafe and Shape Matcher still contain drag handlers/props and drag-oriented instructions.

- [ ] **Step 4: Commit the test-only change**

```powershell
git add -- frontend/test/shapes-quiz-scoring.test.ts
git commit -m "test: require click interactions for shapes games"
```

### Task 2: Convert Monster Cafe to item clicks

**Files:**
- Modify: `frontend/src/components/games/2-shapes/MonsterCafe.tsx` in the drop handler and choice-card JSX.

**Interfaces:**
- Consumes: `currentShape`, `attempts`, `score`, `completedItems`, `gameState`, `allowSkip`, and `startRound`.
- Produces: `handleItemClick(item)` as the only item gameplay input, preserving all existing free-play and assigned-quiz state transitions.

- [ ] **Step 1: Replace coordinate drop handling with the click result handler**

Replace `handleDragEnd` and the mouth-rectangle hit-testing with this handler:

```tsx
  const handleItemClick = (item: typeof ITEMS[0]) => {
    if (gameState !== 'playing') return;

    if (allowSkip === false) {
      const isCorrect = item.shape === currentShape;
      const newAttempts = attempts + 1;
      const newScore = score + (isCorrect ? 1 : 0);
      const newCompletedItems = completedItems + 1;

      setAttempts(newAttempts);
      setCompletedItems(newCompletedItems);
      setScore(newScore);
      setGameState(newCompletedItems >= QUIZ_ROUNDS ? 'completed' : isCorrect ? 'correct' : 'wrong');

      if (isCorrect) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }

      if (newCompletedItems < QUIZ_ROUNDS) {
        quizAdvanceTimeoutRef.current = setTimeout(() => {
          quizAdvanceTimeoutRef.current = null;
          startRound();
        }, 800);
      }

      return;
    }

    setAttempts(currentAttempts => currentAttempts + 1);
    if (item.shape === currentShape) {
      const newScore = score + 1;
      setScore(newScore);
      setGameState('correct');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } else {
      setGameState('wrong');
    }
  };
```

Remove `mouthRef` and its `ref={mouthRef}` prop because the mouth remains visual feedback rather than a coordinate drop target. Keep `quizAdvanceTimeoutRef` and its cleanup unchanged.

- [ ] **Step 2: Update Monster Cafe copy and item affordance**

Change the playing-state feedback text:

```tsx
{gameState === 'playing' ? 'Click an item to feed me!' : gameState === 'correct' ? 'YUM! 😋' : 'Oops! 😢'}
```

Replace each draggable `motion.div` choice with a clickable `motion.div` that preserves its animation/layout behavior and calls the new handler:

```tsx
<motion.div
  key={`${roundId}-${idx}`}
  onClick={() => handleItemClick(item)}
  whileTap={{ scale: 0.95 }}
  className={`bg-[#fee1b5] border-b-4 border-[#e6b87c] p-4 rounded-2xl flex flex-col items-center cursor-pointer
    ${gameState !== 'playing' ? 'opacity-50 pointer-events-none' : 'hover:-translate-y-1'}`}
>
```

Remove `drag`, `dragSnapToOrigin`, `onDragEnd`, `whileDrag`, and `touch-none` from the choice cards.

- [ ] **Step 3: Run the focused Shapes test**

Run:

```powershell
npx --yes deno test --allow-read --allow-env --import-map=deno.json test/shapes-quiz-scoring.test.ts
```

Expected result: the Monster Cafe click assertions pass; the suite may still fail only on the Shape Matcher click-only assertions until Task 3 is complete.

- [ ] **Step 4: Commit the Monster Cafe implementation**

```powershell
git add -- frontend/src/components/games/2-shapes/MonsterCafe.tsx
git commit -m "fix: make monster cafe click-based"
```

### Task 3: Convert Shape Matcher to selected-item and target clicks

**Files:**
- Modify: `frontend/src/components/games/2-shapes/ShapeMatcher.tsx` in state, interaction handlers, instruction, item cards, and target boxes.

**Interfaces:**
- Consumes: `matches`, `answeredItems`, `allowSkip`, `attempts`, and existing completion rendering.
- Produces: `handleItemClick(itemId)` and `handleTargetClick(targetShape)` with the same scoring and completion behavior as the prior drop path.

- [ ] **Step 1: Add selection state and remove coordinate refs**

Change the import to remove `useRef`:

```tsx
import { useState, useEffect } from 'react';
```

Add selected-item state beside `answeredItems`:

```tsx
const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
```

Reset the selection in `resetGame`:

```tsx
setSelectedItemId(null);
```

Remove `targetRefs` and its ref callback because target geometry is no longer needed.

- [ ] **Step 2: Replace `handleDragEnd` with click handlers**

Add these handlers:

```tsx
  const handleItemClick = (itemId: string) => {
    if (isQuizComplete || answeredItems[itemId]) return;
    setSelectedItemId(current => current === itemId ? null : itemId);
    setMessage('');
  };

  const handleTargetClick = (targetShape: string) => {
    if (!selectedItemId || Object.keys(matches).length === QUIZ_ITEMS || answeredItems[selectedItemId]) return;

    const item = ITEMS.find(candidate => candidate.id === selectedItemId);
    if (!item) {
      setSelectedItemId(null);
      return;
    }

    setAttempts(currentAttempts => currentAttempts + 1);
    const nextAnsweredItems = { ...answeredItems, [item.id]: true };
    if (allowSkip === false) setAnsweredItems(nextAnsweredItems);

    if (targetShape === item.match) {
      setMatches(prev => {
        const next = { ...prev, [item.id]: targetShape };
        if (allowSkip !== false && Object.keys(next).length === ITEMS.length) {
          setMessage("HOORAY! You matched them all! 🎉");
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        } else {
          setMessage("Correct! 🌟");
        }
        return next;
      });
    } else if (allowSkip === false) {
      setMessage("Wrong answer");
    } else {
      setMessage("Try another one! ❌");
      setTimeout(() => {
        setMessage(prev => prev === "Try another one! ❌" ? "" : prev);
      }, 1500);
    }

    setSelectedItemId(null);
  };
```

The handler keeps free-play wrong items available because `answeredItems` is only updated when `allowSkip === false`, exactly as the prior drop path did.

- [ ] **Step 3: Update instruction, item cards, and target boxes**

Change the instruction to:

```tsx
<p className="text-lg text-gray-700 font-bold">Click a toy, then click its matching shape box!</p>
```

Change the item column condition to include the selected visual state and make each item clickable:

```tsx
{shuffledItems.map(item => !matches[item.id] && !answeredItems[item.id] && (
  <motion.div
    key={item.id}
    layoutId={`item-${item.id}`}
    onClick={() => handleItemClick(item.id)}
    whileTap={{ scale: 0.95 }}
    className={`w-20 h-20 md:w-24 md:h-24 bg-white border-4 border-[#4da6ff] rounded-[2rem] flex justify-center items-center text-5xl md:text-6xl cursor-pointer shadow-[0_6px_0_0_#3388dd] active:shadow-none active:translate-y-1 transition-all
      ${selectedItemId === item.id ? 'ring-4 ring-[#ff9900] scale-105' : ''}`}
  >
    {item.emoji}
  </motion.div>
))}
```

Add the target click handler and remove the target ref:

```tsx
<div
  key={target.shape}
  onClick={() => handleTargetClick(target.shape)}
  className={`flex flex-col items-center p-4 min-h-[160px] md:min-h-[180px] border-4 border-dashed rounded-3xl transition-colors duration-300 relative cursor-pointer
    ${hasMatches ? 'bg-[#bfffbf] border-[#008000] border-solid shadow-inner' : 'bg-[#fff9ef] border-[#ff9900]'}`}
>
```

Remove `drag`, `dragSnapToOrigin`, `onDragEnd`, `whileDrag`, and `touch-none` from item cards, and remove the coordinate loop and `targetRefs` usage entirely.

- [ ] **Step 4: Run the focused Shapes test and verify it passes**

Run:

```powershell
npx --yes deno test --allow-read --allow-env --import-map=deno.json test/shapes-quiz-scoring.test.ts
```

Expected result: all Shapes tests pass, including the click-only regression and assigned-quiz scoring assertions.

- [ ] **Step 5: Run the complete frontend verification gates**

Run from the repository root:

```powershell
npm run typecheck
npx --yes deno test --allow-read --allow-env --import-map=deno.json test
npm run build
```

Expected result: typecheck exits 0, the full test run preserves the repository's previously accepted baseline failures without introducing Shapes failures, and Vite exits 0 with the production bundle generated.

- [ ] **Step 6: Review and commit the Shape Matcher implementation**

```powershell
git diff --check
git diff -- frontend/src/components/games/2-shapes/MonsterCafe.tsx frontend/src/components/games/2-shapes/ShapeMatcher.tsx frontend/test/shapes-quiz-scoring.test.ts
git status --short
git add -- frontend/src/components/games/2-shapes/ShapeMatcher.tsx
git commit -m "fix: make shape matcher click-based"
```

Confirm only the Shapes implementation files are staged by this task and pre-existing unrelated worktree changes remain unstaged.
