import { assertEquals } from "jsr:@std/assert";

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../../../${relativePath}`, import.meta.url));
}

Deno.test("Pizza uses mobile-safe counting layout", async () => {
  const source = await readSource("src/components/games/4-addition/Pizza.tsx");

  assertEquals(source.includes("min-h-[240px] md:min-h-[260px]"), true);
  assertEquals(source.includes("w-[220px] h-[220px] md:w-[240px] md:h-[240px]"), true);
  assertEquals(source.includes("gap-1 sm:gap-2 p-1.5 sm:p-2"), true);
  assertEquals(source.includes("text-2xl sm:text-3xl"), true);
});
