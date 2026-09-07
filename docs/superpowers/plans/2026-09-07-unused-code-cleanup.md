# Unused Code and Asset Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove proven-unused MathVenture files, symbols, dependencies, assets, and tracked local artifacts without changing live application behavior.

**Architecture:** Use the existing frontend and Supabase entrypoints as reachability roots. Delete dead leaves first, then prune symbols and dependencies, then remove cross-checked public assets; preserve the legacy prototype archive, recovery snapshots, project rules, live tests, and unrelated user files.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Deno tests, Supabase Edge Functions, npm lockfile.

## Global Constraints

- “The cleanup does not cover behavior changes, visual redesign, data migrations, or replacement of working application features.”
- “`docs/legacy-prototype-reference/`, which is the project’s recovery/reference archive.” remains untouched.
- “`.codex/` recovery snapshots and `.agents/` project instructions.” remain untouched.
- “The user-created untracked `.tmp-shape-matching-build/` directory and any unrelated working-tree changes.” remain untouched.
- Preserve tests that cover reachable frontend or Supabase behavior.
- Use `npm.cmd run typecheck` for TypeScript verification.
- Use `deno test --no-check --allow-read test` for the executable baseline suite; the current baseline is 275 passing and 2 pre-existing shape-data failures.
- Use `npm.cmd run build` after Vite configuration cleanup and at the final gate.
- Never stage `.tmp-shape-matching-build/`, `.env`, `dist/`, `.codex/`, `.agents/`, or `docs/legacy-prototype-reference/`.
- Each task produces one non-empty commit with a focused cleanup concern.

---

## File and Dependency Map

### Runtime roots

- `src/main.tsx` reaches the frontend application graph.
- `supabase/functions/*/index.ts` remain deployed Edge Function roots and must retain their handler/shared imports.
- `test/**/*.ts` remains the test graph; source-reading tests are updated only when they describe deleted functionality.

### Preserved UI modules

These UI modules are reachable and are not deleted: `src/components/ui.tsx`, `src/components/ui/button.tsx`, `src/components/ui/dialog.tsx`, `src/components/ui/drawer.tsx`, `src/components/ui/dropdown-menu.tsx`, and `src/components/ui/select.tsx`.

### Dead source groups

- Removed number games: `CountMatch2.tsx`, `CountMatch3.tsx`, `CountMatch4.tsx`.
- Unused teacher components: `TeacherClassCard.tsx`, `TeacherReportsClassComparison.tsx`.
- Obsolete generated data: `src/data/freePlay.ts` and its source-only arithmetic test.
- Dead UI subtree: the unused files under `src/components/ui/` listed in Tasks 11–14, plus `src/hooks/use-toast.ts`.

### Dependency groups

After dead UI removal, remove these direct packages from `package.json` and `package-lock.json`:

- Radix/dead primitive group: `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-aspect-ratio`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible`, `@radix-ui/react-context-menu`, `@radix-ui/react-hover-card`, `@radix-ui/react-label`, `@radix-ui/react-menubar`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-popover`, `@radix-ui/react-progress`, `@radix-ui/react-radio-group`, `@radix-ui/react-scroll-area`, `@radix-ui/react-separator`, `@radix-ui/react-slider`, `@radix-ui/react-switch`, `@radix-ui/react-tabs`, `@radix-ui/react-toast`, `@radix-ui/react-toggle`, `@radix-ui/react-toggle-group`, and `@radix-ui/react-tooltip`.
- Dead utility/form/visual group: `@hookform/resolvers`, `cmdk`, `date-fns`, `embla-carousel-react`, `input-otp`, `next-themes`, `react-hook-form`, `react-icons`, `react-resizable-panels`, `recharts`, `sonner`, and `zod`.

Keep `@tailwindcss/typography` because `src/index.css` explicitly uses its Tailwind plugin. Keep compiler, type, Vite, Tailwind, Supabase, and reachable UI packages.

## Tasks

### Task 1: Remove tracked npm cache

**Files:**
- Delete: `.npm-cache/` (all 808 tracked cache files)

**Interfaces:** No runtime interface; this is tracked local package-manager cache data.

- [ ] **Step 1:** Confirm the target is tracked cache only with `git ls-files .npm-cache` and confirm `.npm-cache/` is not referenced by application code or scripts with `rg -n '.npm-cache' --glob '!docs/legacy-prototype-reference/**' --glob '!node_modules/**' .`.
- [ ] **Step 2:** Delete only the tracked `.npm-cache/` directory with `Remove-Item -LiteralPath .npm-cache -Recurse -Force`.
- [ ] **Step 3:** Run `git diff --check` and `npm.cmd run typecheck`.
- [ ] **Step 4:** Commit `chore: remove tracked npm cache`.

### Task 2: Remove the tracked TypeScript build cache

**Files:**
- Delete: `tsconfig.tsbuildinfo`

**Interfaces:** No runtime interface; TypeScript regenerates this cache when configured to do so.

- [ ] **Step 1:** Confirm no project command or documentation references `tsconfig.tsbuildinfo` with `rg -n 'tsconfig\.tsbuildinfo' --glob '!docs/legacy-prototype-reference/**' .`.
- [ ] **Step 2:** Delete `tsconfig.tsbuildinfo`.
- [ ] **Step 3:** Run `npm.cmd run typecheck` and `git diff --check`.
- [ ] **Step 4:** Commit `chore: remove tracked typescript cache`.

### Task 3: Remove the obsolete synthetic generator

**Files:**
- Delete: `generate_synthetic.js`

**Interfaces:** No consumer; the script has no package-script entry and no tracked caller.

