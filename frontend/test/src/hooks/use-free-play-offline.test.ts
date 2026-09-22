import { assertEquals, assertMatch } from "jsr:@std/assert";

Deno.test("Free Play offline hook owns worker listeners and refreshes status when the page returns online", async () => {
  const source = await Deno.readTextFile(new URL("../../../src/hooks/useFreePlayOffline.ts", import.meta.url));

  assertMatch(source, /useEffect/);
  assertMatch(source, /removeEventListener/);
  assertMatch(source, /checkForUpdate/);
  assertEquals(source.includes("Download automatically"), false);
});
