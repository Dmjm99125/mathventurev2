import { assertEquals, assertStringIncludes } from "jsr:@std/assert";

Deno.test("landing free play is a public topic menu", async () => {
  const landing = await Deno.readTextFile(new URL("../../../src/pages/landing.tsx", import.meta.url));
  const page = await Deno.readTextFile(new URL("../../../src/pages/free-play.tsx", import.meta.url));

  assertEquals(landing.includes('href="/free-play"'), true);
  assertEquals(page.includes("No login is needed."), true);
  assertEquals(page.includes("freePlay=1"), true);
  assertEquals(page.includes("FreePlayOfflinePanel"), true);
  assertEquals(page.includes("showStatus={false}"), true);
  assertEquals(page.includes("rounded-[28px] border-4 border-white/70 bg-white/90 p-4"), true);
  assertEquals(page.includes("h-12 w-12"), true);
});

Deno.test("Free Play applies Comic Sans to the whole page without changing global typography", async () => {
  const page = await Deno.readTextFile(new URL("../../../src/pages/free-play.tsx", import.meta.url));
  const foundation = await Deno.readTextFile(new URL("../../../src/styles/foundation.css", import.meta.url));

  assertEquals(page.includes('className="free-play-page font-comic-sans min-h-[100dvh]'), true);
  assertStringIncludes(foundation, ".font-comic-sans *");
  assertStringIncludes(foundation, '"Comic Sans MS"');
});
