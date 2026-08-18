# Additional Addition Games Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert the four HTML files in `revisions/addition replacements/` into additional React activities, preserve the existing addition activities, and keep Drawing Canvas last.

**Architecture:** A shared `AdditionReplacementGame` owns the bounded-question, answer-choice, score, skip, and completion behavior. Four small themed wrappers provide the distinct additional-game content. `QuizPage`, the addition data count, and the catalog define the sixteen-game order.

**Tech Stack:** React, TypeScript, Tailwind classes, Deno tests, existing arithmetic helper.

## Global Constraints

- Replacement activities use addends from 1 through 5.
- Every addition answer is at most 10.
- The four additional games are first, before the existing addition games.
- Drawing Canvas is always the final addition activity.

### Task 1: Add bounded additional-game behavior

**Files:**
- Create: `src/components/games/4-addition/AdditionReplacementGame.tsx`
- Create: `src/components/games/4-addition/AdditionReplacementOne.tsx`
- Create: `src/components/games/4-addition/AdditionReplacementTwo.tsx`
- Create: `src/components/games/4-addition/AdditionReplacementThree.tsx`
- Create: `src/components/games/4-addition/AdditionReplacementFour.tsx`
- Modify: `src/lib/games/arithmeticBounds.ts`
- Test: `test/src/components/addition-revisions.test.ts`

- [x] Write the failing bounds and flow regression tests.
- [x] Verify the tests fail against the old helper and flow.
- [x] Implement the shared game and themed wrappers.
- [ ] Run the targeted test and type check.

### Task 2: Wire the lesson order

**Files:**
- Modify: `src/pages/QuizPage.tsx`
- Modify: `src/data/addition.ts`
- Modify: `src/lib/games/catalog.ts`

- [x] Import all four replacement wrappers.
- [x] Preserve all existing addition game slots.
- [x] Insert the four additional games before the existing games.
- [x] Put Drawing Canvas at the final slot.
- [ ] Run the full verification commands.
