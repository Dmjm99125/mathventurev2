# Lesson Video And Minigame Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the lesson intro video screen, remove legacy language badge assets from lesson slides, and add previous-screen back navigation only to minigames that already have an internal setup flow.

**Architecture:** Keep the lesson-stage changes local to `QuizPage` and `LessonSlideCard`, using source-based Deno tests that match the current repo style for static UI regressions. Implement minigame back behavior inside each affected game component so each button returns to that component's actual previous state instead of inventing a global navigation layer.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Lucide React, Deno tests, Vite, `tsc`

## Global Constraints

- The intro video screen must keep a clear forward path into the lesson stage.
- The larger video treatment must apply only to the lesson intro video stage rendered from `QuizPage`.
- `LessonSlideCard` must no longer reference `/assets/images/1eng.png`.
- `LessonSlideCard` must no longer reference `/assets/images/1fil.png`.
- English and Filipino lesson text content must remain visible after the asset removal.
- Ongoing minigames may show a `Back` control only when a real previous internal screen exists in that minigame's state machine.
- Straight-to-game minigames must show no back button.
- The new behavior must not change quiz progression for games that complete normally.

---

## File Structure

- Create: `test/src/pages/QuizPage.test.ts`
  Responsibility: guard the intro video stage against the removed `Skip Video` button returning and prove the stage keeps the larger player sizing.
- Create: `test/src/components/game-back-navigation.test.ts`
  Responsibility: source-scan the setup-screen minigames that should expose `Back` and verify each file points that button at the correct previous state.
- Modify: `src/pages/QuizPage.tsx`
  Responsibility: remove the intro-stage skip button and enlarge only the pre-lesson video layout.
- Modify: `src/components/LessonSlideCard.tsx`
  Responsibility: remove the `1eng.png` and `1fil.png` image markers without removing the English/Filipino text and audio sections.
- Modify: `test/src/components/LessonSlideCard.test.ts`
  Responsibility: extend the existing source-based test coverage to assert the legacy language badge assets are gone.
- Modify: `src/components/games/1-colors/RainbowColorDeluxe.tsx`
  Responsibility: add in-game back navigation from `game` to `difficulty`.
- Modify: `src/components/games/1-colors/RainbowGalaxyExplorer.tsx`
  Responsibility: add in-game back navigation from `game` to `start`.
- Modify: `src/components/games/2-shapes/ShapeWizard.tsx`
  Responsibility: add in-game back navigation from `game` to `world-map`.
- Modify: `src/components/games/2-shapes/HungryDragon.tsx`
  Responsibility: add in-game back navigation from `game` to `start`.
- Modify: `src/components/games/4-addition/AdditionAdventure.tsx`
  Responsibility: add in-game back navigation from `playing` to `menu`.
- Modify: `src/components/games/5-subtraction/SubtractionAdventure.tsx`
  Responsibility: standardize the existing in-game return control into an explicit `Back` action to `menu`.
- Modify: `src/components/games/7-measurement/SlowFun.tsx`
  Responsibility: add in-game back navigation from the active whack-a-mole round to the start screen.
- Modify: `src/components/games/9-clock/TimeAdventure.tsx`
  Responsibility: add in-game back navigation from `playing` to `menu` by reusing the existing reset helper.

### Task 1: Simplify The Intro Video Stage And Lesson Slide Language Cards

**Files:**
- Create: `test/src/pages/QuizPage.test.ts`
- Modify: `test/src/components/LessonSlideCard.test.ts`
- Modify: `src/pages/QuizPage.tsx`
- Modify: `src/components/LessonSlideCard.tsx`

**Interfaces:**
- Consumes: the existing `gameState === "video"` branch in `QuizPage`
- Consumes: the existing bilingual lesson-card sections in `LessonSlideCard`
- Produces: no new exported interfaces; this task is limited to local UI and regression tests

- [ ] **Step 1: Write the failing lesson UI regression tests**

