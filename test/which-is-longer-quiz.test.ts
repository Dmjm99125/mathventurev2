import { assertMatch } from "jsr:@std/assert";

const source = await Deno.readTextFile(
  new URL("../src/components/games/8-comparison/WhichIsLonger.tsx", import.meta.url),
);

Deno.test("WhichIsLonger consumes wrong choices as assigned quiz items", () => {
  assertMatch(source, /const \[answeredItems, setAnsweredItems\] = useState\(0\)/);
  assertMatch(source, /const newAnsweredItems = answeredItems \+ 1/);
  assertMatch(source, /const advanceAssignedRound = \(newAnsweredItems: number\)/);
  assertMatch(source, /if \(allowSkip === false\)[\s\S]{0,500}advanceAssignedRound\(newAnsweredItems\)/);
  assertMatch(source, /newAnsweredItems >= MAX_SCORE[\s\S]{0,500}setIsCompleted\(true\)/);
});
