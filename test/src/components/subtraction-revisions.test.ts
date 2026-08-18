import { assertEquals } from "jsr:@std/assert";

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../../../${relativePath}`, import.meta.url));
}

Deno.test("subtraction lesson keeps all ten game slots while example replacements remain pending", async () => {
  const source = await readSource("src/pages/QuizPage.tsx");
  for (const kept of ["SubtractionBalloon", "FruitSubtraction", "GentleMathDrift", "SubtractionAdventure", "SubtractionPop", "DinoEgg", "FarmHideSeek", "FeedTheHippo", "SpaceBlast"]) {
    assertEquals(source.includes(`<${kept} onComplete={handleStructuredGameComplete} />`), true);
  }
  assertEquals(source.includes("topic === 'subtraction' && currentIndex === 9"), true);
});
