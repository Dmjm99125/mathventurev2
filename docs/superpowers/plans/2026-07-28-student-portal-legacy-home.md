# Student Portal Legacy Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current `/student` dashboard with a child-friendly legacy-inspired portal that shows a 25% school-info rail on the left and a 75% lesson world on the right, while keeping every lesson playable.

**Architecture:** Extract the lesson-order, asset-map, and rail-summary logic into a pure `student-portal` helper module first so it can be covered with Deno tests before any JSX changes. Then build focused React components for the left rail, the right-side legacy lesson menu, and the playful loading state, and apply the lighter shell only to the `/student` route so the rest of the app keeps its current layout.

**Tech Stack:** React 19, TypeScript, Wouter, Tailwind CSS 4, TanStack Query, Deno tests, Vite 6.

## Global Constraints

- The student home screen must prioritize immediate lesson entry.
- All lessons shown on the right remain playable regardless of assignment status.
- Teacher assignments should be emphasized, not enforced, on this page.
- The child-facing copy must stay short and positive.
- The custom portal layout should not compete with the app's existing student sidebar.
- The free-play promo block on the student home page must be removed.

## File Map

- Create: `src/lib/student-portal.ts`
  Pure student-portal derivation logic: legacy topic metadata, image paths, fallback labels, lesson href generation, assignment highlighting, and left-rail summaries.
- Create: `src/lib/student-portal.test.ts`
  Deno tests for topic ordering, asset mapping, assignment-aware lesson hrefs, empty-state summaries, and progress derivation.
- Create: `src/components/student/LegacyLessonMenu.tsx`
  Right-side lesson world using the legacy header and topic label assets, with image fallbacks and tappable lesson rows.
- Create: `src/components/student/StudentPortalRail.tsx`
  Left-side 25% helper rail for next assignment, primary class, progress, and join-class prompt.
- Create: `src/components/student/StudentPortalLoading.tsx`
  Child-friendly loading presentation for `/student`.
- Modify: `src/pages/student.tsx:1-243`
  Replace the current `StudentDashboard` card grid and free-play hero with the new portal composition while leaving `StudentLessons` and `StudentClassDetail` intact.
- Modify: `src/components/layout.tsx:1-145`
  Add a page-level way to hide the existing student sidebar so `/student` can use the custom left rail as its only side structure.
- Modify: `src/App.tsx:34-45`
  Apply the lighter shell only to the `/student` route.
- Modify: `src/lib/useLanguage.tsx:11-93`
  Add localized portal copy and remove the last hardcoded student-nav label.

**Testing note:** The repo currently has Deno tests for pure TypeScript modules but no React component test runner. Keep automated coverage in `src/lib/student-portal.test.ts`, then use `npm run typecheck`, `npm run build`, and manual smoke checks for JSX and route integration.

### Task 1: Build And Test Legacy Topic Metadata Helpers

**Files:**
- Create: `src/lib/student-portal.ts`
- Create: `src/lib/student-portal.test.ts`

**Interfaces:**
- Produces: `type PortalTopicId = "colors" | "shapes" | "sequencing" | "addition" | "subtraction" | "numbers" | "measurement" | "comparison" | "clock"`
- Produces: `type PortalAssignment = { id: string; lessonId: string; dueAt: string | null; completed: boolean }`
- Produces: `type PortalRecentAttempt = { lessonId: string; score: number; maxScore: number; completedAt?: string }`
- Produces: `type PortalTopicEntry = { id: PortalTopicId; lessonNumber: number; fallbackLabel: string; assetSrc: string; href: string; isAssigned: boolean; isCompleted: boolean; recentScorePct: number | null }`
- Produces: `LEGACY_TOPIC_META`
- Produces: `buildPortalTopicEntries(input: { assignments: PortalAssignment[]; recentAttempts: PortalRecentAttempt[] }): PortalTopicEntry[]`

- [ ] **Step 1: Write the failing topic-helper tests**

```ts
// src/lib/student-portal.test.ts
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
```

- [ ] **Step 2: Run the topic-helper tests to verify they fail**

Run: `deno test src/lib/student-portal.test.ts`

Expected: FAIL with `Cannot resolve module "./student-portal.ts"` or missing export errors.

