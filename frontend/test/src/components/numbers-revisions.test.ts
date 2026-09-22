import { assertEquals } from "jsr:@std/assert";
import { numbersData } from "../../../src/data/numbers.ts";

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../../../${relativePath}`, import.meta.url));
}

Deno.test("numbers lesson removes the 6-10, 11-15, and 16-20 matching games", async () => {
  const source = await readSource("src/pages/QuizPage.tsx");
  assertEquals(source.includes("<CountMatch2 onComplete={handleStructuredGameComplete} />"), false);
  assertEquals(source.includes("<CountMatch3 onComplete={handleStructuredGameComplete} />"), false);
  assertEquals(source.includes("<CountMatch4 onComplete={handleStructuredGameComplete} />"), false);
  assertEquals(source.includes("<CountMatch onComplete={handleStructuredGameComplete} />"), true);
  assertEquals(source.includes("<NumberReplacementAnimalPop onComplete={handleStructuredGameComplete} />"), true);
  assertEquals(source.includes("<NumberReplacementHungryMonster onComplete={handleStructuredGameComplete} />"), true);
  assertEquals(source.includes("<NumberReplacementWhackMole onComplete={handleStructuredGameComplete} />"), true);
  assertEquals(numbersData.length, 9);
  assertEquals(numbersData.at(-1)?.prompt, "Drawing Board");
});
