import { assertEquals } from "jsr:@std/assert";

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../../../${relativePath}`, import.meta.url));
}

Deno.test("color and shape setup games expose Back buttons that return to the previous screen", async () => {
  const expectations = [
    {
      path: "src/components/games/1-colors/RainbowColorDeluxe.tsx",
      snippets: ["Back", "onClick={() => setScreen('difficulty')}"],
    },
    {
      path: "src/components/games/1-colors/RainbowGalaxyExplorer.tsx",
      snippets: ["Back", "onClick={() => setScreen('start')}"],
    },
    {
      path: "src/components/games/2-shapes/ShapeWizard.tsx",
      snippets: ["Back", "onClick={() => setScreen('world-map')}"],
    },
    {
      path: "src/components/games/2-shapes/HungryDragon.tsx",
      snippets: ["Back", "onClick={() => setScreen('start')}"],
    },
  ];

  for (const { path, snippets } of expectations) {
    const source = await readSource(path);
    for (const snippet of snippets) {
      assertEquals(source.includes(snippet), true);
    }
  }
});

Deno.test("galaxy explorer keeps the game HUD below the back button on mobile", async () => {
  const source = await readSource("src/components/games/1-colors/RainbowGalaxyExplorer.tsx");

  assertEquals(source.includes("absolute top-20 md:top-4 left-0 w-full px-4 flex justify-between gap-2 z-20"), true);
});

Deno.test("adventure, measurement, and clock setup games expose Back buttons that return to the previous screen", async () => {
  const expectations = [
    {
      path: "src/components/games/4-addition/AdditionAdventure.tsx",
      snippets: ["Back", "onClick={() => setGameState('menu')}"],
    },
    {
      path: "src/components/games/5-subtraction/SubtractionAdventure.tsx",
      snippets: ["Back", "onClick={() => setGameState('menu')}"],
    },
    {
      path: "src/components/games/7-measurement/SlowFun.tsx",
      snippets: ["const resetToStart = () => {", "onClick={resetToStart}"],
    },
    {
      path: "src/components/games/9-clock/TimeAdventure.tsx",
      snippets: ["Back", "onClick={resetGame}"],
    },
  ];

  for (const { path, snippets } of expectations) {
    const source = await readSource(path);
    for (const snippet of snippets) {
      assertEquals(source.includes(snippet), true);
    }
  }
});
