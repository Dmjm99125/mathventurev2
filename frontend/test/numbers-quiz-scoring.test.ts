import { assert, assertEquals, assertMatch } from "jsr:@std/assert";

const GAME_FILES = [
  "CountMatch.tsx",
  "DeepDive.tsx",
  "DragCorrectNumber.tsx",
  "NumberMonster.tsx",
  "NumberReplacementAnimalPop.tsx",
  "NumberReplacementGame.tsx",
  "NumberReplacementHungryMonster.tsx",
  "NumberReplacementWhackMole.tsx",
  "ToyFactory.tsx",
] as const;

const RAW_SCORE_GAME_FILES = [
  "CountMatch.tsx",
  "DeepDive.tsx",
  "DragCorrectNumber.tsx",
  "NumberMonster.tsx",
  "ToyFactory.tsx",
] as const;

const FIXED_ROUND_GAME_FILES = [
  "NumberReplacementGame.tsx",
] as const;

const INTERACTIVE_GAME_FILES = [
  ...RAW_SCORE_GAME_FILES,
  ...FIXED_ROUND_GAME_FILES,
] as const;

const REPLAYABLE_GAME_FILES = [
  "CountMatch.tsx",
  "DeepDive.tsx",
  "DragCorrectNumber.tsx",
  "NumberMonster.tsx",
  "NumberReplacementGame.tsx",
  "ToyFactory.tsx",
] as const;

const readGameSource = (fileName: string) =>
  Deno.readTextFile(new URL(`../src/components/games/6-numbers/${fileName}`, import.meta.url));

Deno.test("all numbers games expose scored completion callbacks", async () => {
  for (const fileName of GAME_FILES) {
    const source = await readGameSource(fileName);

    assertMatch(source, /onComplete\?: \(score\?: number, maxScore\?: number\) => void/);
    assertEquals(
      source.includes("onClick={onComplete}"),
      false,
      `${fileName} must not pass DOM events to completion callbacks`,
    );
  }
});

Deno.test("numbers quiz games count active wrong interactions in terminal attempts", async () => {
  for (const fileName of RAW_SCORE_GAME_FILES) {
    const source = await readGameSource(fileName);

    assertEquals(source.includes("const [attempts, setAttempts] = useState(0);"), true, fileName);
    assertEquals(source.includes("setAttempts(prev => prev + 1);"), true, fileName);
    assertEquals(source.includes("allowSkip === false"), true, fileName);
    assertMatch(source, fileName === "CountMatch.tsx" ? /newAttempts >= NUMBERS\.length/ : /newAttempts >= MAX_SCORE/, fileName);
    assertMatch(source, /onComplete\?\.\(score, MAX_SCORE\)/, fileName);
    assertEquals(source.includes("onComplete?.(score, attempts)"), false, `${fileName} must use the fixed quiz maximum`);
    assertEquals(source.includes("onClick={() => onComplete?.()}"), true, fileName);
  }
});

Deno.test("numbers replacement games already use fixed rounds", async () => {
  for (const fileName of FIXED_ROUND_GAME_FILES) {
    const source = await readGameSource(fileName);

    assertMatch(source, /newAttempts = attempts \+ 1/);
    assertMatch(source, /round \+ 1 >= maxRounds/);
    assertMatch(source, /onComplete\?\.\(score, maxRounds\)/);
    assertMatch(source, /onComplete\?\.\(newScore, maxRounds\)/);
    assertMatch(source, /allowSkip !== false &&/);
  }
});

Deno.test("numbers choice games lock a question after its first answer", async () => {
  for (const fileName of ["DeepDive.tsx", "NumberMonster.tsx", "ToyFactory.tsx"]) {
    const source = await readGameSource(fileName);

    assertMatch(source, /const \[isAnswerLocked, setIsAnswerLocked\] = useState\(false\)/, fileName);
    assertMatch(source, /if \(isAnswerLocked \|\|/, fileName);
    assertMatch(source, /setIsAnswerLocked\(true\)/, fileName);
    assertMatch(source, /setIsAnswerLocked\(false\)/, fileName);
  }
});

Deno.test("CountMatch preserves retries in free play", async () => {
  const source = await readGameSource("CountMatch.tsx");

  assertMatch(source, /allowSkip === false && answeredNumbers\.includes\(num\)/);
  assertMatch(source, /if \(allowSkip === false\) \{\s*setAnsweredNumbers/);
});

Deno.test("assigned numbers games cannot replay after reaching their terminal state", async () => {
  for (const fileName of REPLAYABLE_GAME_FILES) {
    const source = await readGameSource(fileName);

    assertMatch(
      source,
      /allowSkip !== false &&[\s\S]{0,250}onClick=\{resetGame\}/,
      `${fileName} must make replay free-play-only`,
    );
  }
});

Deno.test("assigned numbers answers consume fixed quiz items instead of attempts", async () => {
  for (const fileName of INTERACTIVE_GAME_FILES) {
    const source = await readGameSource(fileName);

    assert(source.includes("if (allowSkip === false)"), `${fileName} advances assigned wrong answers`);
    assertMatch(source, /onComplete\?\.\(score, (?:MAX_SCORE|maxRounds)\)/, `${fileName} reports a fixed assigned maximum`);
  }
});
