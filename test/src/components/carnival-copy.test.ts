import { assertEquals } from "jsr:@std/assert";

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../../../${relativePath}`, import.meta.url));
}

Deno.test("Carnival uses the updated item-counting copy", async () => {
  const source = await readSource("src/components/games/4-addition/Carnival.tsx");

  assertEquals(source.includes("Count all the items together!"), true);
});
