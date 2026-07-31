import { assertEquals } from "jsr:@std/assert";

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../../../${relativePath}`, import.meta.url));
}

Deno.test("clock games keep top controls in flow instead of overlaying mobile headers", async () => {
  const paths = [
    "src/components/games/9-clock/BuildClock.tsx",
    "src/components/games/9-clock/ClockMultiple.tsx",
    "src/components/games/9-clock/DailyRoutineTime.tsx",
    "src/components/games/9-clock/DragMatchingClock.tsx",
    "src/components/games/9-clock/FillMissingTime.tsx",
    "src/components/games/9-clock/TimeAdventure.tsx",
    "src/components/games/9-clock/TimeMatcher.tsx",
  ];

  for (const path of paths) {
    const source = await readSource(path);
    assertEquals(source.includes("absolute top-6 right-6 z-50"), false);
    assertEquals(source.includes("w-full max-w-sm justify-center md:w-auto"), true);
  }
});

Deno.test("clock prompts and controls use mobile-safe wrapping and sizing", async () => {
  const clockMultiple = await readSource("src/components/games/9-clock/ClockMultiple.tsx");
  const fillMissingTime = await readSource("src/components/games/9-clock/FillMissingTime.tsx");
  const dailyRoutineTime = await readSource("src/components/games/9-clock/DailyRoutineTime.tsx");
  const dragMatchingClock = await readSource("src/components/games/9-clock/DragMatchingClock.tsx");
  const timeAdventure = await readSource("src/components/games/9-clock/TimeAdventure.tsx");

  assertEquals(clockMultiple.includes("w-full max-w-md"), true);
  assertEquals(clockMultiple.includes("break-words"), true);

  assertEquals(fillMissingTime.includes("flex flex-wrap items-center justify-center"), true);
  assertEquals(fillMissingTime.includes("w-20 h-20 md:w-24 md:h-24"), true);

  assertEquals(dailyRoutineTime.includes("flex flex-col gap-4 md:flex-row"), true);

  assertEquals(dragMatchingClock.includes("w-full max-w-xs"), true);

  assertEquals(timeAdventure.includes("text-3xl md:text-4xl"), true);
});