- [ ] **Step 3: Implement the topic metadata and lesson-entry builder**

```ts
// src/lib/student-portal.ts
export type PortalTopicId =
  | "colors"
  | "shapes"
  | "sequencing"
  | "addition"
  | "subtraction"
  | "numbers"
  | "measurement"
  | "comparison"
  | "clock";

export type PortalAssignment = {
  id: string;
  lessonId: string;
  dueAt: string | null;
  completed: boolean;
};

export type PortalRecentAttempt = {
  lessonId: string;
  score: number;
  maxScore: number;
  completedAt?: string;
};

export type PortalTopicEntry = {
  id: PortalTopicId;
  lessonNumber: number;
  fallbackLabel: string;
  assetSrc: string;
  href: string;
  isAssigned: boolean;
  isCompleted: boolean;
  recentScorePct: number | null;
};

export const LEGACY_TOPIC_META: ReadonlyArray<{
  id: PortalTopicId;
  lessonNumber: number;
  fallbackLabel: string;
  assetSrc: string;
}> = [
  { id: "colors", lessonNumber: 1, fallbackLabel: "Colors", assetSrc: "/assets/images/1col.png" },
  { id: "shapes", lessonNumber: 2, fallbackLabel: "Shapes", assetSrc: "/assets/images/1sha.png" },
  { id: "sequencing", lessonNumber: 3, fallbackLabel: "Sequencing", assetSrc: "/assets/images/1seq.png" },
  { id: "addition", lessonNumber: 4, fallbackLabel: "Addition", assetSrc: "/assets/images/1add.png" },
  { id: "subtraction", lessonNumber: 5, fallbackLabel: "Subtraction", assetSrc: "/assets/images/1SUB.png" },
  { id: "numbers", lessonNumber: 6, fallbackLabel: "Numbers", assetSrc: "/assets/images/1NUM.png" },
  { id: "measurement", lessonNumber: 7, fallbackLabel: "Measurement", assetSrc: "/assets/images/1MEA.png" },
  { id: "comparison", lessonNumber: 8, fallbackLabel: "Comparison", assetSrc: "/assets/images/1COM.png" },
  { id: "clock", lessonNumber: 9, fallbackLabel: "Clock", assetSrc: "/assets/images/1CLO.png" },
] as const;

function toPortalTopicId(value: string): PortalTopicId | null {
  return LEGACY_TOPIC_META.find((topic) => topic.id === value)?.id ?? null;
}

export function buildPortalTopicEntries(input: {
  assignments: PortalAssignment[];
  recentAttempts: PortalRecentAttempt[];
}): PortalTopicEntry[] {
  const assignmentByLesson = new Map(
    input.assignments
      .filter((assignment) => !assignment.completed)
      .flatMap((assignment) => {
        const topicId = toPortalTopicId(assignment.lessonId);
        return topicId ? [[topicId, assignment] as const] : [];
      }),
  );

  const attemptsByLesson = new Map(
    input.recentAttempts.flatMap((attempt) => {
      const topicId = toPortalTopicId(attempt.lessonId);
      return topicId ? [[topicId, attempt] as const] : [];
    }),
  );

  return LEGACY_TOPIC_META.map((topic) => {
    const assignment = assignmentByLesson.get(topic.id);
    const attempt = attemptsByLesson.get(topic.id) ?? null;

    return {
      ...topic,
      href: assignment
        ? `/student/lessons/${topic.id}?assignmentId=${assignment.id}`
        : `/student/lessons/${topic.id}`,
      isAssigned: Boolean(assignment),
      isCompleted: Boolean(attempt),
      recentScorePct: attempt ? Math.round((attempt.score / attempt.maxScore) * 100) : null,
    };
  });
}
```

- [ ] **Step 4: Run the topic-helper tests to verify they pass**

Run: `deno test src/lib/student-portal.test.ts`

Expected: PASS with 2 tests and 0 failures.

- [ ] **Step 5: Commit**

```bash
git add src/lib/student-portal.ts src/lib/student-portal.test.ts
git commit -m "feat: add student portal topic helpers"
```

### Task 2: Add Rail Summary Helpers And Empty-State Coverage

