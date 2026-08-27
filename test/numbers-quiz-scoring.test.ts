import { assertEquals, assertMatch } from "jsr:@std/assert";

const GAME_FILES = [
  "CountMatch.tsx",
  "CountMatch2.tsx",
  "CountMatch3.tsx",
  "CountMatch4.tsx",
  "DeepDive.tsx",
  "DragCorrectNumber.tsx",
  "NumberMonster.tsx",
  "NumberReplacementAnimalPop.tsx",
  "NumberReplacementGame.tsx",
  "NumberReplacementHungryMonster.tsx",
  "NumberReplacementWhackMole.tsx",
  "ToyFactory.tsx",
] as const;

const INTERACTIVE_GAME_FILES = [
  "CountMatch.tsx",
  "CountMatch2.tsx",
  "CountMatch3.tsx",
  "CountMatch4.tsx",
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
  for (const fileName of INTERACTIVE_GAME_FILES) {
    const source = await readGameSource(fileName);

    assertEquals(source.includes("const [attempts, setAttempts] = useState(0);"), true, fileName);
    assertEquals(source.includes("setAttempts(prev => prev + 1);"), true, fileName);
    assertMatch(source, /onComplete\?\.\([^,\n]+, [^)\n]+\)/, fileName);
    assertEquals(source.includes("onClick={() => onComplete?.()}"), true, fileName);
  }
});