```ts
// test/src/pages/QuizPage.test.ts
import { assertEquals } from "jsr:@std/assert";

Deno.test("lesson intro video removes the skip button and uses larger sizing", async () => {
  const source = await Deno.readTextFile(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("Skip Video"), false);
  assertEquals(source.includes("max-w-5xl"), true);
  assertEquals(source.includes("maxHeight: '520px'"), true);
});
```

```ts
// test/src/components/LessonSlideCard.test.ts
import { assertEquals } from "jsr:@std/assert";

Deno.test("natural grouped lesson media avoids horizontal scrolling and lets images shrink", async () => {
  const source = await Deno.readTextFile(new URL("../../../src/components/LessonSlideCard.tsx", import.meta.url));

  assertEquals(source.includes("overflow-x-auto"), false);
  assertEquals(source.includes("shrink-0"), false);
  assertEquals(source.includes("overflow-hidden"), true);
  assertEquals(source.includes("shrink object-contain"), true);
});

Deno.test("lesson slide cards no longer reference the legacy language badge images", async () => {
  const source = await Deno.readTextFile(new URL("../../../src/components/LessonSlideCard.tsx", import.meta.url));

  assertEquals(source.includes("1eng.png"), false);
  assertEquals(source.includes("1fil.png"), false);
});
```

- [ ] **Step 2: Run the lesson UI tests to verify they fail**

Run: `deno test test/src/pages/QuizPage.test.ts test/src/components/LessonSlideCard.test.ts`

Expected: FAIL because `QuizPage.tsx` still contains `Skip Video` and `LessonSlideCard.tsx` still references `1eng.png` and `1fil.png`.

- [ ] **Step 3: Implement the intro-stage and lesson-card UI changes**

```tsx
// src/pages/QuizPage.tsx
if (gameState === 'video') {
  return (
    <GameLayout topic={topic} stage="video" onExit={handleExit}>
      <div className="w-full max-w-5xl flex flex-col items-center gap-6 animate-in fade-in duration-500">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-display font-extrabold text-foreground capitalize">{topic}</h1>
          <p className="text-sm font-bold text-muted-foreground">Watch the video first!</p>
        </div>

        {lesson?.videoSrc ? (
          <Card className="w-full overflow-hidden border-4 border-primary/30 shadow-2xl rounded-2xl">
            <video
              ref={videoRef}
              src={lesson.videoSrc as string}
              controls
              className="w-full rounded-xl"
              style={{ maxHeight: '520px' }}
              onError={() => {/* graceful — controls still show */}}
            />
          </Card>
        ) : (
          <Card className="w-full p-12 text-center border-4 border-dashed border-primary/20">
            <p className="text-muted-foreground font-bold">Video not available</p>
          </Card>
        )}

        {lesson && (
          <p className="text-xs text-muted-foreground font-bold text-center max-w-lg italic">
            "{lesson.videoTitle}" — {lesson.videoCredit}
          </p>
        )}

        <div className="flex w-full justify-center">
          <Button
            size="lg"
            variant="jungle"
            className="gap-2 text-lg h-14 px-8 rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
            onClick={goToLesson}
          >
            Next: Lesson <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </GameLayout>
  );
}
```

```tsx
// src/components/LessonSlideCard.tsx
<div className={`grid ${slide.labelFil ? 'grid-cols-2' : 'grid-cols-1 max-w-sm mx-auto'} gap-4 w-full`}>
  <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-blue-50 border-2 border-blue-200">
    <div className="flex items-center gap-2">
      <span className="text-sm font-bold text-blue-700 uppercase tracking-wider">English</span>
    </div>
    <p className="text-2xl font-display font-extrabold text-blue-900 text-center">{slide.labelEn}</p>
    {slide.audioEn && (
      <AudioButton src={slide.audioEn} className="h-12 w-12" />
    )}
  </div>

  {slide.labelFil && (
    <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-yellow-50 border-2 border-yellow-200">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-yellow-700 uppercase tracking-wider">Filipino</span>
      </div>
      <p className="text-2xl font-display font-extrabold text-yellow-900 text-center">{slide.labelFil}</p>
      {slide.audioFil && (
        <AudioButton src={slide.audioFil} className="h-12 w-12" />
      )}
    </div>
  )}
</div>
```

