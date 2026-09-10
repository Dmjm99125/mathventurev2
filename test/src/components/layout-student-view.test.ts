import { assertEquals } from "jsr:@std/assert";

const source = await Deno.readTextFile(new URL("../../../src/components/layout.tsx", import.meta.url));

Deno.test("layout exposes the reversible student-view banner", () => {
  assertEquals(source.includes("isViewingStudent"), true);
  assertEquals(source.includes("Return to teacher account"), true);
});
