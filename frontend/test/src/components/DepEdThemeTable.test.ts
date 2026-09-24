import { assertEquals } from "jsr:@std/assert";

const source = await Deno.readTextFile(
  new URL("../../../src/components/DepEdThemeTable.tsx", import.meta.url),
);

Deno.test("DepEd theme table is semantic and horizontally scrollable", () => {
  assertEquals(source.includes("<table"), true);
  assertEquals(source.includes("<caption"), true);
  assertEquals(source.includes("<thead"), true);
  assertEquals(source.includes("<tbody"), true);
  assertEquals(source.includes('scope="row"'), true);
  assertEquals(source.includes("overflow-x-auto"), true);
  assertEquals(source.includes("min-w-[42rem]"), true);
});

Deno.test("DepEd theme table has an unavailable-theme fallback", () => {
  assertEquals(source.includes("Theme information unavailable"), true);
});