**Files:**
- Modify: `src/lib/student-portal.ts`
- Modify: `src/lib/student-portal.test.ts`

**Interfaces:**
- Produces: `type PortalClass = { id: string; name: string; teacherName: string }`
- Produces: `type PortalDashboardSummary = { completedLessons: number; streakDays: number; recentAttempts: PortalRecentAttempt[] }`
- Produces: `type PortalRailSummary = { nextAction: { kind: "assignment"; lessonId: PortalTopicId; href: string; dueAt: string | null } | { kind: "free-play"; href: "/student/lessons" }; primaryClass: PortalClass | null; classCount: number; completedLessons: number; streakDays: number; recentLessonId: PortalTopicId | null; recentScorePct: number | null; showJoinPrompt: boolean }`
- Produces: `summarizePortalRail(input: { assignments: PortalAssignment[]; classes: PortalClass[]; dashboard: PortalDashboardSummary }): PortalRailSummary`

- [ ] **Step 1: Extend the helper test file with failing rail-summary tests**

```ts
// src/lib/student-portal.test.ts
import { assertEquals } from "jsr:@std/assert";
import {
  summarizePortalRail,
} from "./student-portal.ts";

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
```

- [ ] **Step 2: Run the rail-summary tests to verify they fail**

Run: `deno test src/lib/student-portal.test.ts`

Expected: FAIL with `summarizePortalRail is not defined` or object mismatch failures.

- [ ] **Step 3: Implement the rail-summary derivation**

```ts
// src/lib/student-portal.ts
export type PortalClass = {
  id: string;
  name: string;
  teacherName: string;
};

export type PortalDashboardSummary = {
  completedLessons: number;
  streakDays: number;
  recentAttempts: PortalRecentAttempt[];
};

export type PortalRailSummary = {
  nextAction:
    | { kind: "assignment"; lessonId: PortalTopicId; href: string; dueAt: string | null }
    | { kind: "free-play"; href: "/student/lessons" };
  primaryClass: PortalClass | null;
  classCount: number;
  completedLessons: number;
  streakDays: number;
  recentLessonId: PortalTopicId | null;
  recentScorePct: number | null;
  showJoinPrompt: boolean;
};

export function summarizePortalRail(input: {
  assignments: PortalAssignment[];
  classes: PortalClass[];
  dashboard: PortalDashboardSummary;
}): PortalRailSummary {
  const nextAssignment = input.assignments.find((assignment) => {
    return !assignment.completed && toPortalTopicId(assignment.lessonId) !== null;
  }) ?? null;

  const nextLessonId = nextAssignment ? toPortalTopicId(nextAssignment.lessonId) : null;
  const recentAttempt = input.dashboard.recentAttempts[0] ?? null;
  const recentLessonId = recentAttempt ? toPortalTopicId(recentAttempt.lessonId) : null;
  const primaryClass = input.classes[0] ?? null;

  return {
    nextAction: nextAssignment && nextLessonId
      ? {
          kind: "assignment",
          lessonId: nextLessonId,
          href: `/student/lessons/${nextLessonId}?assignmentId=${nextAssignment.id}`,
          dueAt: nextAssignment.dueAt,
        }
      : {
          kind: "free-play",
          href: "/student/lessons",
        },
    primaryClass,
    classCount: input.classes.length,
    completedLessons: input.dashboard.completedLessons,
    streakDays: input.dashboard.streakDays,
    recentLessonId,
    recentScorePct: recentAttempt
      ? Math.round((recentAttempt.score / recentAttempt.maxScore) * 100)
      : null,
    showJoinPrompt: input.classes.length === 0,
  };
}
```

- [ ] **Step 4: Run the helper suite again to verify it passes**

Run: `deno test src/lib/student-portal.test.ts`

Expected: PASS with 4 tests and 0 failures.

- [ ] **Step 5: Commit**

```bash
git add src/lib/student-portal.ts src/lib/student-portal.test.ts
git commit -m "feat: add student portal rail summary"
```

### Task 3: Build The Portal Components And Recompose `StudentDashboard`

**Files:**
- Create: `src/components/student/LegacyLessonMenu.tsx`
- Create: `src/components/student/StudentPortalRail.tsx`
- Create: `src/components/student/StudentPortalLoading.tsx`
- Modify: `src/pages/student.tsx:1-243`

