import { assertEquals, assertMatch } from "jsr:@std/assert";

const GAME_FILES = [
  "ShapeMatchingGame.tsx",
  "FindTheShape.tsx",
  "MonsterCafe.tsx",
  "ShapeMatcher.tsx",
  "ShapeHunter.tsx",
  "ShapeRacing.tsx",
  "ShapeWizard.tsx",
  "HungryDragon.tsx",
] as const;

const COMPLETION_SCORES: Record<(typeof GAME_FILES)[number], string> = {
  "ShapeMatchingGame.tsx": "onComplete?.(score, attempts)",
  "FindTheShape.tsx": "onComplete?.(score, attempts)",
  "MonsterCafe.tsx": "onComplete?.(score, attempts)",
  "ShapeMatcher.tsx": "onComplete?.(ITEMS.length, attempts)",
  "ShapeHunter.tsx": "onComplete?.(score, attempts)",
  "ShapeRacing.tsx": "onComplete?.(score, attempts)",
  "ShapeWizard.tsx": "onComplete?.(Math.floor(stars / 10), attempts)",
  "HungryDragon.tsx": "onComplete?.(Math.floor(score / 10), attempts)",
};

async function readGameSource(fileName: string) {
  return await Deno.readTextFile(new URL(`../src/components/games/2-shapes/${fileName}`, import.meta.url));
}

Deno.test("Quiz-rendered shape games expose structured completion callbacks", async () => {
  for (const fileName of GAME_FILES) {
    const source = await readGameSource(fileName);

    assertMatch(source, /onComplete\?: \(score\?: number, maxScore\?: number\) => void/);
    assertMatch(source, /const \[attempts, setAttempts\] = useState\(0\)/);
    assertMatch(source, /setAttempts\(\(currentAttempts\) => currentAttempts \+ 1\)/);
    assertEquals(source.includes(COMPLETION_SCORES[fileName]), true);
  }
});

Deno.test("shape completion callbacks are separate from no-argument skip callbacks", async () => {
  for (const fileName of GAME_FILES) {
    const source = await readGameSource(fileName);

    assertEquals(source.includes("onComplete?.()"), true);
    assertEquals(source.includes(COMPLETION_SCORES[fileName]), true);
  }
});

Deno.test("shape game-over screens can submit scored assigned quizzes", async () => {
  for (const fileName of ["ShapeWizard.tsx", "HungryDragon.tsx"]) {
    const source = await readGameSource(fileName);

    assertMatch(source, /allowSkip === false && onComplete/);
    assertMatch(source, /Math\.max\(1, attempts\)/);
    assertEquals(source.match(/Continue Quiz/g)?.length ?? 0, 2);
  }
});
