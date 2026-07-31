import { assertEquals } from "jsr:@std/assert";

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../../../${relativePath}`, import.meta.url));
}

Deno.test("SubtractionAdventure uses a mobile-safe hero picker menu", async () => {
  const source = await readSource("src/components/games/5-subtraction/SubtractionAdventure.tsx");

  assertEquals(source.includes("className=\"flex w-full flex-wrap justify-center gap-4 md:gap-6 mb-8 md:mb-10\""), true);
  assertEquals(source.includes("text-5xl md:text-7xl p-3 md:p-4"), true);
  assertEquals(source.includes("text-xl md:text-2xl px-8 md:px-12 py-6 md:py-8"), true);
});
