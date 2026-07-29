import { assertEquals } from "jsr:@std/assert";

Deno.test("natural grouped lesson media avoids horizontal scrolling and lets images shrink", async () => {
  const source = await Deno.readTextFile(new URL("./LessonSlideCard.tsx", import.meta.url));

  assertEquals(source.includes("overflow-x-auto"), false);
  assertEquals(source.includes("shrink-0"), false);
  assertEquals(source.includes("overflow-hidden"), true);
  assertEquals(source.includes("shrink object-contain"), true);
});
