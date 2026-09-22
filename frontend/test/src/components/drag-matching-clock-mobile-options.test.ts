import { assertEquals } from "jsr:@std/assert";

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../../../${relativePath}`, import.meta.url));
}

Deno.test("drag matching clock wraps and scales answer clocks for mobile screens", async () => {
  const source = await readSource("src/components/games/9-clock/DragMatchingClock.tsx");

  assertEquals(source.includes("flex flex-wrap justify-center gap-3 md:gap-6"), true);
  assertEquals(source.includes("min-h-[220px] md:h-32"), true);
  assertEquals(source.includes("h-[92px] w-[92px] md:h-[120px] md:w-[120px]"), true);
});
