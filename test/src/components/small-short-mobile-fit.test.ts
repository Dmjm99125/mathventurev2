import { assertEquals } from "jsr:@std/assert";

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../../../${relativePath}`, import.meta.url));
}

Deno.test("small short scales the train down on mobile so the full train fits inside the track", async () => {
  const source = await readSource("src/components/games/7-measurement/SmallShort.tsx");

  assertEquals(source.includes("text-[3rem] md:text-[4.5rem]"), true);
  assertEquals(source.includes("w-[80px] h-[64px] md:w-[95px] md:h-[70px]"), true);
});
