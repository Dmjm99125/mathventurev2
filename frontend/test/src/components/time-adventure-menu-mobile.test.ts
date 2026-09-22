import { assertEquals } from "jsr:@std/assert";

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../../../${relativePath}`, import.meta.url));
}

Deno.test("time adventure menu uses a mobile-safe character picker grid", async () => {
  const source = await readSource("src/components/games/9-clock/TimeAdventure.tsx");

  assertEquals(source.includes("grid w-full max-w-md grid-cols-2 gap-3"), true);
  assertEquals(source.includes("md:flex md:w-auto md:max-w-none md:gap-4"), true);
  assertEquals(source.includes("flex h-24 w-full items-center justify-center"), true);
  assertEquals(source.includes("md:h-auto md:w-auto md:p-4 md:text-6xl"), true);
});
