import { assertMatch } from "jsr:@std/assert";

const source = await Deno.readTextFile(
  new URL("../src/components/games/8-comparison/MatchingTypeA.tsx", import.meta.url),
);

Deno.test("MatchingTypeA consumes wrong pairs as assigned quiz items", () => {
  assertMatch(source, /const \[answeredItems, setAnsweredItems\] = useState\(0\)/);
  assertMatch(source, /const newAnsweredItems = answeredItems \+ 1/);
  assertMatch(source, /const advanceAssignedAttempt = \(newAnsweredItems: number\)/);
  assertMatch(source, /if \(allowSkip === false\)[\s\S]{0,500}advanceAssignedAttempt\(newAnsweredItems\)/);
  assertMatch(source, /newAnsweredItems >= MAX_SCORE[\s\S]{0,500}setIsCompleted\(true\)/);
});
