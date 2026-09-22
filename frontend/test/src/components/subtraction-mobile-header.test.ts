import { assertEquals } from "jsr:@std/assert";

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../../../${relativePath}`, import.meta.url));
}

Deno.test("subtraction games use mobile-safe skip layouts", async () => {
  const headerPaths = [
    "src/components/games/5-subtraction/FarmHideSeek.tsx",
    "src/components/games/5-subtraction/FeedTheHippo.tsx",
    "src/components/games/5-subtraction/FruitSubtraction.tsx",
    "src/components/games/5-subtraction/GentleMathDrift.tsx",
    "src/components/games/5-subtraction/SpaceBlast.tsx",
    "src/components/games/5-subtraction/SubtractionAdventure.tsx",
    "src/components/games/5-subtraction/SubtractionBalloon.tsx",
    "src/components/games/5-subtraction/SubtractionPop.tsx",
  ];

  for (const path of headerPaths) {
    const source = await readSource(path);
    assertEquals(source.includes("flex w-full flex-wrap justify-center gap-4 items-center md:w-auto md:justify-end"), true);
    assertEquals(source.includes("w-full max-w-sm md:w-auto"), true);
  }

  const dinoEggSource = await readSource("src/components/games/5-subtraction/DinoEgg.tsx");
  assertEquals(dinoEggSource.includes("flex w-full flex-wrap items-center justify-between gap-3"), true);
  assertEquals(dinoEggSource.includes("w-full sm:w-auto"), true);
});
