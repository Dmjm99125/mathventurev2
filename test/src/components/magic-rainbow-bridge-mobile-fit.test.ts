import { assertEquals } from "jsr:@std/assert";

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../../../${relativePath}`, import.meta.url));
}

Deno.test("magic rainbow bridge scales the board and scene down for mobile screens", async () => {
  const source = await readSource("src/components/games/7-measurement/MagicRainbowBridge.tsx");

  assertEquals(source.includes("h-[240px]"), true);
  assertEquals(source.includes("md:h-[300px]"), true);
  assertEquals(source.includes("bottom-[32px] left-[18px] text-[2.5rem]"), true);
  assertEquals(source.includes("md:bottom-[40px] md:left-[25px] md:text-[3.5rem]"), true);
  assertEquals(source.includes("text-[2.25rem]"), true);
  assertEquals(source.includes("md:text-[3rem]"), true);
  assertEquals(source.includes("text-[3rem]"), true);
  assertEquals(source.includes("md:text-[4rem]"), true);
});
