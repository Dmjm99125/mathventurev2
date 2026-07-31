import { assertEquals } from "jsr:@std/assert";

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../../../${relativePath}`, import.meta.url));
}

Deno.test("sky explorer stacks and wraps the daytime prompt safely on mobile", async () => {
  const source = await readSource("src/components/games/8-comparison/SkyExplorer.tsx");

  assertEquals(source.includes("flex flex-wrap items-center justify-center gap-2"), true);
  assertEquals(source.includes("text-2xl"), true);
  assertEquals(source.includes("md:text-4xl"), true);
  assertEquals(source.includes("w-full max-w-[240px]"), true);
  assertEquals(source.includes("text-center break-words"), true);
});
