import { assertEquals } from "jsr:@std/assert";

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../../../${relativePath}`, import.meta.url));
}

Deno.test("game layout keeps the content area scrollable on mobile", async () => {
  const source = await readSource("src/components/GameLayout.tsx");

  assertEquals(source.includes("flex-1 min-h-0 relative overflow-hidden"), true);
  assertEquals(source.includes("relative z-10 h-full overflow-y-auto"), true);
});

Deno.test("rainbow color deluxe uses a mobile-safe game card instead of a fixed viewport trap", async () => {
  const source = await readSource("src/components/games/1-colors/RainbowColorDeluxe.tsx");

  assertEquals(source.includes("mx-auto h-[700px]"), false);
  assertEquals(source.includes("min-h-[700px]"), true);
  assertEquals(source.includes("w-full max-w-4xl mx-auto"), true);
});

Deno.test("shape matching wraps long prompts instead of clipping them", async () => {
  const source = await readSource("src/components/games/2-shapes/ShapeMatchingGame.tsx");

  assertEquals(source.includes("break-words"), true);
  assertEquals(source.includes("px-4"), true);
  assertEquals(source.includes("sm:px-6"), true);
  assertEquals(source.includes("leading-tight"), true);
});
