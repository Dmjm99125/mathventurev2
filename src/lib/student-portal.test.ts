import { assertEquals } from "jsr:@std/assert";
import {
  LEGACY_TOPIC_META,
  buildPortalTopicEntries,
  summarizePortalRail,
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

Deno.test("summarizePortalRail prefers the first pending assignment and keeps class context", () => {
  const summary = summarizePortalRail({
    assignments: [
      { id: "asg-1", lessonId: "colors", dueAt: "2026-07-29T00:00:00.000Z", completed: false },
      { id: "asg-2", lessonId: "numbers", dueAt: null, completed: false },
    ],
    classes: [
      { id: "class-1", name: "Section Sunflower", teacherName: "Teacher Mia" },
    ],
    dashboard: {
      completedLessons: 4,
      streakDays: 3,
      recentAttempts: [{ lessonId: "numbers", score: 5, maxScore: 5 }],
    },
  });

  assertEquals(summary.nextAction, {
    kind: "assignment",
    lessonId: "colors",
    href: "/student/lessons/colors?assignmentId=asg-1",
    dueAt: "2026-07-29T00:00:00.000Z",
  });
  assertEquals(summary.primaryClass?.name, "Section Sunflower");
  assertEquals(summary.completedLessons, 4);
  assertEquals(summary.recentScorePct, 100);
});

Deno.test("summarizePortalRail falls back to free play messaging and join prompt when data is sparse", () => {
  const summary = summarizePortalRail({
    assignments: [],
    classes: [],
    dashboard: {
      completedLessons: 0,
      streakDays: 0,
      recentAttempts: [],
    },
  });

  assertEquals(summary.nextAction, {
    kind: "free-play",
    href: "/student/lessons",
  });
  assertEquals(summary.primaryClass, null);
  assertEquals(summary.showJoinPrompt, true);
  assertEquals(summary.recentLessonId, null);
  assertEquals(summary.recentScorePct, null);
});
