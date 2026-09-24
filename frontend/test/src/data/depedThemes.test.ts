import { assertEquals, assertStringIncludes } from "jsr:@std/assert";
import { DEPED_THEMES } from "../../../src/data/depedThemes.ts";

const topicIds = [
  "colors",
  "shapes",
  "sequencing",
  "addition",
  "subtraction",
  "numbers",
  "measurement",
  "comparison",
  "clock",
] as const;

const expectedThemeFields = {
  colors: "THEME I",
  shapes: "THEME I",
  sequencing: "THEME II",
  addition: "THEME III",
  subtraction: "THEME III",
  numbers: "THEME I",
  measurement: "THEME IV",
  comparison: "THEME I",
  clock: "THEME II",
} as const;

Deno.test("DepEd themes cover every lesson topic with six authored rows", () => {
  assertEquals(Object.keys(DEPED_THEMES).sort(), [...topicIds].sort());

  for (const topicId of topicIds) {
    assertEquals(DEPED_THEMES[topicId].rows.length, 6, topicId);
    assertEquals(DEPED_THEMES[topicId].rows.map((row) => row.field), [
      expectedThemeFields[topicId],
      "CONTENT STANDARD",
      "PERFORMANCE STANDARD",
      "LEARNING COMPETENCIES",
      "SUBTHEMES",
      "SUGGESTED CONTENTS",
    ]);
  }
});

Deno.test("DepEd theme data preserves representative authored wording", () => {
  assertEquals(DEPED_THEMES.colors.title, "Colors");
  assertStringIncludes(
    DEPED_THEMES.colors.rows[1].content,
    "The learners understand the value of knowing oneself",
  );
  assertEquals(
    DEPED_THEMES.addition.rows[5].content,
    "Joining Sets and Basic Addition (Concrete and Pictorial Models up to 10)",
  );
  assertEquals(
    DEPED_THEMES.clock.rows[0].content,
    "EXPLORING OUR COMMUNITY",
  );
});
