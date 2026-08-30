# Free Play Drawing Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the historical drawing-board activities to Free Play while keeping them unavailable in assigned classroom quizzes.

**Architecture:** Keep the classroom `GAME_COUNT_BY_TOPIC` unchanged. Add a separate Free Play catalog that excludes the classroom-only color multiple-choice activity, extends the six historical drawing-board topics by one activity, and exposes the drawing-board game orders. `QuizPage` selects the Free Play catalog only when there is no `assignmentId`, and renders the existing shared `DrawingCanvas` only for those Free Play orders.

**Tech Stack:** React, TypeScript, Deno tests, Vite, existing shared `DrawingCanvas` component.

## Global Constraints

- Assigned quizzes must continue using `GAME_COUNT_BY_TOPIC` and must never render `DrawingCanvas`.
- Free Play colors has 6 activities; the seventh `MultipleChoice` activity is classroom-quiz-only.
- Free Play drawing-board orders are shapes 8, sequencing 9, addition 15, subtraction 9, numbers 8, and measurement 6 (zero-based).
- The existing `DrawingCanvas` controls and `handleStructuredGameComplete` scoring flow remain the source of truth.
- Do not alter the current classroom game catalog or game components.

---

### Task 1: Add the Free Play catalog contract

**Files:**
- Create: `src/lib/games/free-play.ts`
- Test: `test/src/lib/games/free-play.test.ts`

**Interfaces:**
- Produces `FREE_PLAY_GAME_COUNT_BY_TOPIC`, `FREE_PLAY_DRAWING_BOARD_GAME_ORDERS`, `getFreePlayGameCount(topicId: string): number`, and `isFreePlayDrawingBoard(topicId: string, gameOrder: number): boolean`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import {
  FREE_PLAY_GAME_COUNT_BY_TOPIC,
  getFreePlayGameCount,
  isFreePlayDrawingBoard,
} from '@/lib/games/free-play';

