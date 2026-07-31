import { assertEquals } from "jsr:@std/assert";

Deno.test("lesson intro video removes the skip button and uses larger sizing", async () => {
  const source = await Deno.readTextFile(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("Skip Video"), false);
  assertEquals(source.includes("max-w-5xl"), true);
  assertEquals(source.includes("maxHeight: '520px'"), true);
});
