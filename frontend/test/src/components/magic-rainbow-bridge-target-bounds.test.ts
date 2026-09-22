import { assert, assertEquals } from "jsr:@std/assert";

import {
  clampRainbowBridgeTargetX,
  getRainbowBridgeTargetX,
} from "../../../src/components/games/7-measurement/magicRainbowBridgeLayout.ts";

Deno.test("magic rainbow bridge clamps the castle target inside narrow mobile boards", () => {
  assertEquals(clampRainbowBridgeTargetX(250, 280), 192);
  assertEquals(clampRainbowBridgeTargetX(500, 320), 232);
});

Deno.test("magic rainbow bridge random target generation stays inside the live board width", () => {
  const boardWidth = 280;
  const minTarget = getRainbowBridgeTargetX(boardWidth, 0);
  const maxTarget = getRainbowBridgeTargetX(boardWidth, 0.999999);

  assertEquals(minTarget, 160);
  assertEquals(maxTarget, 192);
  assert(maxTarget <= clampRainbowBridgeTargetX(Number.POSITIVE_INFINITY, boardWidth));
});
