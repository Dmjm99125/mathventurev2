import { assertEquals, assertMatch } from "jsr:@std/assert";

const GAME_FILES = [
  "Paghahambing1.tsx",
  "AyusinAngLaki.tsx",
  "MaramiKaunti.tsx",
  "MataasMababa.tsx",
  "MatchingTypeA.tsx",
  "BarnyardBalance.tsx",
  "SkyExplorer.tsx",
  "MadScientist.tsx",
  "WhichIsLonger.tsx",
  "WhichIsComp.tsx",
  "CatchFall.tsx",
] as const;

async function readGameSource(fileName: string) {
  return await Deno.readTextFile(new URL(`../src/components/games/8-comparison/${fileName}`, import.meta.url));
}

Deno.test("Quiz-rendered comparison games expose scored completion callbacks", async () => {
  for (const fileName of GAME_FILES) {
    const source = await readGameSource(fileName);

    assertMatch(source, /onComplete\?: \(score\?: number, maxScore\?: number\) => void/);
    assertMatch(source, /const \[attempts, setAttempts\] = useState\(0\)/);
    assertMatch(source, /setAttempts\(prev => prev \+ 1\)/);
    assertMatch(source, /onComplete\?\.\((?:score|matches), (?:attempts|[^)\n]*attempts)\)/);
  }
});

Deno.test("comparison completion callbacks are separate from no-argument skips", async () => {
  for (const fileName of GAME_FILES) {
    const source = await readGameSource(fileName);

    assertEquals(source.includes("onClick={onComplete}"), false, fileName);
    assertEquals(source.includes("onClick={() => onComplete?.() }"), false, fileName);
    assertMatch(source, /onClick=\{\(\) => onComplete\?\.\(\)\}/);
  }
});

Deno.test("arrange-in-order quiz scores each size position independently", async () => {
  const source = await readGameSource("AyusinAngLaki.tsx");

  assertEquals(source.includes("scoreByPosition"), true);
  assertEquals(source.includes("if (allowSkip === false)"), true);
  assertEquals(source.includes("MAX_SCORE * 3"), true);
});
