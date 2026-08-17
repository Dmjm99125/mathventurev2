import { assert, assertEquals } from "jsr:@std/assert";
import { freePlayTopics } from "../../../src/data/freePlay.ts";

const arithmeticPattern = /(?:<br\/>|\s)(\d+)\s*([+-])\s*(\d+)\s*=\s*\?/;

Deno.test("free-play addition and subtraction items stay within 0 through 10", () => {
  for (const topic of ["addition", "subtraction"] as const) {
    for (const question of freePlayTopics[topic]) {
      const match = question.prompt.match(arithmeticPattern);
      assert(match, `${topic} question ${question.id} should contain an arithmetic item`);

      const left = Number(match[1]);
      const operator = match[2];
      const right = Number(match[3]);

      assert(left >= 0 && left <= 10, `${question.id} left operand is ${left}`);
      assert(right >= 0 && right <= 10, `${question.id} right operand is ${right}`);
      if (operator === "+") {
        assertEquals(left + right <= 10, true, `${question.id} sum exceeds 10`);
      }
    }
  }
});
