import { assertEquals } from "jsr:@std/assert";

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../../../${relativePath}`, import.meta.url));
}

Deno.test("measurement games keep skip buttons in flow instead of overlapping the mobile header", async () => {
  const paths = [
    "src/components/games/7-measurement/LightHeavy.tsx",
    "src/components/games/7-measurement/MagicRainbowBridge.tsx",
    "src/components/games/7-measurement/SlowFun.tsx",
    "src/components/games/7-measurement/SmallShort.tsx",
    "src/components/games/7-measurement/SnakeGame.tsx",
    "src/components/games/7-measurement/TinyBuilderRuler.tsx",
  ];

  for (const path of paths) {
    const source = await readSource(path);
    assertEquals(source.includes("absolute top-6 right-6 z-50"), false);
    assertEquals(source.includes("w-full max-w-sm justify-center md:w-auto"), true);
  }
});
