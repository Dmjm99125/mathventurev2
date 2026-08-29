import { assertEquals } from "jsr:@std/assert";
import { scoreByPosition } from "../src/lib/games/sequence-scoring.ts";

const GAME_FILES = [
  "AnimalVehicleBuilder.tsx",
  "ArrangeLetters.tsx",
  "ArrangeNumbers.tsx",
  "PatternTrainAcademy.tsx",
  "SandwichMaker.tsx",
  "ShortestLongest.tsx",
  "SizeSorter.tsx",
  "SmallestLargestCake.tsx",
  "SurpriseSequencing.tsx",
];

const readGameSource = (fileName: string) =>
  Deno.readTextFile(new URL(`../src/components/games/3-sequencing/${fileName}`, import.meta.url));

Deno.test("sequencing quiz games report correct items and wrong attempts", async () => {
  for (const fileName of GAME_FILES) {
    const source = await readGameSource(fileName);

    assertEquals(
      source.includes("onComplete?: (score?: number, maxScore?: number) => void"),
      true,
      `${fileName} should accept scored completion callbacks`,
    );
    assertEquals(
      source.includes("allowSkip = false"),
      true,
      `${fileName} should fail closed and require explicit opt-in for skipping`,
    );
    assertEquals(
      source.includes("const [correctItems, setCorrectItems] = useState(0);"),
      true,
      `${fileName} should track correct items independently of its display score`,
    );
    assertEquals(
      source.includes("const [wrongAttempts, setWrongAttempts] = useState(0);"),
      true,
      `${fileName} should track wrong interactions`,
    );
    assertEquals(
      source.includes("setCorrectItems(prev => prev + 1);"),
      true,
      `${fileName} should count each accepted item`,
    );
    assertEquals(
      source.includes("setWrongAttempts(prev => prev + 1);"),
      true,
      `${fileName} should count each wrong interaction`,
    );
    assertEquals(
      source.includes("scoreByPosition"),
      true,
      `${fileName} should use position-based scoring in quiz mode`,
    );
    assertEquals(
      source.includes("if (allowSkip === false)"),
      true,
      `${fileName} should keep positional scoring limited to quiz mode`,
    );
    assertEquals(
      source.includes("onComplete?.(correctItems + 1, correctItems + wrongAttempts + 1);"),
      true,
      `${fileName} should report the terminal interaction with wrong attempts included`,
    );
    assertEquals(
      source.includes("onComplete?.(correctItems, correctItems + wrongAttempts)"),
      true,
      `${fileName} should report its completed quiz score when the assigned-quiz Continue action is used`,
    );
    assertEquals(
      source.includes("onClick={onComplete}"),
      false,
      `${fileName} should invoke skip/navigation callbacks without DOM event arguments`,
    );
    assertEquals(
      source.includes("onClick={() => onComplete?.()}"),
      true,
      `${fileName} should preserve no-argument skip/navigation callbacks`,
    );
  }
});

Deno.test("sequencing quiz scores each placed item by its final position", () => {
  assertEquals(scoreByPosition([2, 3, 1, 4], [1, 2, 3, 4]), 1);
  assertEquals(scoreByPosition(["bread", "ham", "bread"], ["bread", "ham", "bread"]), 3);
});

Deno.test("pattern train quiz records a wrong choice as a wrong missing position", async () => {
  const source = await readGameSource("PatternTrainAcademy.tsx");

  assertEquals(
    /if \(allowSkip === false\)[\s\S]*const expected = missingIndices\.map\(i => pattern\[i\]\);[\s\S]*const placed = missingIndices\.map\(i => newFilled\[i\]\);[\s\S]*const levelScore = scoreByPosition\(placed, expected\);[\s\S]*setWrongAttempts\(prev => prev \+ missingIndices\.length - levelScore\);/.test(source),
    true,
    "Pattern Train should accept choices in quiz mode and score wrong missing slots",
  );

  assertEquals(scoreByPosition(["🍎", "🍎"], ["🍎", "🍐"]), 1);
});

Deno.test("animal parts quiz scores each selected piece by its final position", async () => {
  const source = await readGameSource("AnimalVehicleBuilder.tsx");

  assertEquals(
    /if \(allowSkip === false\)[\s\S]*const nextPlaced = \[\.\.\.placed, orderIndex\];[\s\S]*const nextLevelScore = scoreByPosition\(nextPlaced, expected\);[\s\S]*setWrongAttempts\(prev => prev - \(placed\.length - previousLevelScore\) \+ \(nextPlaced\.length - nextLevelScore\)\);/.test(source),
    true,
    "Animal parts should accept any piece in quiz mode and count incorrect positions",
  );

  assertEquals(scoreByPosition([1, 2, 0, 3], [0, 1, 2, 3]), 1);
});
