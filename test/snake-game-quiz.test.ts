import { assertEquals, assertMatch } from "jsr:@std/assert";

async function readSource() {
  return await Deno.readTextFile(new URL("../src/components/games/7-measurement/SnakeGame.tsx", import.meta.url));
}

Deno.test("SnakeGame classroom crashes hide replay and report the fixed quiz max", async () => {
  const source = await readSource();

  assertMatch(source, /const QUIZ_TARGET = 5;/);
  assertMatch(source, /\{(?:allowSkip !== false|canReplay) && isGameOver && !isCompleted && \(/);
  assertEquals(source.includes("Math.max(1, attempts)"), false);
  assertMatch(source, /onComplete\?\.\(score, QUIZ_TARGET\)/);
});

Deno.test("SnakeGame assigned success reuses one fixed-max Continue action", async () => {
  const source = await readSource();

  assertMatch(source, /const assignedContinueButton = isAssignedMode && onComplete \? \(/);
  assertMatch(source, /\{isCompleted && \([\s\S]{0,900}assignedContinueButton/);
  assertEquals(source.includes("onComplete?.(score, attempts)"), false);
  assertEquals(source.includes("Next Game <ChevronRight"), false);
});
