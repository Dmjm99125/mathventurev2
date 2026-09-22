import { assertEquals } from "jsr:@std/assert";

const aboutSource = await Deno.readTextFile(
  new URL("../../../src/pages/about.tsx", import.meta.url),
);

Deno.test("About The Researchers exposes legacy and current repository links", () => {
  assertEquals((aboutSource.match(/<span>(?:Legacy|Current)<\/span>/g) ?? []).length, 2);
  assertEquals(
    /<a href="https:\/\/github\.com\/dmjm99125\/mathventureprototype" target="_blank" rel="noopener noreferrer"/.test(aboutSource),
    true,
  );
  assertEquals(
    /<a href="https:\/\/github\.com\/dmjm99125\/mathventurev2" target="_blank" rel="noopener noreferrer"/.test(aboutSource),
    true,
  );
});
