import { assertEquals } from "jsr:@std/assert";

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../../../${relativePath}`, import.meta.url));
}

Deno.test("FruitPopMath uses a mobile-safe equation layout", async () => {
  const source = await readSource("src/components/games/4-addition/FruitPopMath.tsx");

  assertEquals(
    source.includes("flex w-full max-w-md flex-wrap items-center justify-center gap-3"),
    true,
  );
  assertEquals(source.includes("text-3xl md:text-6xl"), true);
  assertEquals(
    source.includes("w-24 h-16 text-center text-3xl md:w-28 md:h-20 md:text-5xl"),
    true,
  );
});
