# DepEd Theme Tables Before Lessons Design

## Goal

Show the DepEd-mandated curriculum theme table before every topic lesson opened through Free Play or an assigned classroom quiz, followed by the existing video, lesson slides, and activities.

## Scope

This change applies to the nine existing topic lessons: Colors, Shapes, Sequencing, Addition, Subtraction, Numbers, Measurement, Comparison, and Clock. It does not change the Free Play topic chooser, individual game content, scoring, persistence, or teacher assignment behavior.

`docs/DepEd/themes.md` remains the human-readable source of the nine curriculum tables. The frontend will use a typed copy of its structured fields so the Vite/PWA build does not depend on runtime markdown parsing or browser access to the repository docs directory.

## Architecture

Create `frontend/src/data/depedThemes.ts` with a typed record keyed by the existing lesson topic IDs. Each topic record contains the six table fields represented in `themes.md`: theme, content standard, performance standard, learning competencies, subthemes, and suggested contents.

Create `frontend/src/components/DepEdThemeTable.tsx` as the only presentation component for the curriculum data. It will render a semantic table with a caption, table head, row headers, and content cells. The table will be inside a horizontal-scroll wrapper with a readable minimum width, allowing left-right swiping on mobile without causing page-wide overflow.

Extend `QuizPage`'s stage state with a `theme` stage and initialize new visits there. The forward sequence is:

```text
theme -> video -> lesson -> quiz-intro -> activities
```

The same `QuizPage` route is already used by public Free Play and assigned classroom quizzes, so both modes receive the same theme screen. The table appears once per topic lesson launch, not before each individual game.

Existing assigned-quiz resume and completion restoration takes precedence over the new initial stage. An in-progress assignment resumes at its saved quiz state, and a completed assignment remains completed. Unknown or future topics without theme data render a non-fatal fallback message instead of crashing the lesson.

## UI and accessibility

The theme screen uses the existing `GameLayout` shell, topic title, and exit control. It presents a clearly labeled “DepEd Curriculum Theme” card and a single “Continue to video” action. The existing video, lesson, and activity screens retain their current behavior and styling.

The table uses semantic `<table>`, `<caption>`, `<thead>`, `<tbody>`, and row-header markup. Long curriculum text wraps within cells. The outer scroll container provides horizontal scrolling on narrow screens, while the table's minimum width preserves readable columns.

## Testing and verification

Add focused tests that verify:

- all nine topic IDs have typed DepEd theme data;
- the structured data preserves the authored markdown fields;
- the table component uses semantic table markup and the horizontal-scroll wrapper;
- `QuizPage` includes the theme stage, starts new lessons at that stage, and keeps the order theme → video → lesson → activities;
- Free Play and assigned quizzes continue to share the `QuizPage` flow;
- resume/completed assignment restoration still bypasses the new intro stage.

Run the focused Deno tests first, then the complete frontend test suite, TypeScript check, and production build:

```text
deno test --allow-read --allow-env --import-map=deno.json test/src/pages/QuizPage.test.ts test/src/components/DepEdThemeTable.test.ts
npm run typecheck
npm test
npm run build
```
