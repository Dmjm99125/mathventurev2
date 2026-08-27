import { assertEquals, assertMatch } from "jsr:@std/assert";

const renderedColorGames = [
  "src/components/games/1-colors/ColorMatchingGame.tsx",
  "src/components/games/1-colors/BalloonFindingGame.tsx",
  "src/components/games/1-colors/RainbowColorCatcher.tsx",
  "src/components/games/1-colors/RainbowColorDeluxe.tsx",
  "src/components/games/1-colors/RainbowGalaxyExplorer.tsx",
  "src/components/games/1-colors/ChooseWhichColor.tsx",
];

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../${relativePath}`, import.meta.url));
}

Deno.test("rendered colors quiz games report scored terminal completion", async () => {
  for (const path of renderedColorGames) {
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
  };

  for (const [path, expected] of Object.entries(expectations)) {
    const source = await readSource(path);
    assertMatch(source, expected, path);
  }
});
