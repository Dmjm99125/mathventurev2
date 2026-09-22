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
  assertMatch(source, /const ASSIGNED_ITEM_COUNT = 10/);
  assertMatch(source, /newAnsweredItems >= ASSIGNED_ITEM_COUNT/);
  assertMatch(source, /onComplete\?\.\(score, ASSIGNED_ITEM_COUNT\)/);
  assertEquals(source.includes("onComplete?.(score, attempts)"), false);
});

Deno.test("LightHeavy resets quiz item state without changing free-play replay", () => {
  assertMatch(source, /setAnsweredItems\(0\)/);
  assertMatch(source, /allowSkip !== false && \(/);
  assertMatch(source, /onComplete\?\.\(newScore, newAttempts\)/);
});
