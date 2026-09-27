import { assertEquals, assertMatch } from "jsr:@std/assert";

Deno.test("Free Play offline panel uses one explicit, parent-readable download flow", async () => {
  const source = await Deno.readTextFile(new URL("../../../src/components/offline/FreePlayOfflinePanel.tsx", import.meta.url));

  assertMatch(source, /Download Free Play for offline/);
  assertMatch(source, /Offline ready/);
  assertMatch(source, /Update available/);
  assertMatch(source, /Retry download/);
  assertMatch(source, /role="progressbar"/);
  assertMatch(source, /aria-valuenow/);
  assertMatch(source, /<details[\s\S]*For parents: Offline library/);
  assertEquals(source.includes('<details open'), false);
  assertEquals(source.includes("useEffect(() => download"), false);
});

Deno.test("Free Play offline panel exposes a responsive PWA install action", async () => {
  const source = await Deno.readTextFile(new URL("../../../src/components/offline/FreePlayOfflinePanel.tsx", import.meta.url));

  assertMatch(source, /InstallAppAction/);
  assertMatch(source, /showFallback/);
  assertMatch(source, /w-full sm:w-auto/);
  assertMatch(source, /flex-col/);
  assertMatch(source, /sm:flex-row/);
  assertMatch(source, /min-w-0/);
});