**Interfaces:**
- Consumes: `PortalTopicEntry[]`
- Consumes: `PortalRailSummary`
- Produces: `LegacyLessonMenu(props: { topics: PortalTopicEntry[]; highlightedLessonId: PortalTopicId | null; onSelect: (href: string) => void }): JSX.Element`
- Produces: `StudentPortalRail(props: { summary: PortalRailSummary; joinCode: string; isJoining: boolean; isJoinPending: boolean; onJoinCodeChange: (value: string) => void; onJoinSubmit: (event: React.FormEvent<HTMLFormElement>) => void; onStartJoin: () => void; onOpenAssignment: (href: string) => void; onOpenClass: (classId: string) => void }): JSX.Element`
- Produces: `StudentPortalLoading(): JSX.Element`

- [ ] **Step 1: Re-run the green helper suite before wiring JSX**

Run: `deno test src/lib/student-portal.test.ts`

Expected: PASS. This keeps the data model green before the UI starts consuming it.

- [ ] **Step 2: Create the right-side lesson world and the loading component**

```tsx
// src/components/student/LegacyLessonMenu.tsx
import React, { useMemo, useState } from "react";
import { Button, cn } from "@/components/ui";
import type { PortalTopicEntry, PortalTopicId } from "@/lib/student-portal";

const headerAssets = [
  { key: "let", src: "/assets/images/1let.png", fallback: "Let's Learn!" },
  { key: "lets", src: "/assets/images/1lets.png", fallback: "Tayo ay Matuto!" },
] as const;

export function LegacyLessonMenu({
  topics,
  highlightedLessonId,
  onSelect,
}: {
  topics: PortalTopicEntry[];
  highlightedLessonId: PortalTopicId | null;
  onSelect: (href: string) => void;
}) {
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const topicState = useMemo(() => {
    return topics.map((topic) => ({
      ...topic,
      isBroken: brokenImages[topic.id] === true,
    }));
  }, [brokenImages, topics]);

  return (
    <section className="relative z-10 flex min-h-[560px] flex-col gap-4 rounded-[28px] bg-white/8 p-4 backdrop-blur-[1px] md:p-6">
      <header className="grid gap-3 md:grid-cols-2 md:items-center">
        {headerAssets.map((asset) => {
          const broken = brokenImages[asset.key] === true;
          return broken ? (
            <div
              key={asset.key}
              className="rounded-2xl bg-white/80 px-4 py-3 text-center text-xl font-extrabold text-primary shadow-sm"
            >
              {asset.fallback}
            </div>
          ) : (
            <img
              key={asset.key}
              src={asset.src}
              alt={asset.fallback}
              className="w-full object-contain drop-shadow-[0_8px_12px_rgba(0,0,0,0.16)]"
              onError={() => setBrokenImages((current) => ({ ...current, [asset.key]: true }))}
            />
          );
        })}
      </header>

      <div className="grid gap-2">
        {topicState.map((topic) => {
          const isHighlighted = highlightedLessonId === topic.id;

          return (
            <Button
              key={topic.id}
              type="button"
              variant="ghost"
              onClick={() => onSelect(topic.href)}
              className={cn(
                "group grid min-h-[56px] grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3 rounded-[22px] border border-transparent bg-white/10 px-3 py-2 text-left shadow-[0_8px_20px_rgba(0,0,0,0.08)] backdrop-blur-sm hover:bg-white/18",
                isHighlighted && "border-white/70 bg-white/22 ring-2 ring-jungle-yellow/60",
              )}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-400 text-sm font-extrabold text-white shadow-sm">
                {topic.lessonNumber}
              </span>

              {topic.isBroken ? (
                <span className="truncate text-lg font-extrabold uppercase tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.28)]">
                  {topic.fallbackLabel}
                </span>
              ) : (
                <img
                  src={topic.assetSrc}
                  alt={topic.fallbackLabel}
                  className="max-h-10 w-full object-contain object-left drop-shadow-[0_6px_8px_rgba(0,0,0,0.18)]"
                  onError={() => setBrokenImages((current) => ({ ...current, [topic.id]: true }))}
                />
              )}

              <div className="flex items-center gap-2">
                {topic.isAssigned && <span className="h-3 w-3 rounded-full bg-jungle-orange shadow-sm" aria-hidden="true" />}
                {topic.isCompleted && <span className="h-3 w-3 rounded-full bg-jungle-green shadow-sm" aria-hidden="true" />}
              </div>
            </Button>
          );
        })}
      </div>
    </section>
  );
}
```

