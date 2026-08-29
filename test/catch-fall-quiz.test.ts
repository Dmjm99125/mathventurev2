import { assertMatch, assertStringIncludes } from "jsr:@std/assert";

const source = await Deno.readTextFile(new URL(
  "../src/components/games/8-comparison/CatchFall.tsx",
  import.meta.url,
));

Deno.test("CatchFall consumes wrong assigned catches", () => {
  assertStringIncludes(source, "const [answeredItems, setAnsweredItems] = useState(0);");
  assertMatch(source, /const newAnsweredItems = answeredItems \+ 1/);
  assertMatch(source, /const advanceAssignedRound = \(newAnsweredItems: number\)[\s\S]{0,600}newAnsweredItems >= MAX_SCORE/);
  assertMatch(source, /newAnsweredItems >= MAX_SCORE[\s\S]{0,600}setIsCompleted\(true\)/);
  assertMatch(source, /else if \(newAnsweredItems < MAX_SCORE\)[\s\S]{0,300}spawnNextItem\(\)/);
});
