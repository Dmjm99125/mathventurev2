import { assertEquals } from "jsr:@std/assert";

Deno.test("GameLayout exposes the theme progress stage before video", async () => {
  const source = await Deno.readTextFile(new URL("../../../src/components/GameLayout.tsx", import.meta.url));

  assertEquals(source.includes("export type LessonStage = 'theme' | 'video' | 'lesson' | 'quiz';"), true);
  assertEquals(source.includes("key: 'theme', label: 'Theme'"), true);
  assertEquals(source.indexOf("key: 'theme'") < source.indexOf("key: 'video'"), true);
});

Deno.test("GameLayout applies Comic Sans to every lesson and game surface", async () => {
  const source = await Deno.readTextFile(new URL("../../../src/components/GameLayout.tsx", import.meta.url));

  assertEquals(source.includes('className="font-comic-sans absolute inset-0'), true);
});