```tsx
// src/components/student/StudentPortalLoading.tsx
import React from "react";
import { useLanguage } from "@/lib/useLanguage";

export function StudentPortalLoading() {
  const { t } = useLanguage();

  return (
    <div className="relative overflow-hidden rounded-[32px] border-4 border-white/60 bg-[linear-gradient(180deg,#88d6ff_0%,#d8f3ff_62%,#d5ec95_62%,#b3d66b_100%)] p-8 text-center shadow-[0_24px_60px_rgba(34,94,49,0.16)]">
      <div className="mx-auto mb-4 h-20 w-20 animate-bounce rounded-full bg-white/80 shadow-sm" />
      <h1 className="text-3xl font-extrabold text-primary">{t("student.portal.loadingTitle")}</h1>
      <p className="mt-2 text-base font-bold text-primary/80">{t("student.portal.loadingBody")}</p>
    </div>
  );
}
```

- [ ] **Step 3: Create the left rail and replace the old `StudentDashboard` body with the portal composition**

```tsx
// src/components/student/StudentPortalRail.tsx
import React from "react";
import { Button, Card, Input } from "@/components/ui";
import type { PortalRailSummary } from "@/lib/student-portal";
import type { StudentClassSummary } from "@/lib/api";
import { useLanguage } from "@/lib/useLanguage";

export function StudentPortalRail({
  summary,
  classes,
  joinCode,
  isJoining,
  isJoinPending,
  onJoinCodeChange,
  onJoinSubmit,
  onStartJoin,
  onOpenAssignment,
  onOpenClass,
}: {
  summary: PortalRailSummary;
  classes: StudentClassSummary[];
  joinCode: string;
  isJoining: boolean;
  isJoinPending: boolean;
  onJoinCodeChange: (value: string) => void;
  onJoinSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onStartJoin: () => void;
  onOpenAssignment: (href: string) => void;
  onOpenClass: (classId: string) => void;
}) {
  const { t } = useLanguage();

  return (
    <aside className="flex flex-col gap-4">
      <Card className="rounded-[28px] border-white/70 bg-[#fff7db]/95 p-5 shadow-[0_20px_45px_rgba(59,109,42,0.12)]">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-jungle-orange">
          {t("student.portal.nextAssignment")}
        </p>
        {summary.nextAction.kind === "assignment" ? (
          <>
            <h2 className="mt-2 text-2xl font-extrabold capitalize text-primary">
              {summary.nextAction.lessonId}
            </h2>
            <p className="mt-1 text-sm font-bold text-primary/75">{t("student.portal.playThisNext")}</p>
            <Button className="mt-4 w-full" variant="jungle" onClick={() => onOpenAssignment(summary.nextAction.href)}>
              {t("student.playNow")}
            </Button>
          </>
        ) : (
          <>
            <h2 className="mt-2 text-2xl font-extrabold text-primary">{t("student.portal.noAssignmentsTitle")}</h2>
            <p className="mt-1 text-sm font-bold text-primary/75">{t("student.portal.noAssignmentsBody")}</p>
            <Button className="mt-4 w-full" onClick={() => onOpenAssignment(summary.nextAction.href)}>
              {t("student.portal.tapAnyLesson")}
            </Button>
          </>
        )}
      </Card>

      <Card className="rounded-[28px] bg-white/92 p-5 shadow-[0_20px_45px_rgba(59,109,42,0.1)]">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">
          {t("student.portal.myClass")}
        </p>
        {summary.primaryClass ? (
          <>
            <button
              type="button"
              className="mt-3 w-full rounded-2xl bg-muted/50 px-4 py-3 text-left"
              onClick={() => onOpenClass(summary.primaryClass!.id)}
            >
              <span className="block text-lg font-extrabold text-foreground">{summary.primaryClass.name}</span>
              <span className="block text-sm font-bold text-muted-foreground">{summary.primaryClass.teacherName}</span>
            </button>
            {classes.length > 1 && (
              <p className="mt-3 text-xs font-bold text-muted-foreground">
                +{classes.length - 1} more class{classes.length > 2 ? "es" : ""}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="mt-3 text-sm font-bold text-muted-foreground">{t("student.portal.noClasses")}</p>
            <p className="mt-1 text-sm font-bold text-muted-foreground">{t("student.portal.joinPrompt")}</p>
          </>
        )}

        {isJoining ? (
          <form onSubmit={onJoinSubmit} className="mt-4 grid gap-2">
            <Input
              value={joinCode}
              onChange={(event) => onJoinCodeChange(event.target.value.toUpperCase())}
              className="font-mono uppercase"
              placeholder={t("teacher.joinCode")}
              autoFocus
            />
            <Button type="submit" variant="outline" disabled={isJoinPending || !joinCode.trim()}>
              Join
            </Button>
          </form>
        ) : (
          <Button className="mt-4 w-full" variant="outline" onClick={onStartJoin}>
            {t("student.portal.joinClass")}
          </Button>
        )}
      </Card>

      <Card className="rounded-[28px] bg-white/92 p-5 shadow-[0_20px_45px_rgba(59,109,42,0.1)]">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">
          {t("student.portal.myProgress")}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-jungle-yellow/20 px-3 py-4 text-center">
            <span className="block text-2xl font-extrabold text-primary">{summary.streakDays}</span>
            <span className="text-xs font-bold text-muted-foreground">{t("student.portal.days")}</span>
          </div>
          <div className="rounded-2xl bg-primary/10 px-3 py-4 text-center">
            <span className="block text-2xl font-extrabold text-primary">{summary.completedLessons}</span>
            <span className="text-xs font-bold text-muted-foreground">{t("student.portal.done")}</span>
          </div>
          <div className="rounded-2xl bg-sky-100 px-3 py-4 text-center">
            <span className="block text-2xl font-extrabold text-primary">{summary.recentScorePct ?? "--"}</span>
            <span className="text-xs font-bold text-muted-foreground">{t("student.portal.score")}</span>
          </div>
        </div>
      </Card>
    </aside>
  );
}
```

