import { assertEquals } from "jsr:@std/assert";

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../../../${relativePath}`, import.meta.url));
}

Deno.test("ComicStarCatcher uses mobile-safe fuel tank sizing", async () => {
  const source = await readSource("src/components/games/4-addition/ComicStarCatcher.tsx");

  assertEquals(source.includes("gap-2 sm:gap-3 md:gap-8"), true);
  assertEquals(source.includes("w-[84px] min-h-[144px] sm:w-[116px] sm:min-h-[124px]"), true);
  assertEquals(source.includes("grid grid-cols-2 content-start justify-items-center"), true);
  assertEquals(source.includes("text-lg sm:text-xl"), true);
});
