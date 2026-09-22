import { assertEquals, assertThrows } from "jsr:@std/assert";
import {
  appendAttemptGameResult,
  buildAttemptGameResult,
} from "../../../../src/lib/games/attempt-results.ts";

Deno.test("buildAttemptGameResult uses the stable game catalog id", () => {
  assertEquals(buildAttemptGameResult("colors", 0, 1, 1), {
    topicId: "colors",
    gameId: "colors:0",
    gameOrder: 0,
    score: 1,
    maxScore: 1,
  });

  assertThrows(() => buildAttemptGameResult("clock", 7, 1, 1));
});

Deno.test("appendAttemptGameResult replaces prior rows for the same game id", () => {
  const first = buildAttemptGameResult("colors", 0, 0, 1);
  const second = buildAttemptGameResult("colors", 0, 1, 1);

  assertEquals(appendAttemptGameResult([first], second), [second]);
});