- [ ] **Step 1:** Verify `rg -n 'generate_synthetic' --glob '!docs/legacy-prototype-reference/**' .` returns only the file itself or no live caller.
- [ ] **Step 2:** Delete `generate_synthetic.js`.
- [ ] **Step 3:** Run `npm.cmd run typecheck` and `git diff --check`.
- [ ] **Step 4:** Commit `chore: remove unused synthetic generator`.

### Task 4: Remove the obsolete smart synthetic generator

**Files:**
- Delete: `generate_smart_synthetic.js`

**Interfaces:** No consumer; the script is not part of the package scripts or deployment configuration.

- [ ] **Step 1:** Verify `rg -n 'generate_smart_synthetic' --glob '!docs/legacy-prototype-reference/**' .` finds no live caller.
- [ ] **Step 2:** Delete `generate_smart_synthetic.js`.
- [ ] **Step 3:** Run `npm.cmd run typecheck` and `git diff --check`.
- [ ] **Step 4:** Commit `chore: remove unused smart synthetic generator`.

### Task 5: Remove the obsolete free-play data generator and generated dataset

**Files:**
- Delete: `generate.ts`
- Delete: `src/data/freePlay.ts`
- Delete: `test/src/data/arithmetic-bounds.test.ts`

**Interfaces:** The live free-play behavior is provided by `src/lib/games/free-play.ts` and `QuizPage.tsx`; no production module imports `src/data/freePlay.ts`. `parseLegacy.mjs` is preserved because it is a recovery tool for the preserved legacy archive.

- [ ] **Step 1:** Confirm production reachability with `rg -n 'data/freePlay|freePlayTopics|generate\.ts' src supabase package.json README.md` and confirm only the obsolete test/generator references remain.
- [ ] **Step 2:** Delete the three listed files without changing `src/lib/games/free-play.ts` or its live tests.
- [ ] **Step 3:** Confirm `Test-Path test/src/data/arithmetic-bounds.test.ts` is `False`, then run `deno test --no-check --allow-read test/src/lib/games/free-play.test.ts` and `npm.cmd run typecheck`.
- [ ] **Step 4:** Commit `chore: remove obsolete generated free-play data`.

### Task 6: Remove the unused CountMatch2 game

**Files:**
- Delete: `src/components/games/6-numbers/CountMatch2.tsx`
- Modify: `test/numbers-quiz-scoring.test.ts` to remove `CountMatch2.tsx` from `GAME_FILES`, `INTERACTIVE_GAME_FILES`, and `REPLAYABLE_GAME_FILES`.
- Modify: `test/src/components/numbers-skip-layout.test.ts` to remove the `CountMatch2.tsx` path.

**Interfaces:** `QuizPage.tsx` already excludes this game; the remaining number-game test matrices continue to cover all live number games.

- [ ] **Step 1:** Confirm `QuizPage.tsx` does not import or render `CountMatch2`.
- [ ] **Step 2:** Delete the component and remove only its test-matrix entries.
- [ ] **Step 3:** Run `deno test --no-check --allow-read test/numbers-quiz-scoring.test.ts test/src/components/numbers-skip-layout.test.ts test/src/components/numbers-revisions.test.ts`.
- [ ] **Step 4:** Commit `chore: remove unused CountMatch2 game`.

### Task 7: Remove the unused CountMatch3 game

**Files:**
- Delete: `src/components/games/6-numbers/CountMatch3.tsx`
- Modify: `test/numbers-quiz-scoring.test.ts` to remove `CountMatch3.tsx` from all three file arrays.
- Modify: `test/src/components/numbers-skip-layout.test.ts` to remove the `CountMatch3.tsx` path.

**Interfaces:** The live number catalog remains unchanged.

- [ ] **Step 1:** Confirm no production import or JSX reference to `CountMatch3` exists.
- [ ] **Step 2:** Delete the component and its obsolete source-reading test entries.
- [ ] **Step 3:** Run the same focused number-game suite as Task 6.
- [ ] **Step 4:** Commit `chore: remove unused CountMatch3 game`.

### Task 8: Remove the unused CountMatch4 game

**Files:**
- Delete: `src/components/games/6-numbers/CountMatch4.tsx`
- Modify: `test/numbers-quiz-scoring.test.ts` to remove `CountMatch4.tsx` from all three file arrays.
- Modify: `test/src/components/numbers-skip-layout.test.ts` to remove the `CountMatch4.tsx` path.

**Interfaces:** The live number catalog remains unchanged.

- [ ] **Step 1:** Confirm no production import or JSX reference to `CountMatch4` exists.
- [ ] **Step 2:** Delete the component and its obsolete source-reading test entries.
- [ ] **Step 3:** Run the focused number-game suite from Tasks 6–7.
- [ ] **Step 4:** Commit `chore: remove unused CountMatch4 game`.

### Task 9: Remove the unused teacher class card

**Files:**
- Delete: `src/components/teacher/TeacherClassCard.tsx`

**Interfaces:** `TeacherWorkspacePage` renders `TeacherStudentListTable`, `TeacherStudentProgressTable`, and `TeacherAssignedQuizzes`; it does not consume `TeacherClassCard`.

- [ ] **Step 1:** Confirm no import or JSX usage with `rg -n 'TeacherClassCard' src test supabase`.
- [ ] **Step 2:** Delete `TeacherClassCard.tsx`.
- [ ] **Step 3:** Run `deno test --no-check --allow-read test/src/components/teacher-workspace-board.test.ts test/src/pages/teacher-assignment.test.ts` and `npm.cmd run typecheck`.
- [ ] **Step 4:** Commit `chore: remove unused teacher class card`.

### Task 10: Remove the unused class-comparison report component

**Files:**
- Delete: `src/components/teacher/reports/TeacherReportsClassComparison.tsx`

**Interfaces:** `TeacherReportsPage` consumes the singleton classroom summary, attention list, recent activity, student table, and topic breakdown; it does not consume the removed comparison table.