```tsx
// src/pages/student.tsx (replace StudentDashboard only)
import { LegacyLessonMenu } from "@/components/student/LegacyLessonMenu";
import { StudentPortalLoading } from "@/components/student/StudentPortalLoading";
import { StudentPortalRail } from "@/components/student/StudentPortalRail";
import {
  buildPortalTopicEntries,
  summarizePortalRail,
} from "@/lib/student-portal";

export function StudentDashboard() {
  const { data: dashboard, isLoading: dashLoading } = useStudentDashboard();
  const { data: assignmentsData, isLoading: assignLoading } = useAssignments();
  const { data: classesData } = useClasses();
  const joinClass = useJoinClass();
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [, setLocation] = useLocation();

  const handleJoinClass = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!joinCode.trim()) return;

    try {
      await joinClass.mutateAsync(joinCode);
      setJoinCode("");
      setIsJoining(false);
    } catch (error: any) {
      setDialogMessage(error.message || "Could not join class");
      setDialogOpen(true);
    }
  };

  if (dashLoading || assignLoading || !dashboard) {
    return <StudentPortalLoading />;
  }

  const assignments = (assignmentsData?.assignments || []) as import("@/lib/api").AssignmentForStudent[];
  const myClasses = (classesData?.classes || []) as StudentClassSummary[];
  const topics = buildPortalTopicEntries({
    assignments,
    recentAttempts: dashboard.recentAttempts || [],
  });
  const railSummary = summarizePortalRail({
    assignments,
    classes: myClasses.map((klass) => ({
      id: klass.id,
      name: klass.name,
      teacherName: klass.teacherName,
    })),
    dashboard: {
      completedLessons: dashboard.completedLessons,
      streakDays: dashboard.streakDays,
      recentAttempts: dashboard.recentAttempts || [],
    },
  });

  const highlightedLessonId =
    railSummary.nextAction.kind === "assignment" ? railSummary.nextAction.lessonId : null;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="grid gap-4 lg:grid-cols-[minmax(260px,25%)_minmax(0,1fr)]">
        <StudentPortalRail
          summary={railSummary}
          classes={myClasses}
          joinCode={joinCode}
          isJoining={isJoining}
          isJoinPending={joinClass.isPending}
          onJoinCodeChange={setJoinCode}
          onJoinSubmit={handleJoinClass}
          onStartJoin={() => setIsJoining(true)}
          onOpenAssignment={(href) => setLocation(href)}
          onOpenClass={(classId) => setLocation(`/student/classes/${classId}`)}
        />

        <div className="relative overflow-hidden rounded-[32px] border-4 border-white/60 shadow-[0_24px_60px_rgba(34,94,49,0.16)]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "linear-gradient(180deg, rgba(124,214,255,0.88) 0%, rgba(215,245,255,0.7) 65%, rgba(190,220,107,0.28) 100%), url('/assets/images/1bg.jpg')",
            }}
          />
          <div className="relative p-3 md:p-5">
            <LegacyLessonMenu
              topics={topics}
              highlightedLessonId={highlightedLessonId}
              onSelect={(href) => setLocation(href)}
            />
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notification</DialogTitle>
            <DialogDescription className="font-bold text-base mt-2">
              {dialogMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button>OK</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 4: Run the helper suite and typecheck after the JSX wiring**

Run: `deno test src/lib/student-portal.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/student-portal.ts src/lib/student-portal.test.ts src/components/student/LegacyLessonMenu.tsx src/components/student/StudentPortalRail.tsx src/components/student/StudentPortalLoading.tsx src/pages/student.tsx
git commit -m "feat: add legacy student portal home"
```

### Task 4: Localize Portal Copy And Apply The Lighter `/student` Shell

**Files:**
- Modify: `src/lib/useLanguage.tsx:11-93`
- Modify: `src/components/layout.tsx:1-145`
- Modify: `src/App.tsx:34-45`

**Interfaces:**
- Produces: `AppLayout(props: { children: React.ReactNode; sidebarMode?: "default" | "hidden" }): JSX.Element`
- Produces: localized keys:
  - `student.portal.allLessons`
  - `student.portal.nextAssignment`
  - `student.portal.playThisNext`
  - `student.portal.noAssignmentsTitle`
  - `student.portal.noAssignmentsBody`
  - `student.portal.tapAnyLesson`
  - `student.portal.myClass`
  - `student.portal.noClasses`
  - `student.portal.joinPrompt`
  - `student.portal.joinClass`
  - `student.portal.myProgress`
  - `student.portal.days`
  - `student.portal.done`
  - `student.portal.score`
  - `student.portal.loadingTitle`
  - `student.portal.loadingBody`

- [ ] **Step 1: Add the new English and Tagalog portal strings**

```ts
// src/lib/useLanguage.tsx (additions inside translations.en)
"student.portal.allLessons": "All Lessons",
"student.portal.nextAssignment": "Next Assignment",
"student.portal.playThisNext": "Play this next",
"student.portal.noAssignmentsTitle": "Pick any lesson to play.",
"student.portal.noAssignmentsBody": "Choose your next adventure.",
"student.portal.tapAnyLesson": "Tap any lesson",
"student.portal.myClass": "My Class",
"student.portal.noClasses": "You have not joined a class yet.",
"student.portal.joinPrompt": "Ask your teacher for a join code.",
"student.portal.joinClass": "Join a Class",
"student.portal.myProgress": "My Progress",
"student.portal.days": "Days",
"student.portal.done": "Done",
"student.portal.score": "Best",
"student.portal.loadingTitle": "Getting your jungle ready...",
"student.portal.loadingBody": "Loading your lessons and class updates.",

