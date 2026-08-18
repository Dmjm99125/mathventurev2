import { assertEquals } from "jsr:@std/assert";
import { GAME_CATALOG, getGameCatalogEntry } from "../../../../src/lib/games/catalog.ts";

Deno.test("GAME_CATALOG exposes every playable game in stable topic order", () => {
  assertEquals(GAME_CATALOG.length, 86);
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
  assertEquals(getGameCatalogEntry("addition", 15)?.gameId, "addition:15");
  assertEquals(getGameCatalogEntry("addition", 16), null);
  assertEquals(getGameCatalogEntry("numbers", 8)?.gameId, "numbers:8");
  assertEquals(getGameCatalogEntry("numbers", 9), null);
  assertEquals(getGameCatalogEntry("clock", 7), null);
});
