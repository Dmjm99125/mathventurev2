import { assertEquals } from "jsr:@std/assert";

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../../../${relativePath}`, import.meta.url));
}

Deno.test("addition games use mobile-safe header action layouts", async () => {
  const paths = [
    "src/components/games/4-addition/AdditionAdventure.tsx",
    "src/components/games/4-addition/AdditionFunGame.tsx",
    "src/components/games/4-addition/AnimalSafari.tsx",
    "src/components/games/4-addition/AppleAddition.tsx",
    "src/components/games/4-addition/Carnival.tsx",
    "src/components/games/4-addition/ComicStarCatcher.tsx",
    "src/components/games/4-addition/FruitPopMath.tsx",
    "src/components/games/4-addition/IceCreamShop.tsx",
    "src/components/games/4-addition/Pizza.tsx",
    "src/components/games/4-addition/SecondAdditionRound.tsx",
    "src/components/games/4-addition/UnderTheSea.tsx",
  ];

  for (const path of paths) {
    const source = await readSource(path);
    assertEquals(source.includes("w-full max-w-sm md:w-auto"), true);
    assertEquals(source.includes("flex-wrap justify-center"), true);
  }
});
