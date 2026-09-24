# DepEd Theme Tables Before Lessons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a DepEd curriculum-theme screen before every Free Play and assigned quiz lesson, preserving the existing video, lesson, and activity flow.

**Architecture:** Store the nine authored markdown tables as typed frontend data, render them with one semantic horizontally scrollable table component, and add a `theme` stage to the shared `GameLayout`/`QuizPage` flow. Both Free Play and assigned quizzes already use `QuizPage`, so no route duplication is needed.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Deno tests, Wouter.

## Global Constraints

- Keep `docs/DepEd/themes.md` as the human-readable source of the nine curriculum tables and preserve its wording exactly.
- Support exactly these topic IDs: `colors`, `shapes`, `sequencing`, `addition`, `subtraction`, `numbers`, `measurement`, `comparison`, and `clock`.
- The learner flow must be `theme -> video -> lesson -> quiz-intro -> activities`.
- The theme table must scroll left-right on narrow screens and must not create page-wide horizontal overflow.
- Do not parse markdown at runtime or require the docs directory to be browser-served.
- Preserve assigned-quiz resume/completion restoration, scoring, persistence, Free Play behavior, and existing game content.
- Do not modify or weaken existing tests, lint/typecheck/build gates, or unrelated dirty-worktree files.

---

### Task 1: Add typed DepEd theme data

**Files:**
- Create: `frontend/src/data/depedThemes.ts`
- Create: `frontend/test/src/data/depedThemes.test.ts`

**Interfaces:**
- Produces `DepEdThemeRow`, `DepEdTheme`, and `DEPED_THEMES: Record<TeacherTopicId, DepEdTheme>` for the table component and lesson page.
- Consumes the exact six-row content from `docs/DepEd/themes.md` for each existing topic.

- [ ] **Step 1: Write the failing data-contract test**

Create `frontend/test/src/data/depedThemes.test.ts`:

```ts
import { assertEquals, assertStringIncludes } from "jsr:@std/assert";
import { DEPED_THEMES } from "../../../src/data/depedThemes.ts";

const topicIds = [
  "colors",
  "shapes",
  "sequencing",
  "addition",
  "subtraction",
  "numbers",
  "measurement",
  "comparison",
  "clock",
] as const;

const expectedThemeFields = {
  colors: "THEME I",
  shapes: "THEME I",
  sequencing: "THEME II",
  addition: "THEME III",
  subtraction: "THEME III",
  numbers: "THEME I",
  measurement: "THEME IV",
  comparison: "THEME I",
  clock: "THEME II",
} as const;

Deno.test("DepEd themes cover every lesson topic with six authored rows", () => {
  assertEquals(Object.keys(DEPED_THEMES).sort(), [...topicIds].sort());

  for (const topicId of topicIds) {
    assertEquals(DEPED_THEMES[topicId].rows.length, 6, topicId);
    assertEquals(DEPED_THEMES[topicId].rows.map((row) => row.field), [
      expectedThemeFields[topicId],
      "CONTENT STANDARD",
      "PERFORMANCE STANDARD",
      "LEARNING COMPETENCIES",
      "SUBTHEMES",
      "SUGGESTED CONTENTS",
    ]);
  }
});

Deno.test("DepEd theme data preserves representative authored wording", () => {
  assertEquals(DEPED_THEMES.colors.title, "Colors");
  assertStringIncludes(
    DEPED_THEMES.colors.rows[1].content,
    "The learners understand the value of knowing oneself",
  );
  assertEquals(
    DEPED_THEMES.addition.rows[5].content,
    "Joining Sets and Basic Addition (Concrete and Pictorial Models up to 10)",
  );
  assertEquals(
    DEPED_THEMES.clock.rows[0].content,
    "EXPLORING OUR COMMUNITY",
  );
});
```

- [ ] **Step 2: Run the focused test and verify the expected missing-module failure**

Run from `frontend/`:

```text
deno test --allow-read --allow-env --import-map=deno.json test/src/data/depedThemes.test.ts
```

Expected: FAIL because `src/data/depedThemes.ts` does not exist yet.

- [ ] **Step 3: Add the typed data module with the exact markdown rows**

Create `frontend/src/data/depedThemes.ts`:

