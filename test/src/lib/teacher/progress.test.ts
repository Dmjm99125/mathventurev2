import { assertEquals } from "jsr:@std/assert";
import {
  calculateDetailedCompletionPct,
  calculateDetailedLastPlayedPct,
  isPassingPct,
} from "../../../../src/lib/teacher/progress.ts";

Deno.test("calculateDetailedCompletionPct counts only unique passed games", () => {
  assertEquals(
    calculateDetailedCompletionPct(
      [
        { gameId: "colors:0", score: 1, maxScore: 1 },
        { gameId: "colors:0", score: 0, maxScore: 1 },
        { gameId: "colors:1", score: 3, maxScore: 4 },
        { gameId: "colors:2", score: 2, maxScore: 4 },
      ],
      4,
    ),
    50,
  );
});

Deno.test("calculateDetailedLastPlayedPct uses the newest detailed game result", () => {
  assertEquals(isPassingPct(3, 4), true);
  assertEquals(isPassingPct(2, 4), false);
  assertEquals(
    calculateDetailedLastPlayedPct([
      { completedAt: "2026-07-27T08:00:00.000Z", score: 1, maxScore: 1 },
      { completedAt: "2026-07-28T09:00:00.000Z", score: 3, maxScore: 4 },
    ]),
    75,
  );
  assertEquals(calculateDetailedLastPlayedPct([]), null);
});
