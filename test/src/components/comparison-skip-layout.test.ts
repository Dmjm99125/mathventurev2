import { assertEquals } from "jsr:@std/assert";

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../../../${relativePath}`, import.meta.url));
}

Deno.test("comparison games keep skip buttons in flow instead of overlapping the mobile header", async () => {
  const paths = [
    "src/components/games/8-comparison/AyusinAngLaki.tsx",
    "src/components/games/8-comparison/BarnyardBalance.tsx",
    "src/components/games/8-comparison/CatchFall.tsx",
    "src/components/games/8-comparison/MadScientist.tsx",
    "src/components/games/8-comparison/MaramiKaunti.tsx",
    "src/components/games/8-comparison/MataasMababa.tsx",
    "src/components/games/8-comparison/MatchingTypeA.tsx",
    "src/components/games/8-comparison/Paghahambing1.tsx",
    "src/components/games/8-comparison/SkyExplorer.tsx",
    "src/components/games/8-comparison/WhichIsComp.tsx",
    "src/components/games/8-comparison/WhichIsLonger.tsx",
  ];

  for (const path of paths) {
    const source = await readSource(path);
    assertEquals(source.includes("absolute top-6 right-6 z-50"), false);
    assertEquals(source.includes("w-full max-w-sm justify-center md:w-auto"), true);
  }
});