- [ ] **Step 1:** Confirm no import or JSX usage with `rg -n 'TeacherReportsClassComparison' src test supabase`.
- [ ] **Step 2:** Delete the component.
- [ ] **Step 3:** Run `deno test --no-check --allow-read test/src/lib/teacher/reports/index.test.ts test/src/components/teacher-workspace-board.test.ts` and `npm.cmd run typecheck`.
- [ ] **Step 4:** Commit `chore: remove unused class comparison report`.

### Task 11: Remove dead toast and feedback primitives

**Files:**
- Delete: `src/hooks/use-toast.ts`
- Delete: `src/components/ui/alert.tsx`
- Delete: `src/components/ui/alert-dialog.tsx`
- Delete: `src/components/ui/progress.tsx`
- Delete: `src/components/ui/spinner.tsx`
- Delete: `src/components/ui/sonner.tsx`
- Delete: `src/components/ui/toast.tsx`
- Delete: `src/components/ui/toaster.tsx`

**Interfaces:** No reachable module imports these files. `Dialog`, `DropdownMenu`, `Drawer`, and `Select` remain available for live flows.

- [ ] **Step 1:** Confirm the listed files are outside the frontend reachability graph and that no Supabase/test entrypoint imports them.
- [ ] **Step 2:** Delete the listed files.
- [ ] **Step 3:** Run `npm.cmd run typecheck` and `git diff --check`.
- [ ] **Step 4:** Commit `chore: remove dead feedback primitives`.

### Task 12: Remove dead form and input primitives

**Files:**
- Delete: `src/components/ui/checkbox.tsx`
- Delete: `src/components/ui/field.tsx`
- Delete: `src/components/ui/form.tsx`
- Delete: `src/components/ui/input-group.tsx`
- Delete: `src/components/ui/input-otp.tsx`
- Delete: `src/components/ui/label.tsx`
- Delete: `src/components/ui/radio-group.tsx`
- Delete: `src/components/ui/textarea.tsx`
- Delete: `src/components/ui/toggle-group.tsx`
- Delete: `src/components/ui/toggle.tsx`

**Interfaces:** Live forms use the application’s custom `Input` and `Label` exports from `src/components/ui.tsx`, plus the reachable `Dialog`, `Drawer`, and `Select` primitives; no deleted file is part of those interfaces.

- [ ] **Step 1:** Confirm the deleted modules have no reachable importers after Task 11.
- [ ] **Step 2:** Delete the listed files.
- [ ] **Step 3:** Run `npm.cmd run typecheck` and the focused add-students suite `deno test --no-check --allow-read test/src/lib/teacher/add-students/index.test.ts test/src/lib/teacher/add-students/flow.test.ts test/src/pages/teacher-assignment.test.ts`.
- [ ] **Step 4:** Commit `chore: remove dead form primitives`.

### Task 13: Remove dead navigation and layout primitives

**Files:**
- Delete: `src/components/ui/accordion.tsx`
- Delete: `src/components/ui/aspect-ratio.tsx`
- Delete: `src/components/ui/avatar.tsx`
- Delete: `src/components/ui/breadcrumb.tsx`
- Delete: `src/components/ui/button-group.tsx`
- Delete: `src/components/ui/calendar.tsx`
- Delete: `src/components/ui/carousel.tsx`
- Delete: `src/components/ui/collapsible.tsx`
- Delete: `src/components/ui/command.tsx`
- Delete: `src/components/ui/context-menu.tsx`
- Delete: `src/components/ui/hover-card.tsx`
- Delete: `src/components/ui/item.tsx`
- Delete: `src/components/ui/kbd.tsx`
- Delete: `src/components/ui/menubar.tsx`
- Delete: `src/components/ui/navigation-menu.tsx`
- Delete: `src/components/ui/pagination.tsx`
- Delete: `src/components/ui/popover.tsx`
- Delete: `src/components/ui/resizable.tsx`
- Delete: `src/components/ui/scroll-area.tsx`
- Delete: `src/components/ui/separator.tsx`
- Delete: `src/components/ui/sidebar.tsx`
- Delete: `src/components/ui/skeleton.tsx`
- Delete: `src/components/ui/tabs.tsx`
- Delete: `src/components/ui/tooltip.tsx`

**Interfaces:** `src/components/layout.tsx` uses the reachable dropdown-menu primitives, and teacher add-students uses the reachable dialog/drawer primitives; no deleted navigation/layout primitive is consumed by those modules.

- [ ] **Step 1:** Confirm no live import reaches any listed file.
- [ ] **Step 2:** Delete the listed files.
- [ ] **Step 3:** Run `npm.cmd run typecheck` and the focused layout suites `deno test --no-check --allow-read test/src/components/teacher-workspace-board.test.ts test/src/components/teacher-assigned-quizzes.test.ts test/src/components/game-mobile-layout.test.ts`.
- [ ] **Step 4:** Commit `chore: remove dead navigation primitives`.

### Task 14: Remove dead display and chart primitives

**Files:**
- Delete: `src/components/ui/badge.tsx`
- Delete: `src/components/ui/card.tsx`
- Delete: `src/components/ui/chart.tsx`
- Delete: `src/components/ui/empty.tsx`

**Interfaces:** Live cards and badges come from `src/components/ui.tsx`; the deleted shadcn variants have no runtime importers.

- [ ] **Step 1:** Confirm no live import reaches the listed files.
- [ ] **Step 2:** Delete the listed files.
- [ ] **Step 3:** Run `npm.cmd run typecheck` and `deno test --no-check --allow-read test/src/components/teacher-student-progress-table.test.ts test/src/components/teacher-assigned-quizzes.test.ts`.
- [ ] **Step 4:** Commit `chore: remove dead display primitives`.

### Task 15: Remove unused color-topic symbols

