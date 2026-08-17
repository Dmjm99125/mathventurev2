import { assert } from "jsr:@std/assert";
import {
  getBoundedAdditionOperands,
  getBoundedSubtractionOperands,
} from "../../../../src/lib/games/arithmeticBounds.ts";

Deno.test("bounded addition operands and sums stay within 10", () => {
  for (let i = 0; i < 1000; i++) {
    const [left, right] = getBoundedAdditionOperands();
    assert(left >= 0 && left <= 10);
    assert(right >= 0 && right <= 10);
    assert(left + right <= 10);
  }
});

Deno.test("bounded subtraction operands stay within 10 and do not go negative", () => {
  for (let i = 0; i < 1000; i++) {
    const [left, right] = getBoundedSubtractionOperands();
    assert(left >= 0 && left <= 10);
    assert(right >= 0 && right <= 10);
    assert(left - right >= 0);
  }
});
