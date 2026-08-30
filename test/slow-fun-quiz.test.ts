import { assertMatch } from "jsr:@std/assert";

const source = await Deno.readTextFile(
  new URL("../src/components/games/7-measurement/SlowFun.tsx", import.meta.url),
);

Deno.test("SlowFun consumes wrong assigned mole taps as quiz items", () => {
  assertMatch(source, /const \[answeredItems, setAnsweredItems\] = useState\(0\)/);
  assertMatch(source, /const newAnsweredItems = answeredItems \+ 1/);
  assertMatch(source, /const advanceAssignedRound = \(newAnsweredItems: number, newScore: number\)/);
  assertMatch(source, /if \(allowSkip === false\) \{[\s\S]{0,600}advanceAssignedRound\(newAnsweredItems, score\)/);
});
