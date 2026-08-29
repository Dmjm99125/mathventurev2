import { assertEquals } from "jsr:@std/assert";

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../../../${relativePath}`, import.meta.url));
}

Deno.test("hungry dragon keeps the game back action in the hud action stack", async () => {
  const source = await readSource("src/components/games/2-shapes/HungryDragon.tsx");

  assertEquals(source.includes("screen === 'game' && allowSkip !== false"), true);
  assertEquals(source.includes("onClick={() => setScreen('start')}"), true);
  assertEquals(source.includes("Back to start"), true);
  assertEquals(source.includes("w-full max-w-sm justify-center md:w-auto"), true);
});

Deno.test("hungry dragon game art starts below the taller mobile hud stack", async () => {
  const source = await readSource("src/components/games/2-shapes/HungryDragon.tsx");

  assertEquals(source.includes("mt-24 md:mt-4"), true);
});

Deno.test("hungry dinosaur uses T. rex artwork", async () => {
  const source = await readSource("src/components/games/2-shapes/HungryDragon.tsx");

  assertEquals(source.includes("🦖"), true);
  assertEquals(source.includes("🐲"), false);
});