describe('Free Play catalog', () => {
  it('adds the historical drawing-board activity without changing classroom counts', () => {
    expect(getFreePlayGameCount('shapes')).toBe(9);
    expect(getFreePlayGameCount('sequencing')).toBe(10);
    expect(getFreePlayGameCount('addition')).toBe(16);
    expect(getFreePlayGameCount('subtraction')).toBe(10);
    expect(getFreePlayGameCount('numbers')).toBe(9);
    expect(getFreePlayGameCount('measurement')).toBe(7);
    expect(FREE_PLAY_GAME_COUNT_BY_TOPIC.colors).toBe(6);
  });

  it('identifies only the six historical drawing-board slots', () => {
    expect(isFreePlayDrawingBoard('shapes', 8)).toBe(true);
    expect(isFreePlayDrawingBoard('sequencing', 9)).toBe(true);
    expect(isFreePlayDrawingBoard('addition', 15)).toBe(true);
    expect(isFreePlayDrawingBoard('subtraction', 9)).toBe(true);
    expect(isFreePlayDrawingBoard('numbers', 8)).toBe(true);
    expect(isFreePlayDrawingBoard('measurement', 6)).toBe(true);
    expect(isFreePlayDrawingBoard('shapes', 7)).toBe(false);
    expect(isFreePlayDrawingBoard('clock', 6)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `deno test test/src/lib/games/free-play.test.ts`

Expected: FAIL because `@/lib/games/free-play` does not exist.

- [ ] **Step 3: Write minimal implementation**

```ts
import { GAME_COUNT_BY_TOPIC, type TeacherTopicId } from './catalog';

export const FREE_PLAY_GAME_COUNT_BY_TOPIC = {
  ...GAME_COUNT_BY_TOPIC,
  colors: GAME_COUNT_BY_TOPIC.colors - 1,
  shapes: GAME_COUNT_BY_TOPIC.shapes + 1,
  sequencing: GAME_COUNT_BY_TOPIC.sequencing + 1,
  addition: GAME_COUNT_BY_TOPIC.addition + 1,
  subtraction: GAME_COUNT_BY_TOPIC.subtraction + 1,
  numbers: GAME_COUNT_BY_TOPIC.numbers + 1,
  measurement: GAME_COUNT_BY_TOPIC.measurement + 1,
} as const;

export const FREE_PLAY_DRAWING_BOARD_GAME_ORDERS: Partial<Record<TeacherTopicId, number>> = {
  shapes: 8,
  sequencing: 9,
  addition: 15,
  subtraction: 9,
  numbers: 8,
  measurement: 6,
};

export function getFreePlayGameCount(topicId: string): number {
  return FREE_PLAY_GAME_COUNT_BY_TOPIC[topicId as TeacherTopicId] ?? 0;
}

export function isFreePlayDrawingBoard(topicId: string, gameOrder: number): boolean {
  return FREE_PLAY_DRAWING_BOARD_GAME_ORDERS[topicId as TeacherTopicId] === gameOrder;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `deno test test/src/lib/games/free-play.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/games/free-play.ts test/src/lib/games/free-play.test.ts
git commit -m "test: define free play drawing board catalog"
```

### Task 2: Wire drawing boards into Free Play only

**Files:**
- Modify: `src/pages/QuizPage.tsx:1-180,641-805`
- Test: `test/src/pages/QuizPage.test.ts`

**Interfaces:**
- Consumes `getFreePlayGameCount` and `isFreePlayDrawingBoard` from Task 1.
- Uses the existing `DrawingCanvas` and `handleStructuredGameComplete` without changing either.

- [ ] **Step 1: Write the failing test**

Add assertions to the existing `QuizPage` source-contract suite that the page imports the Free Play catalog and shared canvas, selects the Free Play count only when `!isAssignedQuiz`, and guards the canvas branches with `!isAssignedQuiz`.

- [ ] **Step 2: Run test to verify it fails**

Run: `deno test --allow-read test/src/pages/QuizPage.test.ts`

Expected: FAIL because the current page has no `DrawingCanvas` import or Free Play-only branches.

- [ ] **Step 3: Write minimal implementation**

Import the shared canvas and Free Play helpers. Select `GAME_COUNT_BY_TOPIC` for assigned quizzes and `getFreePlayGameCount(topic)` for Free Play. Add the six branches before the generic fallback:

```tsx
{!isAssignedQuiz && isFreePlayDrawingBoard(topic, currentIndex) ? (
  <DrawingCanvas onComplete={handleStructuredGameComplete} />
) : topic === 'shapes' && currentIndex === 0 ? (
```

Because the drawing predicate includes the topic and game order, this single branch restores all six historical slots and cannot activate in assigned mode.

- [ ] **Step 4: Run test to verify it passes**

Run: `deno test --allow-read test/src/pages/QuizPage.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/QuizPage.tsx test/src/pages/QuizPage.test.ts
git commit -m "fix: restore free play drawing boards"
```

### Task 3: Run the full verification suite

**Files:**
- Verify: `src/lib/games/free-play.ts`
- Verify: `src/pages/QuizPage.tsx`
- Verify: `test/src/lib/games/free-play.test.ts`
- Verify: `test/src/pages/QuizPage.test.ts`

- [ ] **Step 1: Run focused tests**

Run: `deno test --allow-read test/src/lib/games/free-play.test.ts test/src/pages/QuizPage.test.ts`

Expected: PASS with zero failed tests.

- [ ] **Step 2: Run the project typecheck/build**

Run: `npm.cmd run typecheck`

Expected: exit code 0 with no TypeScript errors.

- [ ] **Step 3: Run the complete test suite**

Run: `deno test --allow-read test`

Observed: 267 passed and 2 unrelated pre-existing shape-lesson mapping tests failed in `test/src/data/shapes-filipino-audio-mapping.test.ts` and `test/src/data/shapes-lesson-mapping.test.ts`; no files in those failures were changed by this work.
