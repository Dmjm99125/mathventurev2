import { assertEquals } from "jsr:@std/assert";

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
      source.includes("onComplete?.(correctItems + 1, correctItems + wrongAttempts + 1);"),
      true,
      `${fileName} should report the terminal interaction with wrong attempts included`,
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
