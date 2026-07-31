import { assertEquals } from "jsr:@std/assert";

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../../../${relativePath}`, import.meta.url));
}

Deno.test("numbers games keep skip buttons in flow instead of overlapping the mobile header", async () => {
  const paths = [
    "src/components/games/6-numbers/CountMatch.tsx",
    "src/components/games/6-numbers/CountMatch2.tsx",
    "src/components/games/6-numbers/CountMatch3.tsx",
    "src/components/games/6-numbers/CountMatch4.tsx",
    "src/components/games/6-numbers/DeepDive.tsx",
    "src/components/games/6-numbers/DragCorrectNumber.tsx",
    "src/components/games/6-numbers/NumberMonster.tsx",
    "src/components/games/6-numbers/ToyFactory.tsx",
  ];

  for (const path of paths) {
    const source = await readSource(path);
    assertEquals(source.includes("absolute top-6 right-6 z-50"), false);
    assertEquals(source.includes("w-full max-w-sm justify-center md:w-auto"), true);
  }
});