**Files:**
- Modify: `src/components/AudioButton.tsx` to remove the unused `React` default import.
- Modify: `src/components/games/1-colors/ChooseWhichColor.tsx` to remove the unused `React` and `useEffect` imports.
- Modify: `src/components/games/1-colors/ColorMatchingGame.tsx` to remove the unused `useRef` import.
- Modify: `src/components/games/1-colors/MultipleChoice.tsx` to remove the unused `React` import.
- Modify: `src/components/games/1-colors/RainbowColorCatcher.tsx` to remove the unused `React` import.
- Modify: `src/components/games/1-colors/RainbowGalaxyExplorer.tsx` to remove the unused `isCompleted` declaration.

**Interfaces:** Component props, event handlers, scoring callbacks, and JSX remain unchanged.

- [ ] **Step 1:** Remove only the named unused declarations; do not alter behavior.
- [ ] **Step 2:** Run `npm.cmd run typecheck` and `deno test --no-check --allow-read test/colors-quiz-scoring.test.ts test/src/components/game-data-safety.test.ts test/src/pages/QuizPage.test.ts`.
- [ ] **Step 3:** Commit `refactor: prune unused color symbols`.

### Task 16: Remove unused shape-topic symbols

**Files:**
- Modify: `src/components/games/2-shapes/FindTheShape.tsx` (`React` import).
- Modify: `src/components/games/2-shapes/HungryDragon.tsx` (`React` import and `attempts`).
- Modify: `src/components/games/2-shapes/MonsterCafe.tsx` (`React` import and unused event parameter).
- Modify: `src/components/games/2-shapes/ShapeHunter.tsx` (`React` import).
- Modify: `src/components/games/2-shapes/ShapeMatcher.tsx` (`React` import, `attempts`, and unused event parameter).
- Modify: `src/components/games/2-shapes/ShapeRacing.tsx` (`React` import).
- Modify: `src/components/games/2-shapes/ShapeWizard.tsx` (`React` import).

**Interfaces:** Shape prompts, completion callbacks, assigned-quiz replay guards, and mobile layout stay unchanged.

- [ ] **Step 1:** Remove only the named unused declarations or rename unused callback parameters with the existing underscore convention.
- [ ] **Step 2:** Run `npm.cmd run typecheck` and `deno test --no-check --allow-read test/shapes-quiz-scoring.test.ts test/src/components/shapes-revisions.test.ts test/src/components/shape-wizard-mobile-flow.test.ts`.
- [ ] **Step 3:** Commit `refactor: prune unused shape symbols`.

### Task 17: Remove unused sequencing-topic symbols

**Files:**
- Modify: `src/components/games/3-sequencing/AnimalVehicleBuilder.tsx` (`React` import).
- Modify: `src/components/games/3-sequencing/ArrangeLetters.tsx` (`React` import and unused `idx`).
- Modify: `src/components/games/3-sequencing/ArrangeNumbers.tsx` (`React` import).
- Modify: `src/components/games/3-sequencing/PatternTrainAcademy.tsx` (`React`, `CheckCircle2`, `Trophy`, and `Star` imports).
- Modify: `src/components/games/3-sequencing/SandwichMaker.tsx` (`React` and `Trophy` imports).
- Modify: `src/components/games/3-sequencing/ShortestLongest.tsx` (`React` import).
- Modify: `src/components/games/3-sequencing/SizeSorter.tsx` (`React`, `Maximize2`, and `Minimize2` imports).
- Modify: `src/components/games/3-sequencing/SmallestLargestCake.tsx` (`React` import).
- Modify: `src/components/games/3-sequencing/SurpriseSequencing.tsx` (`React` import and unused `idx`).

**Interfaces:** Sequencing order, scoring, and game navigation remain unchanged.

- [ ] **Step 1:** Remove only the named unused imports and loop variables.
- [ ] **Step 2:** Run `npm.cmd run typecheck` and `deno test --no-check --allow-read test/sequencing-quiz-scoring.test.ts test/src/components/pattern-train-mobile-fit.test.ts test/src/components/game-next-navigation.test.ts`.
- [ ] **Step 3:** Commit `refactor: prune unused sequencing symbols`.

### Task 18: Remove unused addition-topic symbols

**Files:**
- Modify: `src/components/games/4-addition/AdditionAdventure.tsx` (`React`, `useEffect`, and `level`).
- Modify: `src/components/games/4-addition/AdditionFunGame.tsx` (`Trophy`).
- Modify: `src/components/games/4-addition/AnimalSafari.tsx` (`React`).
- Modify: `src/components/games/4-addition/Carnival.tsx` (`React`).
- Modify: `src/components/games/4-addition/ComicStarCatcher.tsx` (`React` and `Play`).
- Modify: `src/components/games/4-addition/IceCreamShop.tsx` (`React`).
- Modify: `src/components/games/4-addition/Pizza.tsx` (`React`).
- Modify: `src/components/games/4-addition/SecondAdditionRound.tsx` (`React`).
- Modify: `src/components/games/4-addition/UnderTheSea.tsx` (`React`).

**Interfaces:** Addition question generation, replacement-game ordering, and scoring callbacks remain unchanged.

- [ ] **Step 1:** Remove only the named unused declarations.
- [ ] **Step 2:** Run `npm.cmd run typecheck` and `deno test --no-check --allow-read test/addition-quiz-scoring.test.ts test/src/components/addition-revisions.test.ts test/src/components/addition-mobile-header.test.ts test/src/components/game-data-safety.test.ts`.
- [ ] **Step 3:** Commit `refactor: prune unused addition symbols`.

### Task 19: Remove unused subtraction-topic symbols

