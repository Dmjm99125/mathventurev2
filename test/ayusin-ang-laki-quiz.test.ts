import { assertMatch, assertStringIncludes } from "jsr:@std/assert";

const source = await Deno.readTextFile(new URL(
  "../src/components/games/8-comparison/AyusinAngLaki.tsx",
  import.meta.url,
));

Deno.test("AyusinAngLaki consumes every assigned arrangement", () => {
  assertStringIncludes(source, "const [answeredItems, setAnsweredItems] = useState(0);");
  assertMatch(source, /const newAnsweredItems = answeredItems \+ 1/);
  assertMatch(source, /if \(allowSkip === false\)[\s\S]{0,1200}newAnsweredItems >= MAX_SCORE/);
  assertMatch(source, /newAnsweredItems >= MAX_SCORE[\s\S]{0,600}setIsCompleted\(true\)/);
  assertMatch(source, /else \{[\s\S]{0,600}setupRound\(\)/);
});

Deno.test("AyusinAngLaki locks assigned completion controls", () => {
  assertStringIncludes(source, "const canReplay = allowSkip !== false;");
  assertMatch(source, /onComplete\?\.\(score, MAX_SCORE \* 3\)/);
  assertMatch(source, /\{canReplay && \([\s\S]{0,700}Maglaro Muli/);
});
