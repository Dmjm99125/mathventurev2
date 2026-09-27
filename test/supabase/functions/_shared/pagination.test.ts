import { assertEquals, assertThrows } from "jsr:@std/assert";
import {
  decodeCursor,
  encodeCursor,
  parsePageRequest,
} from "../../../../supabase/functions/_shared/pagination.ts";

Deno.test("parsePageRequest applies the default and hard maximum", () => {
  assertEquals(parsePageRequest(new URL("http://local/")), {
    pageSize: 50,
    cursor: null,
  });
  assertEquals(parsePageRequest(new URL("http://local/?pageSize=100")), {
    pageSize: 100,
    cursor: null,
  });
  assertThrows(() => parsePageRequest(new URL("http://local/?pageSize=101")));
  assertThrows(() => parsePageRequest(new URL("http://local/?pageSize=0")));
  assertThrows(() => parsePageRequest(new URL("http://local/?pageSize=1.5")));
});

Deno.test("cursor encoding round trips stable ordering values", () => {
  const cursor = encodeCursor({
    joinedAt: "2026-09-27T00:00:00.000Z",
    id: "student-1",
  });

  assertEquals(decodeCursor<{ joinedAt: string; id: string }>(cursor), {
    joinedAt: "2026-09-27T00:00:00.000Z",
    id: "student-1",
  });
});

Deno.test("cursor decoding rejects malformed and non-object input", () => {
  assertThrows(() => decodeCursor("not-a-cursor"));
  assertThrows(() => decodeCursor(encodeCursor(null)));
  assertThrows(() => decodeCursor(encodeCursor(["not", "an", "object"])));
});
