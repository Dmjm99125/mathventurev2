import { assert, assertEquals } from "jsr:@std/assert";
import { getBoundedAdditionOperands } from "../../../src/lib/games/arithmeticBounds.ts";

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../../../${relativePath}`, import.meta.url));
}

Deno.test("addition operands use 1 through 5 and never exceed a sum of 10", () => {
  for (let i = 0; i < 1000; i++) {
    const [left, right] = getBoundedAdditionOperands();
    assert(left >= 1 && left <= 5);
    assert(right >= 1 && right <= 5);
    assert(left + right <= 10);
  }
});

Deno.test("addition flow puts four replacement games first and drawing canvas last", async () => {
  const source = await readSource("src/pages/QuizPage.tsx");
  const expected = [
    "<AdditionReplacementOne onComplete={handleStructuredGameComplete} />",
    "<AdditionReplacementTwo onComplete={handleStructuredGameComplete} />",
    "<AdditionReplacementThree onComplete={handleStructuredGameComplete} />",
    "<AdditionReplacementFour onComplete={handleStructuredGameComplete} />",
    "<AdditionFunGame onComplete={handleStructuredGameComplete} />",
    "<AppleAddition onComplete={handleStructuredGameComplete} />",
    "<FruitPopMath onComplete={handleStructuredGameComplete} />",
    "<AdditionAdventure onComplete={handleStructuredGameComplete} />",
    "<SecondAdditionRound onComplete={handleStructuredGameComplete} />",
    "<AnimalSafari onComplete={handleStructuredGameComplete} />",
    "<UnderTheSea onComplete={handleStructuredGameComplete} />",
    "<Carnival onComplete={handleStructuredGameComplete} />",
    "<IceCreamShop onComplete={handleStructuredGameComplete} />",
    "<Pizza onComplete={handleStructuredGameComplete} />",
    "<ComicStarCatcher onComplete={handleStructuredGameComplete} />",
    "<DrawingCanvas onComplete={handleNext} />",
  ];

  let previous = -1;
  for (const snippet of expected) {
    const current = source.indexOf(snippet);
    assert(current > previous, `Expected ${snippet} after the previous addition game`);
    previous = current;
  }
  assertEquals(source.includes("topic === 'addition' && currentIndex === 0"), true);
});

Deno.test("replacement addition games expose the Skip Game action", async () => {
  const source = await readSource("src/components/games/4-addition/AdditionReplacementGame.tsx");
  assertEquals(source.includes("Skip Game"), true);
  assertEquals(source.includes("onClick={onComplete}"), true);
});
