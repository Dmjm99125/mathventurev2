import { assert, assertEquals, assertMatch } from "jsr:@std/assert";

const GAME_FILES = [
  "SubtractionBalloon.tsx",
  "FruitSubtraction.tsx",
  "GentleMathDrift.tsx",
  "SubtractionAdventure.tsx",
  "SubtractionPop.tsx",
  "DinoEgg.tsx",
  "FarmHideSeek.tsx",
  "FeedTheHippo.tsx",
  "SpaceBlast.tsx",
] as const;

const readGameSource = (fileName: string) =>
  Deno.readTextFile(new URL(`../src/components/games/5-subtraction/${fileName}`, import.meta.url));

Deno.test("Quiz-rendered subtraction games expose scored terminal completion", async () => {
  for (const fileName of GAME_FILES) {
    const source = await readGameSource(fileName);

    assertMatch(source, /onComplete\?: \(score\?: number, maxScore\?: number\) => void/);
    assertMatch(source, /const \[attempts, setAttempts\] = useState\(0\)/);
    assertMatch(source, /const newAttempts = attempts \+ 1/);
    assertMatch(source, /setAttempts\(prev => prev \+ 1\)/);
    assertMatch(source, /onComplete\?\.\(newScore, newAttempts\)/);
    assertMatch(source, /onComplete\?\.\(score, MAX_SCORE\)/);
    assertMatch(source, /if \(allowSkip === false\)/);
    assertMatch(source, /newAttempts >= MAX_SCORE/);
    assertMatch(source, /onComplete\?\.\(score, MAX_SCORE\)/);
    assertEquals(source.includes("onComplete?.(score, attempts)"), false, `${fileName} must use the fixed assigned maximum`);
    assertMatch(source, /allowSkip !== false &&/);
    assertEquals(source.includes("onClick={onComplete}"), false, `${fileName} must not pass DOM events to navigation callbacks`);
    assertEquals(source.includes("onClick={() => onComplete?.()}"), true, `${fileName} preserves no-argument navigation callbacks`);
  }
});

Deno.test("subtraction completion keeps strict mode terminal and retry guards", async () => {
  for (const fileName of GAME_FILES) {
    const source = await readGameSource(fileName);

    assertEquals(source.includes("allowSkip !== false"), true, `${fileName} keeps skip visibility strict mode`);
    assertEquals(source.includes("allowSkip === false"), true, `${fileName} keeps strict-mode continuation`);
    assertEquals(source.includes("setAttempts(prev => prev + 1)"), true, `${fileName} increments attempts for active interactions`);
  }
});

Deno.test("assigned subtraction answers consume one fixed quiz item", async () => {
  for (const fileName of GAME_FILES) {
    const source = await readGameSource(fileName);

    assert(source.includes("if (allowSkip === false)"), `${fileName} advances assigned wrong answers`);
    assert(source.includes("onComplete?.(score, MAX_SCORE)"), `${fileName} reports its fixed assigned maximum`);
  }
});

Deno.test("subtraction choice games lock the question after a correct answer", async () => {
  for (const fileName of ["FarmHideSeek.tsx", "FeedTheHippo.tsx", "SpaceBlast.tsx"]) {
    const source = await readGameSource(fileName);

    assertMatch(source, /const \[isAnswerLocked, setIsAnswerLocked\] = useState\(false\)/);
    assertMatch(source, /if \(isAnswerLocked \|\|/);
    assertMatch(source, /setIsAnswerLocked\(true\)/);
    assertMatch(source, /setIsAnswerLocked\(false\)/);
    if (fileName !== "FeedTheHippo.tsx") {
      assertMatch(source, /disabled=\{[^}]*isAnswerLocked/);
    }
  }
});
