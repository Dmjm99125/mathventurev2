import { assertEquals } from "jsr:@std/assert";
import {
  LEGACY_TOPIC_META,
  buildPortalTopicEntries,
} from "./student-portal.ts";

Deno.test("legacy topic metadata preserves the original menu order and asset paths", () => {
  assertEquals(
    LEGACY_TOPIC_META.map((topic) => topic.id),
    ["colors", "shapes", "sequencing", "addition", "subtraction", "numbers", "measurement", "comparison", "clock"],
  );

  assertEquals(LEGACY_TOPIC_META[0].assetSrc, "/assets/images/1col.png");
  assertEquals(LEGACY_TOPIC_META[8].assetSrc, "/assets/images/1CLO.png");
});

Deno.test("buildPortalTopicEntries creates assignment-aware lesson hrefs and completion flags", () => {
  const entries = buildPortalTopicEntries({
    assignments: [
      { id: "asg-1", lessonId: "colors", dueAt: null, completed: false },
      { id: "asg-2", lessonId: "clock", dueAt: null, completed: true },
    ],
    recentAttempts: [
      { lessonId: "colors", score: 4, maxScore: 5 },
      { lessonId: "numbers", score: 5, maxScore: 5 },
    ],
  });

  assertEquals(entries[0], {
    id: "colors",
    lessonNumber: 1,
    fallbackLabel: "Colors",
    assetSrc: "/assets/images/1col.png",
    href: "/student/lessons/colors?assignmentId=asg-1",
    isAssigned: true,
    isCompleted: true,
    recentScorePct: 80,
  });

  assertEquals(entries[5].href, "/student/lessons/numbers");
  assertEquals(entries[5].isCompleted, true);
  assertEquals(entries[8].isAssigned, false);
});
