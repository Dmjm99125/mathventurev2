import { assertEquals } from "jsr:@std/assert";

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../../../${relativePath}`, import.meta.url));
}

Deno.test("next-game buttons use mobile-safe header layouts", async () => {
  const absoluteHeaderFiles = [
    "src/components/games/1-colors/BalloonFindingGame.tsx",
    "src/components/games/1-colors/RainbowColorCatcher.tsx",
    "src/components/games/1-colors/RainbowColorDeluxe.tsx",
    "src/components/games/1-colors/RainbowGalaxyExplorer.tsx",
    "src/components/games/2-shapes/ShapeMatchingGame.tsx",
  ];

  for (const path of absoluteHeaderFiles) {
    const source = await readSource(path);
    assertEquals(source.includes("hidden md:flex"), true);
    assertEquals(source.includes("md:hidden"), true);
  }

  const stackedHeaderExpectations = [
    "src/components/games/1-colors/ColorMatchingGame.tsx",
    "src/components/games/2-shapes/FindTheShape.tsx",
    "src/components/games/2-shapes/MonsterCafe.tsx",
    "src/components/games/2-shapes/ShapeHunter.tsx",
    "src/components/games/2-shapes/ShapeMatcher.tsx",
    "src/components/games/3-sequencing/AnimalVehicleBuilder.tsx",
    "src/components/games/3-sequencing/ArrangeLetters.tsx",
    "src/components/games/3-sequencing/ArrangeNumbers.tsx",
    "src/components/games/3-sequencing/PatternTrainAcademy.tsx",
    "src/components/games/3-sequencing/ShortestLongest.tsx",
    "src/components/games/3-sequencing/SizeSorter.tsx",
    "src/components/games/3-sequencing/SmallestLargestCake.tsx",
    "src/components/games/3-sequencing/SurpriseSequencing.tsx",
  ];

  for (const path of stackedHeaderExpectations) {
    const source = await readSource(path);
    assertEquals(source.includes("w-full justify-center md:w-auto"), true);
  }

  const overlayHudFiles = [
    "src/components/games/2-shapes/HungryDragon.tsx",
    "src/components/games/2-shapes/ShapeWizard.tsx",
  ];

  for (const path of overlayHudFiles) {
    const source = await readSource(path);
    assertEquals(source.includes("flex flex-col gap-3 md:flex-row md:justify-between md:items-start"), true);
    assertEquals(source.includes("w-full max-w-sm justify-center md:w-auto"), true);
  }
});
