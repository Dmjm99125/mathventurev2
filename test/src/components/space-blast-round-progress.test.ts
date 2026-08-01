import { assertEquals } from "jsr:@std/assert";

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../../../${relativePath}`, import.meta.url));
}

Deno.test("SpaceBlast tracks correct selections per round instead of score", async () => {
  const source = await readSource("src/components/games/5-subtraction/SpaceBlast.tsx");

  assertEquals(source.includes("const [selectedCorrectAnswer, setSelectedCorrectAnswer] = useState<number | null>(null);"), true);
  assertEquals(source.includes("setSelectedCorrectAnswer(null);"), true);
  assertEquals(source.includes("setSelectedCorrectAnswer(selected);"), true);
  assertEquals(source.includes("const isCorrect = selectedCorrectAnswer === opt;"), true);
  assertEquals(source.includes("disabled={isWrong || isCorrect}"), true);
});