**Files:**
- Modify: `src/components/games/5-subtraction/DinoEgg.tsx` (`React` and `Star`).
- Modify: `src/components/games/5-subtraction/FarmHideSeek.tsx` (`React`, `AnimatePresence`, and `Star`).
- Modify: `src/components/games/5-subtraction/FeedTheHippo.tsx` (`React`, `AnimatePresence`, and `Star`).
- Modify: `src/components/games/5-subtraction/FruitSubtraction.tsx` (`React` and `Sparkles`).
- Modify: `src/components/games/5-subtraction/GentleMathDrift.tsx` (`React`).
- Modify: `src/components/games/5-subtraction/SpaceBlast.tsx` (`React`, `AnimatePresence`, and `Star`).
- Modify: `src/components/games/5-subtraction/SubtractionAdventure.tsx` (`React`, `useEffect`, and `currentLevel`).
- Modify: `src/components/games/5-subtraction/SubtractionBalloon.tsx` (`React`).
- Modify: `src/components/games/5-subtraction/SubtractionPop.tsx` (`React`).

**Interfaces:** Subtraction scoring, replay guards, and mobile skip navigation remain unchanged.

- [ ] **Step 1:** Remove only the named unused declarations.
- [ ] **Step 2:** Run `npm.cmd run typecheck` and `deno test --no-check --allow-read test/subtraction-quiz-scoring.test.ts test/src/components/subtraction-revisions.test.ts test/src/components/subtraction-mobile-header.test.ts`.
- [ ] **Step 3:** Commit `refactor: prune unused subtraction symbols`.

### Task 20: Remove unused number and measurement symbols

**Files:**
- Modify: `src/components/games/6-numbers/CountMatch.tsx` (`React`, `AnimatePresence`, `Card`, and `Play`).
- Modify: `src/components/games/6-numbers/DeepDive.tsx` (`React`, `Card`, and `Play`).
- Modify: `src/components/games/6-numbers/DragCorrectNumber.tsx` (`Card`, `Play`, `wrongShake`, `handleDrop`, and unused `i`).
- Modify: `src/components/games/6-numbers/NumberMonster.tsx` (`React` and `Play`).
- Modify: `src/components/games/6-numbers/ToyFactory.tsx` (`React` and `Play`).
- Modify: `src/components/games/7-measurement/LightHeavy.tsx` (`React`).
- Modify: `src/components/games/7-measurement/SlowFun.tsx` (`React`).
- Modify: `src/components/games/7-measurement/SmallShort.tsx` (`React`).
- Modify: `src/components/games/7-measurement/SnakeGame.tsx` (`React` and `attempts`).
- Modify: `src/components/games/7-measurement/TinyBuilderRuler.tsx` (`React` and `nextScore`).
- Modify: `test/measurement-quiz-scoring.test.ts` to accept SnakeGame’s setter-only attempts state while preserving its active-attempt assertion.

**Interfaces:** Number and measurement catalog order, fixed maxima, and completion callbacks remain unchanged.

- [ ] **Step 1:** Remove only the named unused declarations, keeping any callback side effects intact.
- [ ] **Step 2:** Run `npm.cmd run typecheck` and `deno test --no-check --allow-read test/numbers-quiz-scoring.test.ts test/measurement-quiz-scoring.test.ts test/src/components/numbers-revisions.test.ts test/src/components/measurement-skip-layout.test.ts`.
- [ ] **Step 3:** Commit `refactor: prune unused number and measurement symbols`.

### Task 21: Remove unused comparison-topic symbols

**Files:**
- Modify: `src/components/games/8-comparison/AyusinAngLaki.tsx` (`React` and `useRef`).
- Modify: `src/components/games/8-comparison/BarnyardBalance.tsx` (`React`).
- Modify: `src/components/games/8-comparison/CatchFall.tsx` (`React`).
- Modify: `src/components/games/8-comparison/MadScientist.tsx` (`React`).
- Modify: `src/components/games/8-comparison/MaramiKaunti.tsx` (`React` and `newAttempts`).
- Modify: `src/components/games/8-comparison/MataasMababa.tsx` (`React` and `newAttempts`).
- Modify: `src/components/games/8-comparison/Paghahambing1.tsx` (`React`, `Star`, and `newAttempts`).
- Modify: `src/components/games/8-comparison/SkyExplorer.tsx` (`React` and `newAttempts`).
- Modify: `src/components/games/8-comparison/WhichIsComp.tsx` (`React`).
- Modify: `src/components/games/8-comparison/WhichIsLonger.tsx` (`React`).

**Interfaces:** Comparison item scoring, mobile prompt layout, and assigned-quiz completion controls remain unchanged.

- [ ] **Step 1:** Remove only the named unused declarations.
- [ ] **Step 2:** Run `npm.cmd run typecheck` and `deno test --no-check --allow-read test/comparison-quiz-scoring.test.ts test/src/components/comparison-skip-layout.test.ts test/src/components/sky-explorer-mobile-prompt.test.ts test/which-is-longer-quiz.test.ts`.
- [ ] **Step 3:** Commit `refactor: prune unused comparison symbols`.

### Task 22: Remove unused clock-topic symbols

**Files:**
- Modify: `src/components/games/9-clock/BuildClock.tsx` (`React`, `attempts`, and unused `event`).
- Modify: `src/components/games/9-clock/ClockMultiple.tsx` (`React`).
- Modify: `src/components/games/9-clock/DailyRoutineTime.tsx` (`React`).
- Modify: `src/components/games/9-clock/DragMatchingClock.tsx` (`React`, `useDragControls`, and unused `event`).
- Modify: `src/components/games/9-clock/FillMissingTime.tsx` (`React` and unused `event`).
- Modify: `src/components/games/9-clock/TimeAdventure.tsx` (`React`).
- Modify: `src/components/games/9-clock/TimeMatcher.tsx` (`React`).
- Modify: `test/clock-quiz-scoring.test.ts` to accept BuildClock’s setter-only attempts state while preserving its active-drag assertion.

