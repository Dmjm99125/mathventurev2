import { assert, assertMatch, assertStringIncludes } from "jsr:@std/assert";

const source = await Deno.readTextFile(
  new URL("../src/components/games/7-measurement/TinyBuilderRuler.tsx", import.meta.url),
);

Deno.test("TinyBuilderRuler consumes wrong assigned guesses as quiz items", () => {
  assertStringIncludes(source, "const [answeredItems, setAnsweredItems] = useState(0);");
  assertMatch(source, /const newAnsweredItems = answeredItems \+ 1/);
  assertMatch(source, /const advanceAssignedRound = \(newAnsweredItems: number, nextScore: number\)/);
  assertMatch(source, /if \(allowSkip === false\)[\s\S]{0,500}advanceAssignedRound\(newAnsweredItems, score\)/);
  assertStringIncludes(source, "setGuessedIncorrectly(prev => [...prev, guess]);");
});

Deno.test("TinyBuilderRuler advances assigned wrong guesses without an 800ms timeout", () => {
  const assignedAdvanceRound = source.match(
    /const advanceAssignedRound = \(newAnsweredItems: number, nextScore: number\) => \{([\s\S]*?)\n  \};/,
  )?.[1];

  assert(assignedAdvanceRound);
  assertStringIncludes(assignedAdvanceRound, "setupRound();");
  assert(!assignedAdvanceRound.includes("setTimeout(setupRound, 800)"));
});

Deno.test("TinyBuilderRuler locks assigned completion controls and reports a fixed maximum", () => {
  assertStringIncludes(source, "const canReplay = allowSkip !== false;");
  assertMatch(source, /onComplete\?\.\(score, MAX_SCORE\)/);
  assertMatch(source, /\{canReplay && \([\s\S]{0,700}Play Again/);
});
