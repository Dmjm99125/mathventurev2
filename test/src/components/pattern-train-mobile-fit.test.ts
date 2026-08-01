import { assertEquals } from "jsr:@std/assert";

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../../../${relativePath}`, import.meta.url));
}

Deno.test("PatternTrainAcademy uses mobile-safe train sizing", async () => {
  const source = await readSource("src/components/games/3-sequencing/PatternTrainAcademy.tsx");

  assertEquals(source.includes("className=\"text-4xl sm:text-6xl md:text-7xl"), true);
  assertEquals(source.includes("w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16"), true);
  assertEquals(source.includes("text-2xl sm:text-3xl md:text-4xl"), true);
  assertEquals(source.includes("gap-0.5 sm:gap-1 md:gap-2"), true);
});