**Interfaces:** Clock drag/drop behavior, terminal scoring, and responsive menu behavior remain unchanged.

- [ ] **Step 1:** Remove only the named unused declarations or rename unused parameters with the existing underscore convention.
- [ ] **Step 2:** Run `npm.cmd run typecheck` and `deno test --no-check --allow-read test/clock-quiz-scoring.test.ts test/src/components/clock-mobile-layout.test.ts test/src/components/drag-matching-clock-mobile-options.test.ts test/src/components/time-adventure-menu-mobile.test.ts`.
- [ ] **Step 3:** Commit `refactor: prune unused clock symbols`.

### Task 23: Remove unused shared and page symbols

**Files:**
- Modify: `src/components/LessonSlideCard.tsx` to remove the unused `React` import.
- Modify: `src/components/student/LegacyLessonMenu.tsx` to remove the unused `React` import.
- Modify: `src/components/student/StudentPortalRail.tsx` to remove the unused `React` import.
- Modify: `src/pages/about.tsx` to remove the unused `React` import and `activeLabel` declaration.
- Modify: `src/pages/landing.tsx` to remove the unused `React` import.
- Modify: `src/pages/QuizPage.tsx` to remove the unused `currentStage` helper.
- Modify: `src/pages/student.tsx` to remove the unused import declaration reported by TypeScript.

**Interfaces:** Routes, lesson navigation, portal state, and page output remain unchanged.

- [ ] **Step 1:** Remove only the named unused declarations.
- [ ] **Step 2:** Run `npm.cmd run typecheck` and `deno test --no-check --allow-read test/src/components/LessonSlideCard.test.ts test/src/lib/student/portal.test.ts test/src/lib/student/navigation.test.ts test/src/pages/QuizPage.test.ts`.
- [ ] **Step 3:** Commit `refactor: prune unused shared symbols`.

### Task 24: Remove dead Radix dependencies

**Files:**
- Modify: `package.json` to remove the 24 dead Radix packages listed in the Dependency Map.
- Modify: `package-lock.json` to remove those direct dependencies and any now-unreachable transitive packages.
- Delete: `src/components/ui/slider.tsx` and `src/components/ui/switch.tsx`, whose only imports are their own dead Radix packages.

