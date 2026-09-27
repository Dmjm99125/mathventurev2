import { assertMatch } from "jsr:@std/assert";

Deno.test("shared install action exposes prompt and manual-install states", async () => {
  const source = await Deno.readTextFile(
    new URL("../../../src/components/pwa/InstallAppAction.tsx", import.meta.url),
  );

  assertMatch(source, /usePwaInstall/);
  assertMatch(source, /Install MathVenture/);
  assertMatch(source, /Add to Home Screen/);
  assertMatch(source, /aria-live/);
  assertMatch(source, /canInstall/);
});
