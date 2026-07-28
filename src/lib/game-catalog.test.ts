import { assertEquals } from "jsr:@std/assert";
import { GAME_CATALOG, getGameCatalogEntry } from "./game-catalog.ts";

Deno.test("GAME_CATALOG exposes every playable game in stable topic order", () => {
  assertEquals(GAME_CATALOG.length, 82);
  assertEquals(GAME_CATALOG[0], {
    topicId: "colors",
    gameId: "colors:0",
    gameOrder: 0,
    title: "colors-1",
    maxScore: 1,
  });
  assertEquals(GAME_CATALOG.at(-1), {
    topicId: "clock",
    gameId: "clock:6",
    gameOrder: 6,
    title: "clock-7",
    maxScore: 1,
  });
  assertEquals(getGameCatalogEntry("addition", 11)?.gameId, "addition:11");
  assertEquals(getGameCatalogEntry("clock", 7), null);
});