```ts
import type { TeacherTopicId } from "@/lib/games/catalog";

export interface DepEdThemeRow {
  field: string;
  content: string;
}

export interface DepEdTheme {
  title: string;
  rows: readonly DepEdThemeRow[];
}

export const DEPED_THEMES: Record<TeacherTopicId, DepEdTheme> = {
  colors: {
    title: "Colors",
    rows: [
      { field: "THEME I", content: "KNOWING WHO WE ARE AND OUR FAMILIES" },
      { field: "CONTENT STANDARD", content: "The learners understand the value of knowing oneself, one’s physical features, and surroundings." },
      { field: "PERFORMANCE STANDARD", content: "The learners demonstrate basic concepts of sorting and identifying visual attributes in their immediate environment." },
      { field: "LEARNING COMPETENCIES", content: "Identify, group, and sort concrete objects according to color (primary and secondary colors)." },
      { field: "SUBTHEMES", content: "1. I am unique (My body, my clothes, and things around me)." },
      { field: "SUGGESTED CONTENTS", content: "Identifying and Sorting Colors (Red, Blue, Yellow, Green, Orange, Purple, Black, White)" },
    ],
  },
  shapes: {
    title: "Shapes",
    rows: [
      { field: "THEME I", content: "KNOWING WHO WE ARE AND OUR FAMILIES" },
      { field: "CONTENT STANDARD", content: "The learners understand the physical characteristics and shapes of common objects in the school and home." },
      { field: "PERFORMANCE STANDARD", content: "The learners identify, sort, and construct two-dimensional (2D) shapes using manipulative materials." },
      { field: "LEARNING COMPETENCIES", content: "Identify and describe common two-dimensional shapes (circle, triangle, square, rectangle)." },
      { field: "SUBTHEMES", content: "2. My family and the things we see in our home." },
      { field: "SUGGESTED CONTENTS", content: "2D Shapes in the Environment (Circle, Square, Triangle, Rectangle)" },
    ],
  },
  sequencing: {
    title: "Sequencing",
    rows: [
      { field: "THEME II", content: "EXPLORING OUR COMMUNITY" },
      { field: "CONTENT STANDARD", content: "The learners understand the concept of order, logical progression, and patterns in daily routines." },
      { field: "PERFORMANCE STANDARD", content: "The learners arrange events and patterns in logical sequential order." },
      { field: "LEARNING COMPETENCIES", content: "Sequence events with 3 to 4 steps (e.g., daily routines, stories, or growth stages); identify and complete repeating patterns." },
      { field: "SUBTHEMES", content: "2. Daily routines in our community and school." },
      { field: "SUGGESTED CONTENTS", content: "Event Sequencing (First, Next, Last) and Repeating Patterns (AB, AAB)" },
    ],
  },
  addition: {
    title: "Addition",
    rows: [
      { field: "THEME III", content: "DISCOVERING OUR SURROUNDINGS" },
      { field: "CONTENT STANDARD", content: "The learners understand the concept of combining sets and the meaning of addition." },
      { field: "PERFORMANCE STANDARD", content: "The learners perform simple addition involving concrete objects with sums up to 10." },
      { field: "LEARNING COMPETENCIES", content: "Combine two sets of concrete objects to find the total sum (up to 10)." },
      { field: "SUBTHEMES", content: "1. Living things and gathering objects in nature." },
      { field: "SUGGESTED CONTENTS", content: "Joining Sets and Basic Addition (Concrete and Pictorial Models up to 10)" },
    ],
  },
  subtraction: {
    title: "Subtraction",
    rows: [
      { field: "THEME III", content: "DISCOVERING OUR SURROUNDINGS" },
      { field: "CONTENT STANDARD", content: "The learners understand the concept of taking away elements from a set and the meaning of subtraction." },
      { field: "PERFORMANCE STANDARD", content: "The learners perform simple subtraction using manipulatives and visual representations within 10." },
      { field: "LEARNING COMPETENCIES", content: "Take away a specific quantity from a given set of objects to find how many are left (within 10)." },
      { field: "SUBTHEMES", content: "2. Caring for animals and sharing natural resources." },
      { field: "SUGGESTED CONTENTS", content: "Separating Sets and Basic Subtraction (Taking Away within 10)" },
    ],
  },
  numbers: {
    title: "Numbers",
    rows: [
      { field: "THEME I", content: "KNOWING WHO WE ARE AND OUR FAMILIES" },
      { field: "CONTENT STANDARD", content: "The learners understand numeral identification, one-to-one correspondence, and cardinal values from 1 to 20." },
      { field: "PERFORMANCE STANDARD", content: "The learners count, recognize, write, and represent quantities up to 20 accurately." },
      { field: "LEARNING COMPETENCIES", content: "Count objects with one-to-one correspondence; read and write numerals 1 to 20; recognize quantity representations." },
      { field: "SUBTHEMES", content: "3. Counting members and objects in our household." },
      { field: "SUGGESTED CONTENTS", content: "Cardinal Numbers 1 to 20, Counting Songs, and Number Representation" },
    ],
  },
  measurement: {
    title: "Measurement",
    rows: [
      { field: "THEME IV", content: "CARING FOR OUR WORLD" },
      { field: "CONTENT STANDARD", content: "The learners understand the concept of comparing and measuring attributes using non-standard tools." },
      { field: "PERFORMANCE STANDARD", content: "The learners measure and estimate length, mass, and capacity using non-standard units (paper clips, blocks, hand spans)." },
      { field: "LEARNING COMPETENCIES", content: "Measure and compare objects using non-standard measurement tools (e.g., longer/shorter, heavier/lighter, holds more/holds less)." },
      { field: "SUBTHEMES", content: "2. Exploring materials and resources in our environment." },
      { field: "SUGGESTED CONTENTS", content: "Non-Standard Measurement (Length, Height, Weight, and Capacity)" },
    ],
  },
  comparison: {
    title: "Comparison",
    rows: [
      { field: "THEME I", content: "KNOWING WHO WE ARE AND OUR FAMILIES" },
      { field: "CONTENT STANDARD", content: "The learners understand relative attributes and relationships between two or more physical objects." },
      { field: "PERFORMANCE STANDARD", content: "The learners compare and sort objects based on measurable size, length, and quantity." },
      { field: "LEARNING COMPETENCIES", content: "Compare objects using comparative terms: big/small, long/short, tall/short, heavy/light, more/less/equal." },
      { field: "SUBTHEMES", content: "1. Observing physical traits and everyday objects." },
      { field: "SUGGESTED CONTENTS", content: "Comparative Concepts (Big/Small, Long/Short, Tall/Short, More/Less/Equal)" },
    ],
  },
  clock: {
    title: "Clock",
    rows: [
      { field: "THEME II", content: "EXPLORING OUR COMMUNITY" },
      { field: "CONTENT STANDARD", content: "The learners understand basic concepts of time, parts of the day, and tell time by the hour on an analog clock." },
      { field: "PERFORMANCE STANDARD", content: "The learners tell time to the hour and associate specific times with school and daily community activities." },
      { field: "LEARNING COMPETENCIES", content: "Tell and show time by the hour using an analog clock; identify times associated with daily routines (morning, noon, night)." },
      { field: "SUBTHEMES", content: "1. A day in our community (Schedules and helpers)." },
      { field: "SUGGESTED CONTENTS", content: "Telling Time by the Hour (Analog Clock Faces and Daily Schedules)" },
    ],
  },
};
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```text
deno test --allow-read --allow-env --import-map=deno.json test/src/data/depedThemes.test.ts
```

Expected: PASS with both data-contract tests passing.

- [ ] **Step 5: Commit the typed data and tests**

```text
git add frontend/src/data/depedThemes.ts frontend/test/src/data/depedThemes.test.ts
git commit -m "feat: add DepEd lesson theme data"
```

### Task 2: Build the semantic, horizontally scrollable table

**Files:**
- Create: `frontend/src/components/DepEdThemeTable.tsx`
- Create: `frontend/test/src/components/DepEdThemeTable.test.ts`

**Interfaces:**
- Consumes `DepEdTheme` from `frontend/src/data/depedThemes.ts`.
- Produces `DepEdThemeTable({ theme }: { theme?: DepEdTheme })`.

- [ ] **Step 1: Write the failing component contract test**

Create `frontend/test/src/components/DepEdThemeTable.test.ts`:

```ts
import { assertEquals } from "jsr:@std/assert";

