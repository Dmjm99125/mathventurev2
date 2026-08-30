import { assertMatch } from "jsr:@std/assert";

const source = await Deno.readTextFile(
  new URL("../src/components/games/7-measurement/SmallShort.tsx", import.meta.url),
);

Deno.test("SmallShort consumes wrong choices as assigned quiz items", () => {
  assertMatch(source, /const isAssignedMode = allowSkip === false/);
  assertMatch(source, /const didCompleteAssignedQuiz = isAssignedMode && newAttempts >= MAX_SCORE/);
  assertMatch(source, /else if \(isAssignedMode\) \{[\s\S]{0,1200}setTrainState\('leaving'\)[\s\S]{0,1200}generateLevel\(\)/);
  assertMatch(source, /else \{[\s\S]{0,300}setMessage\('Oops! Try the other one!/);
});
