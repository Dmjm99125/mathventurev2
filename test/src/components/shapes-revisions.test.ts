import { assertEquals } from "jsr:@std/assert";

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../../../${relativePath}`, import.meta.url));
}

Deno.test("shape matcher uses the revised object mappings", async () => {
  const source = await readSource("src/components/games/2-shapes/ShapeMatcher.tsx");
  for (const snippet of ['{ id: "window", emoji: "🪟", match: "cube" }', '{ id: "candy", emoji: "🍬", match: "cylinder" }', '{ id: "ball", emoji: "🏀", match: "sphere" }', '{ id: "pizza", emoji: "🍕", match: "cone" }']) {
    assertEquals(source.includes(snippet), true);
  }
  assertEquals(source.includes('id: "dice"'), false);
  assertEquals(source.includes('id: "drum"'), false);
});

Deno.test("shape lesson and games exclude star, heart, and diamond choices", async () => {
  const lesson = await readSource("src/data/lessonContent.ts");
  const hunter = await readSource("src/components/games/2-shapes/ShapeHunter.tsx");
  const racing = await readSource("src/components/games/2-shapes/ShapeRacing.tsx");
  assertEquals(lesson.includes("s-diamond"), false);
  assertEquals(lesson.includes("s-heart"), false);
  assertEquals(lesson.includes("s-star"), false);
  assertEquals(hunter.includes('"Star"'), false);
  assertEquals(racing.includes('"Star"'), false);
});

Deno.test("shape matching never renders an undefined option", async () => {
  const source = await readSource("src/components/games/2-shapes/ShapeMatchingGame.tsx");

  assertEquals(source.includes("const newOptions = [target, others[0], others[1], others[2]]"), false);
  assertEquals(source.includes("const newOptions = [target, ...others]"), true);
});

Deno.test("Hungry Dragon is presented as a dinosaur", async () => {
  const source = await readSource("src/components/games/2-shapes/HungryDragon.tsx");
  assertEquals(source.includes("Hungry Dinosaur"), true);
  assertEquals(source.includes("The Dinosaur"), true);
  assertEquals(source.includes("The Dragon"), false);
});
