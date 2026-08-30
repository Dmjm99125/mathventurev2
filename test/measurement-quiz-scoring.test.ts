import { assertEquals, assertMatch } from "jsr:@std/assert";

const GAME_FILES = [
  "LightHeavy.tsx",
  "MagicRainbowBridge.tsx",
  "SlowFun.tsx",
  "SmallShort.tsx",
  "SnakeGame.tsx",
  "TinyBuilderRuler.tsx",
] as const;

const COMPLETION_SCORES: Record<(typeof GAME_FILES)[number], string> = {
  "LightHeavy.tsx": "onComplete?.(newScore, newAttempts)",
  "MagicRainbowBridge.tsx": "onComplete?.(newScore, attemptNumber)",
  "SlowFun.tsx": "onComplete?.(newScore, newAttempts)",
  "SmallShort.tsx": "onComplete?.(newScore, newAttempts)",
  "SnakeGame.tsx": "onComplete?.(score, attempts)",
  "TinyBuilderRuler.tsx": "onComplete?.(newScore, newAttempts)",
};

async function readGameSource(fileName: string) {
  return await Deno.readTextFile(new URL(`../src/components/games/7-measurement/${fileName}`, import.meta.url));
}

Deno.test("measurement quiz games report scored terminal completion", async () => {
  for (const fileName of GAME_FILES) {
    const source = await readGameSource(fileName);

    assertMatch(source, /onComplete\?: \(score\?: number, maxScore\?: number\) => void/);
    assertEquals(source.includes("onClick={onComplete}"), false, `${fileName} must not pass DOM events to callbacks`);
    assertEquals(source.includes("onComplete?.()"), true, `${fileName} preserves no-argument navigation callbacks`);
    assertEquals(source.includes(COMPLETION_SCORES[fileName]), true, `${fileName} reports its terminal score and attempts`);
  }
});

Deno.test("measurement quiz games count active wrong interactions as attempts", async () => {
  const expectations: Record<(typeof GAME_FILES)[number], RegExp> = {
    "LightHeavy.tsx": /setAttempts\(prev => prev \+ 1\)/,
    "MagicRainbowBridge.tsx": /setAttempts\(prev => prev \+ 1\)/,
    "SlowFun.tsx": /setAttempts\(prev => prev \+ 1\)/,
    "SmallShort.tsx": /setAttempts\(prev => prev \+ 1\)/,
    "SnakeGame.tsx": /setAttempts\(prev => prev \+ 1\)/,
    "TinyBuilderRuler.tsx": /setAttempts\(prev => prev \+ 1\)/,
  };

  for (const fileName of GAME_FILES) {
    const source = await readGameSource(fileName);

    assertMatch(source, /const \[attempts, setAttempts\] = useState\(0\)/);
    assertMatch(source, expectations[fileName]);
  }
});

Deno.test("the snake game can submit a scored result after a collision", async () => {
  const source = await readGameSource("SnakeGame.tsx");

  assertMatch(source, /isGameOver && !isCompleted && allowSkip === false && onComplete/);
  assertMatch(source, /onComplete\?\.\(score, Math\.max\(1, attempts\)\)/);
});
