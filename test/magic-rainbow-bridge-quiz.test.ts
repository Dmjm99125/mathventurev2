import { assertEquals, assertMatch } from "jsr:@std/assert";

const source = await Deno.readTextFile(new URL(
  "../src/components/games/7-measurement/MagicRainbowBridge.tsx",
  import.meta.url,
));

Deno.test("MagicRainbowBridge consumes every assigned release as one quiz item", () => {
  assertMatch(source, /const \[answeredItems, setAnsweredItems\] = useState\(0\)/);
  assertMatch(source, /const nextAnsweredItems = answeredItems \+ 1/);
  assertMatch(source, /setAnsweredItems\(prev => prev \+ 1\)/);
  assertMatch(source, /testMeasurement\(nextAttempts, nextAnsweredItems\)/);
});

Deno.test("MagicRainbowBridge reports a fixed assigned maximum and hides replay", () => {
  assertMatch(source, /const ASSIGNED_ITEM_COUNT = 10/);
  assertMatch(source, /onComplete\?\.\(score, ASSIGNED_ITEM_COUNT\)/);
  assertMatch(source, /allowSkip !== false && \(/);
});

Deno.test("MagicRainbowBridge keeps its skip control in mobile layout flow", () => {
  assertEquals(source.includes("absolute top-6 right-6 z-50"), false);
  assertMatch(source, /w-full max-w-sm justify-center md:w-auto/);
});