**Interfaces:** Keep `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, the reachable drawer implementation’s existing dependencies, `@radix-ui/react-select`, `@radix-ui/react-slot`, and any other package still imported by reachable source.

- [ ] **Step 1:** Re-run the runtime package scan and confirm none of the listed dead Radix packages is imported by reachable source.
- [ ] **Step 2:** Remove the direct packages with `npm.cmd uninstall --package-lock-only` using the exact package list from the Dependency Map, then inspect the manifest diff to ensure reachable packages remain.
- [ ] **Step 3:** Run `npm.cmd run typecheck` and the reachable-source package scan; defer the first meaningful build gate until Task 26 removes the known unused external alias.
- [ ] **Step 4:** Commit `chore: remove unused radix dependencies`.

### Task 25: Remove dead form, utility, and visualization dependencies

**Files:**
- Modify: `package.json` to remove `@hookform/resolvers`, `cmdk`, `date-fns`, `embla-carousel-react`, `input-otp`, `next-themes`, `react-hook-form`, `react-icons`, `react-resizable-panels`, `recharts`, `sonner`, and `zod`.
- Modify: `package-lock.json` to remove those direct dependencies and orphaned transitive packages.

**Interfaces:** Keep `@tailwindcss/typography` because it is referenced by `src/index.css`; keep `@types/*`, TypeScript, Vite, Tailwind, and packages imported by reachable modules.

- [ ] **Step 1:** Confirm the exact packages have no reachable source/config imports.
- [ ] **Step 2:** Remove them with `npm.cmd uninstall --package-lock-only` and inspect both manifest files.
- [ ] **Step 3:** Run `npm.cmd run typecheck` and the reachable-source package scan; defer the first meaningful build gate until Task 26 removes the known unused external alias.
- [ ] **Step 4:** Commit `chore: remove unused utility dependencies`.

### Task 26: Remove the unused Vite external alias

**Files:**
- Modify: `vite.config.ts` to remove the `@assets` alias entry and its `path.resolve(..., 'attached_assets')` block while retaining the `@` alias and all server/build settings.

**Interfaces:** No application import uses `@assets`; all application imports continue using `@` and public URLs.

- [ ] **Step 1:** Confirm `rg -n '@assets|attached_assets' src supabase public index.html package.json` returns no application usage.
- [ ] **Step 2:** Remove only the dead alias block.
- [ ] **Step 3:** Run `npm.cmd run typecheck` and `npm.cmd run build`; record any remaining build failure separately from the removed alias.
- [ ] **Step 4:** Commit `chore: remove unused vite asset alias`.

### Task 27: Remove unreferenced audio assets

**Files:**
- Delete: `public/assets/audio/audio/2d.mp3`
- Delete: `public/assets/audio/audio/2dia.MP3`
- Delete: `public/assets/audio/audio/2h.mp3`
- Delete: `public/assets/audio/audio/2tala.MP3`
- Delete: `public/assets/audio/audio/alpa.mp4`
- Delete: `public/assets/audio/colors/gray.mp3`
- Delete: `public/assets/audio/colors/red.mp3`

**Interfaces:** Keep all audio filenames referenced by `src/data/lessonContent.ts`, game components, or `AudioButton`.

- [ ] **Step 1:** Re-run the asset basename audit against reachable source, tests, and README and confirm these seven files are absent.
- [ ] **Step 2:** Delete only these seven files.
- [ ] **Step 3:** Run `npm.cmd run build` and `deno test --no-check --allow-read test/src/data/lessonContent.test.ts test/src/data/shapes-filipino-audio-mapping.test.ts`.
- [ ] **Step 4:** Commit `chore: remove unreferenced audio assets`.

### Task 28: Remove the unused alternate color asset set

**Files:**
- Delete: `public/assets/colors/black.png`
- Delete: `public/assets/colors/blue.png`
- Delete: `public/assets/colors/brown.png`
- Delete: `public/assets/colors/gray.png`
- Delete: `public/assets/colors/green.png`
- Delete: `public/assets/colors/orange.png`
- Delete: `public/assets/colors/yellow.png`

**Interfaces:** Keep `public/assets/colors/pink.png` and `public/assets/colors/red.png` only if the final audit still finds a live reference; the current audit marks those two as referenced.

- [ ] **Step 1:** Confirm no runtime or test path uses the seven listed alternate color images.
- [ ] **Step 2:** Delete the seven listed files.
- [ ] **Step 3:** Run `npm.cmd run build` and `deno test --no-check --allow-read test/colors-quiz-scoring.test.ts test/src/data/lessonContent.test.ts`.
- [ ] **Step 4:** Commit `chore: remove unused alternate color assets`.

### Task 29: Remove unreferenced legacy color images

**Files:**
- Delete: `public/assets/images/1b2br.png`, `1b2lr.png`, `1b2orr.png`, `1b3bc.png`, `1b3rc.png`, `1b4choc.png`, `1b9cc.png`, `1b9grc.png`, `1bbl.png`, `1bbl1.png`, `1bbla.png`, `1bbla1.png`, `1bbr.png`, `1bbr1.png`, `1bfvc.png`, `1bgr.png`, `1bgr1.png`, `1bgra.png`, `1bgra1.png`, `1bmantama.png`, `1bor.png`, `1bor1.png`, `1bpi.png`, `1bpi1.png`, `1bpinc.png`, `1bred.png`, `1bred1.png`, `1brtama.png`, `1bsm.gif`, `1bv1.png`, `1bvi.png`, `1bwh.png`, `1bwh1.png`, `1bwpc.png`, `1byel.png`, and `1byel1.png`.

**Interfaces:** Keep the live color lesson images listed in `src/data/colors.ts`, `src/data/lessonContent.ts`, and the student portal metadata.

- [ ] **Step 1:** Verify every listed basename is absent from reachable source, tests, and docs.
- [ ] **Step 2:** Delete the listed files.
- [ ] **Step 3:** Run `npm.cmd run build` and `deno test --no-check --allow-read test/colors-quiz-scoring.test.ts test/src/data/lessonContent.test.ts test/src/data/shapes-filipino-audio-mapping.test.ts`.
- [ ] **Step 4:** Commit `chore: remove unreferenced legacy color images`.

### Task 30: Remove unreferenced legacy shape images

**Files:**
- Delete: `public/assets/images/2bac.jpg`, `2back.jpg`, `2bc.png`, `2bd.png`, `2bh.png`, `2bo.png`, `2br.png`, `2bs.png`, `2bsq.png`, `2bt.png`, `2d.png`, `2h.png`, `2ov.png`, and `2tell.png`.

**Interfaces:** Keep live shape images `2c.png`, `2r.png`, `2s.png`, `2sq.png`, and `2t.png`.

- [ ] **Step 1:** Verify every listed basename is absent from reachable source, tests, and docs.
- [ ] **Step 2:** Delete the listed files.
- [ ] **Step 3:** Run `npm.cmd run build` and `deno test --no-check --allow-read test/shapes-quiz-scoring.test.ts test/src/data/shapes-lesson-mapping.test.ts test/src/data/shapes-filipino-audio-mapping.test.ts`.
- [ ] **Step 4:** Commit `chore: remove unreferenced legacy shape images`.

### Task 31: Remove unreferenced sequencing and addition images

**Files:**
- Delete: `public/assets/images/3bac.jpg`, `3bg.jpg`, `4b.png`, `4bg.jpg`, `4c.png`, `4d.png`, `4e.png`, `4f.png`, and `4g.png`.

**Interfaces:** Keep the live sequencing number assets, lesson images, and addition replacement assets referenced by `src/data/lessonContent.ts` and active games.

- [ ] **Step 1:** Verify every listed basename is absent from reachable source, tests, and docs.
- [ ] **Step 2:** Delete the listed files.
- [ ] **Step 3:** Run `npm.cmd run build` and `deno test --no-check --allow-read test/sequencing-quiz-scoring.test.ts test/addition-quiz-scoring.test.ts test/src/data/lessonContent.test.ts`.
- [ ] **Step 4:** Commit `chore: remove unreferenced sequencing assets`.

### Task 32: Remove unreferenced subtraction and number images

**Files:**
- Delete: `public/assets/images/5bg.jpg`, `5h.jpg`, `5j.jpg`, `5o.jpg`, `5pb.jpg`, `5pc.jpg`, `5pe.jpg`, `6back.jpg`, `6n0.png`, `6n1.png`, `6n10.png`, `6n2.png`, `6n3.png`, `6n4.png`, `6n5.png`, `6n6.png`, `6n7.png`, `6n8.png`, and `6n9.png`.

**Interfaces:** Keep current subtraction replacement assets and live number assets `60.png` through `620.png` as referenced by active game/data code.

- [ ] **Step 1:** Verify every listed basename is absent from reachable source, tests, and docs.
- [ ] **Step 2:** Delete the listed files.
- [ ] **Step 3:** Run `npm.cmd run build` and `deno test --no-check --allow-read test/subtraction-quiz-scoring.test.ts test/measurement-quiz-scoring.test.ts test/numbers-quiz-scoring.test.ts`.
- [ ] **Step 4:** Commit `chore: remove unreferenced subtraction assets`.

### Task 33: Remove unreferenced measurement, comparison, and clock images

**Files:**
- Delete: `public/assets/images/7bg.jpg`, `8bg.jpg`, `9a1.png`, `9a10.png`, `9a12.png`, `9a3.png`, `9a5.png`, `9a7.png`, `9a8.png`, `9aB.png`, and `9aN.png`.

**Interfaces:** Keep the active measurement, comparison, and clock images referenced by game components and lesson content.

- [ ] **Step 1:** Verify every listed basename is absent from reachable source, tests, and docs after Task 5 removes the obsolete generated free-play dataset.
- [ ] **Step 2:** Delete the listed files.
- [ ] **Step 3:** Run `npm.cmd run build` and `deno test --no-check --allow-read test/measurement-quiz-scoring.test.ts test/comparison-quiz-scoring.test.ts test/clock-quiz-scoring.test.ts`.
- [ ] **Step 4:** Commit `chore: remove unreferenced advanced-topic assets`.

### Task 34: Remove unreferenced miscellaneous images

**Files:**
- Delete: `public/assets/images/1kbk.jpg`, `1nk.png`, `cong.gif`, `home.png`, `indbut.png`, `indMV.png`, `lg.png`, `MR.jpg`, `nnn.png`, `np.png`, `oops.png`, `re.png`, `RE1.gif`, `RE2.gif`, `reback1.gif`, `se.png`, `sh.png`, `sm.gif`, `ta.gif`, `try.gif`, and `try.png`.

**Interfaces:** Keep the researcher/about-page images explicitly referenced by `src/pages/about.tsx` and the active student/lesson assets.

- [ ] **Step 1:** Verify every listed basename is absent from reachable source, tests, and docs.
- [ ] **Step 2:** Delete the listed files.
- [ ] **Step 3:** Run `npm.cmd run build` and `deno test --no-check --allow-read test/src/components/LessonSlideCard.test.ts test/src/lib/student/portal.test.ts`.
- [ ] **Step 4:** Commit `chore: remove unreferenced miscellaneous images`.

### Task 35: Remove the unused standalone shape asset directory

**Files:**
- Delete: `public/assets/shapes/circle.png`
- Delete: `public/assets/shapes/diamond.png`
- Delete: `public/assets/shapes/heart.png`
- Delete: `public/assets/shapes/oval.png`
- Delete: `public/assets/shapes/rectangle.png`
- Delete: `public/assets/shapes/square.png`
- Delete: `public/assets/shapes/triangle.png`

**Interfaces:** Active shape gameplay uses the referenced files in `public/assets/images/`, not this unused directory.

- [ ] **Step 1:** Verify `rg -n 'assets/shapes' src test supabase index.html README.md` returns no live reference.
- [ ] **Step 2:** Delete the seven standalone shape assets.
- [ ] **Step 3:** Run `npm.cmd run build` and `deno test --no-check --allow-read test/shapes-quiz-scoring.test.ts test/src/data/shapes-lesson-mapping.test.ts`.
- [ ] **Step 4:** Commit `chore: remove unused standalone shape assets`.

### Task 36: Remove the duplicate unused legacy video

**Files:**
- Delete: `public/assets/videos/alpa.mp4`

**Interfaces:** `src/data/lessonContent.ts` uses `public/assets/videos/alpabasa.mp4`; the deleted file is an unreferenced duplicate.

- [ ] **Step 1:** Verify `alpa.mp4` is absent from reachable source, tests, and docs while `alpabasa.mp4` remains present and referenced.
- [ ] **Step 2:** Delete `public/assets/videos/alpa.mp4`.
- [ ] **Step 3:** Run `npm.cmd run build` and `deno test --no-check --allow-read test/src/data/lessonContent.test.ts test/src/components/LessonSlideCard.test.ts`.
- [ ] **Step 4:** Commit `chore: remove unused legacy video`.

### Task 37: Final reachability, dependency, and asset audit

**Files:**
- No source changes expected; inspect all tracked changes and the final repository graph.

**Interfaces:** The final frontend graph must retain all live routes, games, teacher flows, and Supabase function imports.

- [ ] **Step 1:** Re-run the source reachability audit from `src/main.tsx` and confirm no deleted path is imported by reachable source.
- [ ] **Step 2:** Re-run the package scan and confirm no removed package is referenced by reachable source, tests, CSS, Vite config, or package scripts.
- [ ] **Step 3:** Re-run the asset scan and confirm all remaining deleted candidates are absent while all remaining basename references resolve to files.
- [ ] **Step 4:** Run `git diff --check`, `npm.cmd run typecheck`, `deno test --no-check --allow-read test`, and `npm.cmd run build`.
- [ ] **Step 5:** Confirm `.tmp-shape-matching-build/`, `.codex/`, `.agents/`, and `docs/legacy-prototype-reference/` are not staged; record any remaining failures against the baseline.
- [ ] **Step 6:** Commit any final non-empty audit correction separately; do not create an empty “audit” commit.

## Plan Self-Review

- Spec coverage: Tasks 1–5 cover tracked artifacts and obsolete generators/data; Tasks 6–14 cover unreachable source; Tasks 15–23 cover unused symbols; Tasks 24–25 cover dependencies; Task 26 covers the build-blocking alias; Tasks 27–36 cover the 132 cross-checked assets; Task 37 covers final verification.
- Preservation coverage: all preserved material is named in Global Constraints and the File and Dependency Map.
- Test integrity: only source-reading tests for deleted code are updated; live gameplay, teacher, auth, report, Supabase, and navigation coverage remains.
- Commit count: the plan contains 36 cleanup tasks before the final audit correction, satisfying the minimum 25 meaningful commits.
- Placeholder scan: every task names concrete files, commands, expected checks, and commit messages; no incomplete planning markers remain.
- Type consistency: no new runtime interfaces are introduced; all deletion tasks preserve existing import paths and public behavior.