const source = await Deno.readTextFile(
  new URL("../../../src/components/DepEdThemeTable.tsx", import.meta.url),
);

Deno.test("DepEd theme table is semantic and horizontally scrollable", () => {
  assertEquals(source.includes("<table"), true);
  assertEquals(source.includes("<caption"), true);
  assertEquals(source.includes("<thead"), true);
  assertEquals(source.includes("<tbody"), true);
  assertEquals(source.includes('scope="row"'), true);
  assertEquals(source.includes("overflow-x-auto"), true);
  assertEquals(source.includes("min-w-[42rem]"), true);
});

Deno.test("DepEd theme table has an unavailable-theme fallback", () => {
  assertEquals(source.includes("Theme information unavailable"), true);
});
```

- [ ] **Step 2: Run the focused test and verify the expected missing-module failure**

Run from `frontend/`:

```text
deno test --allow-read --allow-env --import-map=deno.json test/src/components/DepEdThemeTable.test.ts
```

Expected: FAIL because `src/components/DepEdThemeTable.tsx` does not exist yet.

- [ ] **Step 3: Implement the minimal table component**

Create `frontend/src/components/DepEdThemeTable.tsx`:

```tsx
import { Card } from '@/components/ui';
import type { DepEdTheme } from '@/data/depedThemes';