- [ ] **Step 4: Run the lesson UI tests to verify they pass**

Run: `deno test test/src/pages/QuizPage.test.ts test/src/components/LessonSlideCard.test.ts`

Expected: PASS with 3 tests and 0 failures.

- [ ] **Step 5: Commit**

```bash
git add test/src/pages/QuizPage.test.ts test/src/components/LessonSlideCard.test.ts src/pages/QuizPage.tsx src/components/LessonSlideCard.tsx
git commit -m "feat: simplify lesson intro video and language cards"
```

### Task 2: Add Back Navigation To Color And Shape Setup Games

**Files:**
- Create: `test/src/components/game-back-navigation.test.ts`
- Modify: `src/components/games/1-colors/RainbowColorDeluxe.tsx`
- Modify: `src/components/games/1-colors/RainbowGalaxyExplorer.tsx`
- Modify: `src/components/games/2-shapes/ShapeWizard.tsx`
- Modify: `src/components/games/2-shapes/HungryDragon.tsx`

**Interfaces:**
- Consumes: `screen` state in `RainbowColorDeluxe`, `RainbowGalaxyExplorer`, `ShapeWizard`, and `HungryDragon`
- Produces: no new exported interfaces; each file keeps its current local state machine and adds a `Back` button that targets the previous setup state

- [ ] **Step 1: Write the failing color-and-shape back-navigation source tests**

```ts
// test/src/components/game-back-navigation.test.ts
import { assertEquals } from "jsr:@std/assert";

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../../../${relativePath}`, import.meta.url));
}

Deno.test("color and shape setup games expose Back buttons that return to the previous screen", async () => {
  const expectations = [
    {
      path: "src/components/games/1-colors/RainbowColorDeluxe.tsx",
      snippets: ["Back", "onClick={() => setScreen('difficulty')}"],
    },
    {
      path: "src/components/games/1-colors/RainbowGalaxyExplorer.tsx",
      snippets: ["Back", "onClick={() => setScreen('start')}"],
    },
    {
      path: "src/components/games/2-shapes/ShapeWizard.tsx",
      snippets: ["Back", "onClick={() => setScreen('world-map')}"],
    },
    {
      path: "src/components/games/2-shapes/HungryDragon.tsx",
      snippets: ["Back", "onClick={() => setScreen('start')}"],
    },
  ];

  for (const { path, snippets } of expectations) {
    const source = await readSource(path);
    for (const snippet of snippets) {
      assertEquals(source.includes(snippet), true);
    }
  }
});
```

- [ ] **Step 2: Run the back-navigation test to verify it fails**

Run: `deno test test/src/components/game-back-navigation.test.ts`

Expected: FAIL because the targeted game files do not yet include the required `Back` labels and previous-screen transitions.

- [ ] **Step 3: Implement back buttons for the color-and-shape setup games**

```tsx
// src/components/games/1-colors/RainbowColorDeluxe.tsx
import { ArrowLeft } from "lucide-react";

