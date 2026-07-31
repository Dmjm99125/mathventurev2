import { assertEquals } from "jsr:@std/assert";

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../../../${relativePath}`, import.meta.url));
}

Deno.test("growing inchworm keeps vertical touch scrolling enabled on the game container", async () => {
  const source = await readSource("src/components/games/7-measurement/SnakeGame.tsx");

  assertEquals(
    source.includes("rounded-[3rem] shadow-sm min-h-[600px] border-4 border-white relative font-display select-none touch-pan-y"),
    true,
  );
  assertEquals(source.includes('className="bg-[#a5d6a7] border-4 border-[#4caf50] rounded-xl touch-none"'), true);
});
