import { assertEquals, assertMatch } from "jsr:@std/assert";

const clockGames = [
  "src/components/games/9-clock/TimeAdventure.tsx",
  "src/components/games/9-clock/TimeMatcher.tsx",
  "src/components/games/9-clock/DragMatchingClock.tsx",
  "src/components/games/9-clock/FillMissingTime.tsx",
  "src/components/games/9-clock/DailyRoutineTime.tsx",
  "src/components/games/9-clock/BuildClock.tsx",
  "src/components/games/9-clock/ClockMultiple.tsx",
];

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../${relativePath}`, import.meta.url));
}

Deno.test("clock quiz games expose scored completion callbacks", async () => {
  for (const path of clockGames) {
    const source = await readSource(path);

    assertMatch(source, /onComplete\?: \(score\?: number, maxScore\?: number\) => void/);
    assertEquals(source.includes("allowSkip?: boolean;"), true, path);
    assertEquals(source.includes("onClick={onComplete}"), false, path);
    assertMatch(source, /onComplete\?\.\([^,\n]+, [^)\n]+\)/, path);
    assertEquals(source.includes("onClick={() => onComplete?.()}"), true, path);
  }
});

Deno.test("clock quiz games count active wrong choices and drags", async () => {
  for (const path of clockGames) {
    const source = await readSource(path);

    assertMatch(source, /const \[attempts, setAttempts\] = useState\(0\)/, path);
    assertMatch(source, /setAttempts\(prev => prev \+ 1\)/, path);
  }
});

Deno.test("clock quiz games report actual score and attempts at strict completion", async () => {
  for (const path of clockGames) {
    const source = await readSource(path);

    assertMatch(source, /onComplete\?\.\((?:score, attempts|score, MAX_SCORE)\)/, path);
    assertMatch(source, /onComplete\?\.\([^,\n]+, newAttempts\)/, path);
  }
});

Deno.test("time adventure hides its active-game back control in assigned quizzes", async () => {
  const source = await readSource("src/components/games/9-clock/TimeAdventure.tsx");

  assertMatch(source, /allowSkip !== false[\s\S]{0,300}onClick=\{resetGame\}/);
});

Deno.test("TimeAdventure consumes wrong answers as assigned quiz items", async () => {
  const source = await readSource("src/components/games/9-clock/TimeAdventure.tsx");

  assertMatch(source, /const \[answeredItems, setAnsweredItems\] = useState\(0\)/);
  assertMatch(source, /const newAnsweredItems = answeredItems \+ 1/);
  assertMatch(source, /allowSkip === false[\s\S]{0,500}newAnsweredItems >= MAX_SCORE[\s\S]{0,500}setIsCompleted\(true\)/);
  assertMatch(source, /allowSkip === false[\s\S]{0,500}setupRound\(score\)/);
});

Deno.test("TimeAdventure locks assigned replay and reports the fixed maximum", async () => {
  const source = await readSource("src/components/games/9-clock/TimeAdventure.tsx");

  assertMatch(source, /const canReplay = allowSkip !== false/);
  assertMatch(source, /onComplete\?\.\(score, MAX_SCORE\)/);
  assertMatch(source, /canReplay && \([\s\S]*Play Again/);
});

Deno.test("TimeMatcher consumes wrong answers as assigned quiz items", async () => {
  const source = await readSource("src/components/games/9-clock/TimeMatcher.tsx");

  assertMatch(source, /const \[answeredItems, setAnsweredItems\] = useState\(0\)/);
  assertMatch(source, /const newAnsweredItems = answeredItems \+ 1/);
  assertMatch(source, /allowSkip === false[\s\S]{0,500}newAnsweredItems >= MAX_SCORE[\s\S]{0,500}setIsCompleted\(true\)/);
  assertMatch(source, /allowSkip === false[\s\S]{0,500}setupRound\(\)/);
});

Deno.test("TimeMatcher locks assigned replay and reports the fixed maximum", async () => {
  const source = await readSource("src/components/games/9-clock/TimeMatcher.tsx");

  assertMatch(source, /const canReplay = allowSkip !== false/);
  assertMatch(source, /onComplete\?\.\(score, MAX_SCORE\)/);
  assertMatch(source, /canReplay && \([\s\S]*Play Again/);
});

Deno.test("FillMissingTime consumes wrong taps and drops as assigned quiz items", async () => {
  const source = await readSource("src/components/games/9-clock/FillMissingTime.tsx");

  assertMatch(source, /const \[answeredItems, setAnsweredItems\] = useState\(0\)/);
  assertMatch(source, /const newAnsweredItems = answeredItems \+ 1/);
  assertMatch(source, /allowSkip === false[\s\S]{0,700}newAnsweredItems >= MAX_SCORE[\s\S]{0,700}setIsCompleted\(true\)/);
  assertMatch(source, /allowSkip === false[\s\S]{0,700}setupRound\(\)/);
});