{screen === 'game' && (
  <div className="w-full max-w-2xl flex flex-col items-center animate-in fade-in">
    <div className="mb-4 flex w-full items-center justify-between gap-3">
      <Button
        variant="outline"
        className="rounded-xl bg-white/90 font-bold text-gray-700"
        onClick={() => setScreen('difficulty')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <div className="flex flex-wrap justify-center gap-4 text-xl font-bold text-gray-700">
        <div className="bg-white/90 px-6 py-2 rounded-2xl shadow-sm">Score: <span className="text-orange-500">{score}</span></div>
        <div className="bg-white/90 px-6 py-2 rounded-2xl shadow-sm">Best: <span className="text-blue-500">{highScore}</span></div>
        <div className="bg-white/90 px-6 py-2 rounded-2xl shadow-sm">Time: <span className="text-red-500">{timeLeft}</span></div>
      </div>
    </div>
```

```tsx
// src/components/games/1-colors/RainbowGalaxyExplorer.tsx
import { ArrowLeft } from "lucide-react";

{screen === 'game' && (
  <div className="relative z-10 w-full h-full flex flex-col items-center p-4 pt-16 animate-in fade-in">
    <div className="absolute top-4 left-4 z-20">
      <Button
        variant="outline"
        className="bg-black/60 text-white border border-gray-500 font-bold"
        onClick={() => setScreen('start')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
    </div>
```

```tsx
// src/components/games/2-shapes/ShapeWizard.tsx
import { ArrowLeft, Heart, Star, Trophy } from "lucide-react";

{screen === 'game' && (
  <motion.div key="game" className={getScreenClasses()} initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
    <div className="absolute top-20 left-4 z-20">
      <Button
        variant="outline"
        className="bg-white/90 border-2 border-purple-300 text-purple-700 font-bold shadow-sm rounded-xl"
        onClick={() => setScreen('world-map')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
    </div>
```

```tsx
// src/components/games/2-shapes/HungryDragon.tsx
import { ArrowLeft, Heart, Star } from "lucide-react";

{screen === 'game' && (
  <motion.div key="game" className={getScreenClasses()} initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
    <div className="absolute top-20 left-4 z-20">
      <Button
        variant="outline"
        className="bg-white/90 border-2 border-green-300 text-green-800 font-bold shadow-sm rounded-xl"
        onClick={() => setScreen('start')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
    </div>
```

- [ ] **Step 4: Run the color-and-shape back-navigation test to verify it passes**

Run: `deno test test/src/components/game-back-navigation.test.ts`

Expected: PASS with 1 test and 0 failures.

- [ ] **Step 5: Commit**

```bash
git add test/src/components/game-back-navigation.test.ts src/components/games/1-colors/RainbowColorDeluxe.tsx src/components/games/1-colors/RainbowGalaxyExplorer.tsx src/components/games/2-shapes/ShapeWizard.tsx src/components/games/2-shapes/HungryDragon.tsx
git commit -m "feat: add back navigation to color and shape setup games"
```

### Task 3: Add Back Navigation To The Remaining Setup-Screen Minigames

**Files:**
- Modify: `test/src/components/game-back-navigation.test.ts`
- Modify: `src/components/games/4-addition/AdditionAdventure.tsx`
- Modify: `src/components/games/5-subtraction/SubtractionAdventure.tsx`
- Modify: `src/components/games/7-measurement/SlowFun.tsx`
- Modify: `src/components/games/9-clock/TimeAdventure.tsx`

**Interfaces:**
- Consumes: `gameState` in `AdditionAdventure`, `SubtractionAdventure`, and `TimeAdventure`
- Consumes: `gameStarted`, `gameActive`, and `isCompleted` in `SlowFun`
- Produces: `const resetToStart = () => void` inside `SlowFun` for returning from active play to the start screen

- [ ] **Step 1: Extend the back-navigation test with the remaining setup-screen games**

```ts
// test/src/components/game-back-navigation.test.ts
Deno.test("adventure, measurement, and clock setup games expose Back buttons that return to the previous screen", async () => {
  const expectations = [
    {
      path: "src/components/games/4-addition/AdditionAdventure.tsx",
      snippets: ["Back", "onClick={() => setGameState('menu')}"],
    },
    {
      path: "src/components/games/5-subtraction/SubtractionAdventure.tsx",
      snippets: ["Back", "onClick={() => setGameState('menu')}"],
    },
    {
      path: "src/components/games/7-measurement/SlowFun.tsx",
      snippets: ["const resetToStart = () => {", "onClick={resetToStart}"],
    },
    {
      path: "src/components/games/9-clock/TimeAdventure.tsx",
      snippets: ["Back", "onClick={resetGame}"],
    },
  ];

  for (const { path, snippets } of expectations) {
    const source = await readSource(path);
    for (const snippet of snippets) {
      assertEquals(source.includes(snippet), true);
    }
  }
});
```

- [ ] **Step 2: Run the extended back-navigation tests to verify they fail**

Run: `deno test test/src/components/game-back-navigation.test.ts`

Expected: FAIL because the remaining setup-screen games do not all expose the required `Back` controls yet.

- [ ] **Step 3: Implement back buttons for the remaining setup-screen games**

```tsx
// src/components/games/4-addition/AdditionAdventure.tsx
import { ArrowLeft, Map, Play, CheckCircle2, XCircle, Star } from "lucide-react";

{gameState === 'playing' && (
  <div className="flex gap-4 items-center">
    <Button
      variant="outline"
      className="border-2 border-indigo-400 text-indigo-700 font-bold hover:bg-indigo-50 rounded-xl bg-white"
      onClick={() => setGameState('menu')}
    >
      <ArrowLeft className="mr-2 h-4 w-4" /> Back
    </Button>
    <div className="flex items-center gap-2 text-lg md:text-xl font-bold text-slate-700 bg-indigo-100 px-4 py-2 rounded-full shadow-sm">
      <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
      <span className="text-indigo-700">{score} / {MAX_SCORE}</span>
    </div>
```

```tsx
// src/components/games/5-subtraction/SubtractionAdventure.tsx
import { ArrowLeft, Play, CheckCircle2, XCircle, Star } from "lucide-react";

<Button
  variant="ghost"
  className="mt-2 text-slate-500 hover:bg-white/50 font-bold"
  onClick={() => setGameState('menu')}
>
  <ArrowLeft className="w-5 h-5 mr-2" /> Back
</Button>
```

```tsx
// src/components/games/7-measurement/SlowFun.tsx
import { ArrowLeft, Play, ChevronRight } from "lucide-react";

const resetToStart = () => {
  setScore(0);
  setGameStarted(false);
  setGameActive(false);
  setIsCompleted(false);
  setMessage("Ready to play?");
};

{gameStarted && !isCompleted && (
  <div className="absolute top-6 left-6 z-50">
    <Button
      variant="ghost"
      className="text-[#3e4e22] font-bold bg-white/50 hover:bg-white"
      onClick={resetToStart}
    >
      <ArrowLeft className="mr-1 w-5 h-5" /> Back
    </Button>
  </div>
)}
```

```tsx
// src/components/games/9-clock/TimeAdventure.tsx
import { ArrowLeft, ChevronRight } from "lucide-react";

<div className="absolute top-6 left-6 z-50">
  <Button
    variant="ghost"
    className="text-white font-bold bg-white/20 hover:bg-white/40"
    onClick={resetGame}
  >
    <ArrowLeft className="mr-1 w-5 h-5" /> Back
  </Button>
</div>
```

- [ ] **Step 4: Run the targeted tests and typecheck to verify everything passes**

Run: `deno test test/src/pages/QuizPage.test.ts test/src/components/LessonSlideCard.test.ts test/src/components/game-back-navigation.test.ts`

Expected: PASS with 5 tests and 0 failures.

Run: `npm run typecheck`

Expected: PASS with exit code 0.

- [ ] **Step 5: Commit**

```bash
git add test/src/components/game-back-navigation.test.ts src/components/games/4-addition/AdditionAdventure.tsx src/components/games/5-subtraction/SubtractionAdventure.tsx src/components/games/7-measurement/SlowFun.tsx src/components/games/9-clock/TimeAdventure.tsx
git commit -m "feat: add back navigation to setup-screen minigames"
```