// src/lib/useLanguage.tsx (additions inside translations.tl)
"student.portal.allLessons": "Lahat ng Aralin",
"student.portal.nextAssignment": "Susunod na Gawain",
"student.portal.playThisNext": "Ito ang sunod mong laruin",
"student.portal.noAssignmentsTitle": "Pumili ng kahit anong aralin.",
"student.portal.noAssignmentsBody": "Piliin ang susunod mong adventure.",
"student.portal.tapAnyLesson": "Pumili ng aralin",
"student.portal.myClass": "Aking Klase",
"student.portal.noClasses": "Wala ka pang nasalihang klase.",
"student.portal.joinPrompt": "Humingi ng join code sa iyong guro.",
"student.portal.joinClass": "Sumali sa Klase",
"student.portal.myProgress": "Aking Progress",
"student.portal.days": "Araw",
"student.portal.done": "Tapos",
"student.portal.score": "Best",
"student.portal.loadingTitle": "Inihahanda ang iyong jungle...",
"student.portal.loadingBody": "Ikinakarga ang iyong mga aralin at class updates.",
```

- [ ] **Step 2: Hide the old sidebar only on `/student` and widen the portal container**

```tsx
// src/components/layout.tsx
import { Button, cn } from "./ui";

export function TopNav() {
  // ...
  const navItems = user ? (isTeacher ? [
    { href: "/teacher", label: t("teacher.dashboard"), icon: LayoutDashboard },
    { href: "/teacher/classes", label: t("teacher.classes"), icon: Users },
    { href: "/teacher/assignments", label: t("teacher.assignments"), icon: Settings },
  ] : [
    { href: "/student", label: t("student.dashboard"), icon: Map },
    { href: "/student/lessons", label: t("student.portal.allLessons"), icon: Compass },
  ]) : [];
  // ...
}

