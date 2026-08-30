import { assertEquals, assertMatch } from "jsr:@std/assert";

const source = await Deno.readTextFile(new URL(
  "../src/components/games/7-measurement/LightHeavy.tsx",
  import.meta.url,
));

Deno.test("LightHeavy consumes a wrong assigned answer as one quiz item", () => {
  assertMatch(source, /const \[answeredItems, setAnsweredItems\] = useState\(0\)/);
  assertMatch(source, /const newAnsweredItems = answeredItems \+ 1/);
  assertMatch(source, /setAnsweredItems\(prev => prev \+ 1\)/);
  assertMatch(source, /if \(allowSkip === false(?:\s*&&|\s*\))/);
});

Deno.test("LightHeavy keeps its assigned completion maximum fixed at ten", () => {
  assertMatch(source, /onComplete\?\.\(score, MAX_SCORE\)/);
  assertEquals(source.includes("onComplete?.(score, attempts)"), false);
});
