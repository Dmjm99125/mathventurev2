import { assertEquals } from "jsr:@std/assert";

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../../../${relativePath}`, import.meta.url));
}

Deno.test("shape wizard setup screens keep explicit back buttons inside the flow", async () => {
  const source = await readSource("src/components/games/2-shapes/ShapeWizard.tsx");

  assertEquals(source.includes("onClick={() => setScreen('start')}"), true);
  assertEquals(source.includes("onClick={() => setScreen('char-select')}"), true);
});

Deno.test("shape wizard mobile titles sit below the floating hud", async () => {
  const source = await readSource("src/components/games/2-shapes/ShapeWizard.tsx");

  assertEquals(source.includes("pt-32"), true);
  assertEquals(source.includes("md:pt-24"), true);
});

Deno.test("shape wizard mobile back buttons stack below the next-game button without overlap", async () => {
  const source = await readSource("src/components/games/2-shapes/ShapeWizard.tsx");

  assertEquals(source.includes("mt-16"), true);
  assertEquals(source.includes("md:mt-0"), true);
  assertEquals(source.includes("w-full max-w-md"), true);
  assertEquals(source.includes("justify-start"), true);
});

Deno.test("shape wizard setup screens stay scrollable so the go button remains reachable on mobile", async () => {
  const source = await readSource("src/components/games/2-shapes/ShapeWizard.tsx");

  assertEquals(source.includes("overflow-y-auto"), true);
  assertEquals(source.includes("pb-8"), true);
});

Deno.test("shape wizard game back button sits below the hud on mobile", async () => {
  const source = await readSource("src/components/games/2-shapes/ShapeWizard.tsx");

  assertEquals(source.includes("onClick={() => setScreen('world-map')}"), true);
  assertEquals(source.includes("w-full max-w-sm justify-center md:w-auto"), true);
  assertEquals(source.includes("Back to Map"), true);
});
