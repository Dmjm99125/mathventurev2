import { assertMatch } from "jsr:@std/assert";

Deno.test("top navigation exposes an install action without crowding mobile controls", async () => {
  const source = await Deno.readTextFile(new URL("../../../src/components/layout.tsx", import.meta.url));

  assertMatch(source, /InstallAppAction/);
  assertMatch(source, /hidden sm:inline-flex/);
});
