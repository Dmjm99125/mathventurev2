import { assertEquals, assertMatch } from "jsr:@std/assert";

async function readSource() {
  return await Deno.readTextFile(new URL("../src/components/games/7-measurement/SnakeGame.tsx", import.meta.url));
}

Deno.test("SnakeGame classroom crashes hide replay and report the fixed quiz max", async () => {
  const source = await readSource();

  assertMatch(source, /const QUIZ_TARGET = 5;/);
  assertMatch(source, /\{allowSkip !== false && isGameOver && !isCompleted && \(/);
  assertEquals(source.includes("Math.max(1, attempts)"), false);
  assertMatch(source, /onComplete\?\.\(score, QUIZ_TARGET\)/);
});
