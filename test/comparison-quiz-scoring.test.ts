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
    assertMatch(source, /onComplete\?\.\((?:score|matches|newScore), (?:attempts|MAX_SCORE|[^)\n]*attempts)\)/);
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

Deno.test("BarnyardBalance consumes wrong assigned-quiz answers", async () => {
  const source = await readGameSource("BarnyardBalance.tsx");

  assertMatch(source, /const \[answeredItems, setAnsweredItems\] = useState\(0\)/);
  assertMatch(source, /const newAnsweredItems = answeredItems \+ 1/);
  assertMatch(source, /const advanceAssignedRound = \(newAnsweredItems: number\)[\s\S]{0,900}newAnsweredItems >= MAX_SCORE[\s\S]{0,900}setIsCompleted\(true\)/);
  assertMatch(source, /const advanceAssignedRound = \(newAnsweredItems: number\)[\s\S]{0,900}setupRound\(\)/);
});

Deno.test("BarnyardBalance locks assigned replay and reports its fixed maximum", async () => {
  const source = await readGameSource("BarnyardBalance.tsx");

  assertMatch(source, /const canReplay = allowSkip !== false/);
  assertMatch(source, /onComplete\?\.\(score, MAX_SCORE\)/);
  assertMatch(source, /canReplay && \([\s\S]*Play Again/);
  assertMatch(source, /allowSkip === false && onComplete/);
});

Deno.test("BarnyardBalance preserves free-play retry feedback", async () => {
  const source = await readGameSource("BarnyardBalance.tsx");

  assertMatch(source, /if \(advanceAssignedRound\(newAnsweredItems\)\) return;[\s\S]{0,220}setTimeout\(\(\) => setCanClick\(true\), 800\)/);
  assertMatch(source, /if \(allowSkip !== false\) onComplete\?\.\(newScore, newAttempts\)/);
});

Deno.test("Paghahambing1 consumes wrong assigned-quiz answers", async () => {
  const source = await readGameSource("Paghahambing1.tsx");

  assertMatch(source, /const \[answeredItems, setAnsweredItems\] = useState\(0\)/);
  assertMatch(source, /const newAnsweredItems = answeredItems \+ 1/);
  assertMatch(source, /const advanceAssignedRound = \(newAnsweredItems: number\)/);
  assertMatch(source, /newAnsweredItems >= MAX_SCORE[\s\S]{0,700}setIsCompleted\(true\)/);
  assertMatch(source, /else \{[\s\S]{0,250}setupRound\(\)/);
});

Deno.test("Paghahambing1 locks assigned replay and reports its fixed maximum", async () => {
  const source = await readGameSource("Paghahambing1.tsx");

  assertMatch(source, /const canReplay = allowSkip !== false/);
  assertMatch(source, /onComplete\?\.\(score, MAX_SCORE\)/);
  assertMatch(source, /canReplay && \([\s\S]*Maglaro Muli/);
  assertMatch(source, /allowSkip === false && onComplete/);
});

Deno.test("Paghahambing1 preserves free-play retries and completion attempts", async () => {
  const source = await readGameSource("Paghahambing1.tsx");

  assertMatch(source, /if \(advanceAssignedRound\(newAnsweredItems\)\) return;[\s\S]{0,200}setFeedback\("Subukan muli!/);
  assertMatch(source, /if \(newScore >= MAX_SCORE\)[\s\S]{0,500}setTimeout\(setupRound, 1200\)/);
});
