import { assertEquals } from "jsr:@std/assert";

Deno.test("landing free play is a public topic menu", async () => {
  const landing = await Deno.readTextFile(new URL("../../../src/pages/landing.tsx", import.meta.url));
  const page = await Deno.readTextFile(new URL("../../../src/pages/free-play.tsx", import.meta.url));

  assertEquals(landing.includes('href="/free-play"'), true);
  assertEquals(page.includes("No login is needed."), true);
  assertEquals(page.includes("freePlay=1"), true);
});