interface DepEdThemeTableProps {
  theme?: DepEdTheme;
}

export function DepEdThemeTable({ theme }: DepEdThemeTableProps) {
  if (!theme) {
    return (
      <Card className="w-full max-w-4xl border-4 border-dashed border-primary/20 p-6 text-center">
        <p className="font-bold text-muted-foreground">Theme information unavailable</p>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl border-4 border-primary/20 p-4 shadow-xl sm:p-6">
      <div
        className="overflow-x-auto rounded-xl"
        tabIndex={0}
        aria-label={`${theme.title} DepEd curriculum theme table`}
      >
        <table className="w-full min-w-[42rem] border-collapse text-left">
          <caption className="sr-only">{theme.title} DepEd curriculum theme</caption>
          <thead>
            <tr className="bg-primary text-primary-foreground">
              <th className="w-1/3 px-4 py-3 text-sm font-extrabold uppercase tracking-wide" scope="col">
                Field
              </th>
              <th className="px-4 py-3 text-sm font-extrabold uppercase tracking-wide" scope="col">
                Content
              </th>
            </tr>
          </thead>
          <tbody>
            {theme.rows.map((row) => (
              <tr key={row.field} className="border-b border-border last:border-b-0 even:bg-muted/30">
                <th className="align-top px-4 py-4 text-sm font-extrabold text-foreground" scope="row">
                  {row.field}
                </th>
                <td className="px-4 py-4 text-sm font-medium leading-6 text-muted-foreground">
                  {row.content}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```text
deno test --allow-read --allow-env --import-map=deno.json test/src/components/DepEdThemeTable.test.ts
```

Expected: PASS with both component contract tests passing.

- [ ] **Step 5: Commit the table component and tests**

```text
git add frontend/src/components/DepEdThemeTable.tsx frontend/test/src/components/DepEdThemeTable.test.ts
git commit -m "feat: render scrollable DepEd theme tables"
```

### Task 3: Add the theme stage to the lesson flow

**Files:**
- Modify: `frontend/src/components/GameLayout.tsx`
- Modify: `frontend/src/pages/QuizPage.tsx`
- Modify: `frontend/test/src/pages/QuizPage.test.ts`
- Create: `frontend/test/src/components/game-layout.test.ts`

**Interfaces:**
- `GameLayout` accepts `stage="theme"` in its existing `LessonStage` prop.
- `QuizPage` consumes `DEPED_THEMES` and `DepEdThemeTable` and starts new lessons at `theme`.

- [ ] **Step 1: Write failing integration contract tests**

Append to `frontend/test/src/pages/QuizPage.test.ts`:

```ts
Deno.test("new lessons start with the DepEd theme stage before video", async () => {
  const source = await Deno.readTextFile(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("type GameState = 'theme' | 'video' | 'lesson'"), true);
  assertEquals(source.includes("useState<GameState>('theme')"), true);
  assertEquals(source.includes("if (gameState === 'theme')"), true);
  assertEquals(source.includes('stage="theme"'), true);
  assertEquals(source.includes("Continue to video"), true);
  assertEquals(source.includes("DEPED_THEMES"), true);
  assertEquals(source.includes("<DepEdThemeTable"), true);
});

Deno.test("assigned quiz resume still bypasses the theme stage", async () => {
  const source = await Deno.readTextFile(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("if (savedQuizState.status === 'completed')"), true);
  assertEquals(source.includes("if (savedQuizState.status === 'in_progress' && gameState === 'theme')"), true);
  assertEquals(source.includes("setGameState('quiz-intro')"), true);
});
```

Create `frontend/test/src/components/game-layout.test.ts`:

```ts
import { assertEquals } from "jsr:@std/assert";

Deno.test("GameLayout exposes the theme progress stage before video", async () => {
  const source = await Deno.readTextFile(new URL("../../../src/components/GameLayout.tsx", import.meta.url));

  assertEquals(source.includes("export type LessonStage = 'theme' | 'video' | 'lesson' | 'quiz';"), true);
  assertEquals(source.includes("key: 'theme', label: 'Theme'"), true);
  assertEquals(source.indexOf("key: 'theme'") < source.indexOf("key: 'video'"), true);
});
```

- [ ] **Step 2: Run the focused tests and verify the expected failures**

Run from `frontend/`:

```text
deno test --allow-read --allow-env --import-map=deno.json test/src/pages/QuizPage.test.ts test/src/components/game-layout.test.ts
```

Expected: FAIL because the current state type, initial state, render branch, and `GameLayout` stage list do not yet include `theme`.

- [ ] **Step 3: Update the shared progress indicator**

In `frontend/src/components/GameLayout.tsx`, import `Table2` from `lucide-react`, change the stage type, and prepend the theme stage:

```tsx
import { ArrowLeft, Video, BookOpen, Gamepad2, Table2 } from 'lucide-react';

export type LessonStage = 'theme' | 'video' | 'lesson' | 'quiz';

const STAGES: { key: LessonStage; label: string; Icon: React.ElementType }[] = [
  { key: 'theme', label: 'Theme', Icon: Table2 },
  { key: 'video', label: 'Video', Icon: Video },
  { key: 'lesson', label: 'Lesson', Icon: BookOpen },
  { key: 'quiz', label: 'Activities', Icon: Gamepad2 },
];
```

- [ ] **Step 4: Add the theme stage and preserve resume behavior in `QuizPage`**

Make these exact changes in `frontend/src/pages/QuizPage.tsx`:

```tsx
import { DepEdThemeTable } from '@/components/DepEdThemeTable';
import { DEPED_THEMES } from '@/data/depedThemes';

type GameState = 'theme' | 'video' | 'lesson' | 'quiz-intro' | 'playing' | 'feedback' | 'completed';

const [gameState, setGameState] = useState<GameState>('theme');

useEffect(() => {
  if (!assignmentId || !savedQuizState) return;

  if (savedQuizState.status === 'completed') {
    setCurrentIndex(savedQuizState.currentGameOrder);
    setScore(savedQuizState.score);
    setGameResults(savedQuizState.gameResults);
    setGameState('completed');
    return;
  }

  if (savedQuizState.status === 'in_progress' && gameState === 'theme') {
    setCurrentIndex(savedQuizState.currentGameOrder);
    setScore(savedQuizState.score);
    setGameResults(savedQuizState.gameResults);
    setGameState('quiz-intro');
  }
}, [assignmentId, gameState, savedQuizState?.status, savedQuizState?.currentGameOrder]);

const goToVideo = () => {
  setGameState('video');
};
```

Insert this render branch immediately before the existing `if (gameState === 'video')` branch:

```tsx
  if (gameState === 'theme') {
    return (
      <GameLayout topic={topic} stage="theme" onExit={handleExit}>
        <div className="w-full max-w-5xl flex flex-col items-center gap-6 animate-in fade-in duration-500">
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-display font-extrabold text-foreground capitalize">{topic}</h1>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-muted-foreground">
              DepEd Curriculum Theme
            </p>
          </div>

          <DepEdThemeTable theme={DEPED_THEMES[topic as TeacherTopicId]} />

          <Button
            size="lg"
            variant="jungle"
            className="h-14 gap-2 rounded-full px-8 text-lg shadow-lg shadow-primary/20 transition-transform hover:scale-105"
            onClick={goToVideo}
          >
            Continue to video <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </GameLayout>
    );
  }
```

- [ ] **Step 5: Run the focused integration tests and verify they pass**

Run:

```text
deno test --allow-read --allow-env --import-map=deno.json test/src/pages/QuizPage.test.ts test/src/components/game-layout.test.ts
```

Expected: PASS, including the pre-existing `QuizPage` tests.

- [ ] **Step 6: Commit the integrated lesson flow**

```text
git add frontend/src/components/GameLayout.tsx frontend/src/pages/QuizPage.tsx frontend/test/src/pages/QuizPage.test.ts frontend/test/src/components/game-layout.test.ts
git commit -m "feat: show DepEd theme before lessons"
```

### Task 4: Run the complete quality gates

**Files:**
- No source changes expected.

- [ ] **Step 1: Run the complete frontend test suite**

From the repository root, run:

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

Expected: exit code 0 and a successfully generated frontend production bundle.

- [ ] **Step 4: Inspect the final diff and worktree**

```text
git diff HEAD~3..HEAD --stat
git status --short
```

Confirm the three feature commits contain only the typed data, table component, lesson-flow changes, and their tests. Confirm the pre-existing untracked files remain unmodified and un-staged.

- [ ] **Step 5: Commit only if a verification-only adjustment was required**

Do not create a commit if verification passes without source changes. If a directly related fix is required, rerun the affected focused test plus all three full gates before committing it.
