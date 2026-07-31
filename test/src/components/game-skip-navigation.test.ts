import { assertEquals } from "jsr:@std/assert";

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../../../${relativePath}`, import.meta.url));
}

Deno.test("addition and subtraction games keep their skip buttons visible on mobile", async () => {
  const expectations = [
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
    "src/components/games/5-subtraction/FarmHideSeek.tsx",
    "src/components/games/5-subtraction/FeedTheHippo.tsx",
    "src/components/games/5-subtraction/FruitSubtraction.tsx",
    "src/components/games/5-subtraction/GentleMathDrift.tsx",
    "src/components/games/5-subtraction/SpaceBlast.tsx",
    "src/components/games/5-subtraction/SubtractionAdventure.tsx",
    "src/components/games/5-subtraction/SubtractionBalloon.tsx",
    "src/components/games/5-subtraction/SubtractionPop.tsx",
  ];

  for (const path of expectations) {
    const source = await readSource(path);
    assertEquals(source.includes("onClick={onComplete}"), true);
    assertEquals(source.includes("hidden md:flex"), false);
  }
});
