import { assertEquals, assertMatch } from "jsr:@std/assert";

const quizRenderedColorGames = [
  "src/components/games/1-colors/ColorMatchingGame.tsx",
  "src/components/games/1-colors/BalloonFindingGame.tsx",
  "src/components/games/1-colors/RainbowColorCatcher.tsx",
  "src/components/games/1-colors/RainbowColorDeluxe.tsx",
  "src/components/games/1-colors/RainbowGalaxyExplorer.tsx",
  "src/components/games/1-colors/ChooseWhichColor.tsx",
];

const allColorGames = [
  ...quizRenderedColorGames,
  "src/components/games/1-colors/MultipleChoice.tsx",
];

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../${relativePath}`, import.meta.url));
}

Deno.test("rendered colors quiz games report scored terminal completion", async () => {
  for (const path of quizRenderedColorGames) {
    const source = await readSource(path);

    assertMatch(source, /onComplete\?: \(score\?: number, maxScore\?: number\) => void/);
    assertMatch(source, /onComplete(?:\?\.)?\([^,\n]+, [^)\n]+\)/);
    assertEquals(source.includes("onClick={onComplete}"), false);
    assertMatch(source, /onComplete\(\)/);
  }
});

Deno.test("colors quiz games track wrong interactions in total attempts", async () => {
    const expectations: Record<string, RegExp> = {
      "src/components/games/1-colors/ColorMatchingGame.tsx": /setTotalAttempts\(attempts => attempts \+ 1\)/,
      "src/components/games/1-colors/BalloonFindingGame.tsx": /totalAttemptsRef\.current \+= 1/,
    "src/components/games/1-colors/RainbowColorCatcher.tsx": /attemptsRef\.current \+= 1/,
    "src/components/games/1-colors/RainbowColorDeluxe.tsx": /attemptsRef\.current \+= 1/,
    "src/components/games/1-colors/RainbowGalaxyExplorer.tsx": /attemptsRef\.current \+= 1/,
    "src/components/games/1-colors/ChooseWhichColor.tsx": /setTotalAttempts\(attempts => attempts \+ 1\)/,
    "src/components/games/1-colors/MultipleChoice.tsx": /setTotalAttempts\(attempts => attempts \+ 1\)/,
  };

  for (const [path, expected] of Object.entries(expectations)) {
    const source = await readSource(path);
    assertMatch(source, expected, path);
  }
});

Deno.test("timed-out or exhausted color games still expose scored assigned-quiz completion", async () => {
  const exhaustedSource = await readSource("src/components/games/1-colors/RainbowColorCatcher.tsx");
  const timedOutSource = await readSource("src/components/games/1-colors/RainbowColorDeluxe.tsx");
  const explorationSource = await readSource("src/components/games/1-colors/RainbowGalaxyExplorer.tsx");

  assertMatch(exhaustedSource, /allowSkip === false && onComplete/);
  assertMatch(exhaustedSource, /onComplete\(correctItems, Math\.max\(1, totalItems\)\)/);
  assertMatch(timedOutSource, /onComplete && allowSkip === false/);
  assertMatch(timedOutSource, /onComplete\(correctItems, totalItems\)/);
  assertEquals(explorationSource.includes("onComplete && (allowSkip !== false || isCompleted)"), false);
  assertMatch(explorationSource, /onComplete\(correctItems, totalItems\)/);
});

Deno.test("every colors game exposes the assigned-quiz navigation contract", async () => {
  for (const path of allColorGames) {
    const source = await readSource(path);

    assertMatch(source, /allowSkip\?: boolean/, path);
    assertEquals(source.includes("onClick={onComplete}"), false, path);
  }
});

Deno.test("color gameplay back controls are hidden in assigned quizzes", async () => {
  for (const path of [
    "src/components/games/1-colors/RainbowGalaxyExplorer.tsx",
    "src/components/games/1-colors/RainbowColorDeluxe.tsx",
  ]) {
    const source = await readSource(path);
    assertEquals(source.includes("{allowSkip !== false && ("), true, path);
  }
});

Deno.test("ChooseWhichColor advances after a wrong assigned-quiz answer", async () => {
  const source = await readSource("src/components/games/1-colors/ChooseWhichColor.tsx");

  assertMatch(source, /if \(allowSkip === false\)[\s\S]*advanceQuestion/);
  assertMatch(source, /setInternalIndex\(prev => prev \+ 1\)/);
  assertMatch(source, /allowSkip === false \? 'Next Question' : 'Try Again'/);
});

Deno.test("ColorMatchingGame consumes wrong items in assigned quizzes", async () => {
  const source = await readSource("src/components/games/1-colors/ColorMatchingGame.tsx");

  assertMatch(source, /quizWrong: boolean/);
  assertMatch(source, /allowSkip === false[\s\S]*quizWrong: true/);
  assertMatch(source, /const quizComplete =/);
  assertMatch(source, /onComplete\(correctItems, allowSkip === false \? items\.length : totalItems\)/);
});
