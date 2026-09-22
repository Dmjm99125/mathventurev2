import { assertEquals } from "jsr:@std/assert";
import { shouldRecordStandaloneAttempt } from "../../../src/lib/quiz/recording.ts";

Deno.test("standalone attempts are not recorded during public Free Play", () => {
  assertEquals(shouldRecordStandaloneAttempt({ isPublicFreePlay: true, isTeacherContext: false }), false);
});

Deno.test("standalone attempts are not recorded anywhere in teacher context", () => {
  assertEquals(shouldRecordStandaloneAttempt({ isPublicFreePlay: false, isTeacherContext: true }), false);
});

Deno.test("standalone attempts remain recordable for regular students", () => {
  assertEquals(shouldRecordStandaloneAttempt({ isPublicFreePlay: false, isTeacherContext: false }), true);
});
