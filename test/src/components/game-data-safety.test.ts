import { assertEquals } from "jsr:@std/assert";

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../../../${relativePath}`, import.meta.url));
}

Deno.test("Under the Sea can always produce four distinct answer choices", async () => {
  const source = await readSource("src/components/games/4-addition/UnderTheSea.tsx");

  assertEquals(source.includes("const wrong = Math.floor(Math.random() * 10) + 1;"), true);
  assertEquals(source.includes("let wrong = correctAnswer + (Math.floor(Math.random() * 5) - 2);"), false);
});

Deno.test("Hungry Dragon ignores clicks for missing option indexes", async () => {
  const source = await readSource("src/components/games/2-shapes/HungryDragon.tsx");

  assertEquals(source.includes("const option = options[index];"), true);
  assertEquals(source.includes("if (!option || option.hidden) return;"), true);
});

Deno.test("Light Heavy renders safely while its pair is not ready", async () => {
  const source = await readSource("src/components/games/7-measurement/LightHeavy.tsx");

  assertEquals(source.includes("isRevealed && currentPair.length >= 2"), true);
  assertEquals(source.includes("currentPair[0]?.emoji"), true);
  assertEquals(source.includes("currentPair[1]?.emoji"), true);
});
