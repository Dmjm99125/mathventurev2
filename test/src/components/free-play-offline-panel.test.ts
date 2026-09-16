import { assertEquals, assertMatch } from "jsr:@std/assert";

Deno.test("Free Play offline panel uses one explicit, parent-readable download flow", async () => {
  const source = await Deno.readTextFile(new URL("../../../src/components/offline/FreePlayOfflinePanel.tsx", import.meta.url));

  assertMatch(source, /Download Free Play for offline/);
  assertMatch(source, /Offline ready/);
  assertMatch(source, /Update available/);
  assertMatch(source, /Retry download/);
  assertMatch(source, /role="progressbar"/);
  assertMatch(source, /aria-valuenow/);
  assertEquals(source.includes("useEffect(() => download"), false);
});