export function AppLayout({
  children,
  sidebarMode = "default",
}: {
  children: React.ReactNode;
  sidebarMode?: "default" | "hidden";
}) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [location] = useLocation();

  if (!user) {
    return <div className="min-h-[100dvh] flex flex-col"><TopNav /><main className="flex-1">{children}</main></div>;
  }

  const isTeacher = user.role === "teacher";
  const showSidebar = sidebarMode !== "hidden";

  const navItems = isTeacher ? [
    { href: "/teacher", label: t("teacher.dashboard"), icon: LayoutDashboard },
    { href: "/teacher/classes", label: t("teacher.classes"), icon: Users },
    { href: "/teacher/assignments", label: t("teacher.assignments"), icon: Settings },
  ] : [
    { href: "/student", label: t("student.dashboard"), icon: Map },
    { href: "/student/lessons", label: t("student.portal.allLessons"), icon: Compass },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <TopNav />
      <div
        className={cn(
          "flex-1 container mx-auto gap-6 p-4 md:py-8",
          showSidebar ? "flex flex-col md:flex-row" : "max-w-[1440px]",
        )}
      >
        {showSidebar && (
          <aside className="hidden md:block w-full md:w-64 shrink-0">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const active = location === item.href || (location.startsWith(item.href) && item.href !== "/teacher" && item.href !== "/student");
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl font-bold cursor-pointer transition-colors whitespace-nowrap",
                      active ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-accent hover:text-accent-foreground text-foreground",
                    )}>
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </aside>
        )}

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
```

```tsx
// src/App.tsx
<Route path="/student">
  {() => <AppLayout sidebarMode="hidden"><StudentDashboard /></AppLayout>}
</Route>
```

- [ ] **Step 3: Run the full verification set**

Run: `deno test src/lib/student-portal.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

Run: `npm run build`

Expected: PASS and emit the production bundle without TypeScript or Vite errors.

- [ ] **Step 4: Perform the manual smoke checks**

Run these flows in the local app:

```text
1. Log in as a student and confirm `/student` shows the 25% left rail and the 75% lesson world.
2. Confirm the old free-play hero is gone from `/student`.
3. Tap each right-side topic label and confirm it still opens `/student/lessons/:topic`.
4. Create or use a pending assignment and confirm the matching lesson is highlighted while the other lessons remain playable.
5. Visit `/student` on a mobile-width viewport and confirm the left rail stacks above the lesson world without clipping the legacy images.
6. Confirm `/student/lessons` and `/student/classes/:classId` still use the normal shell and retain the standard sidebar behavior.
7. Temporarily break one legacy image path in the browser dev tools or code and confirm the lesson row falls back to readable text instead of a broken layout.
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/useLanguage.tsx src/components/layout.tsx src/App.tsx
git commit -m "feat: apply student portal shell and copy"
```
