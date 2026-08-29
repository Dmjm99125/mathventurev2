import { assertEquals } from "jsr:@std/assert";

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../../../${relativePath}`, import.meta.url));
}

Deno.test("teacher progress exposes expandable overall and per-game scores", async () => {
  const source = await readSource("src/components/teacher/TeacherStudentProgressTable.tsx");

  assertEquals(source.includes("useState<string | null>(null)"), true);
  assertEquals(source.includes("overallScorePct"), true);
  assertEquals(source.includes("gameScores"), true);
  assertEquals(source.includes("aria-expanded"), true);
  assertEquals(source.includes("GAME_CATALOG"), true);
});
