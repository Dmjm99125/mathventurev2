# Student Home and Classroom Shell Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the student home and classroom shell easier for kindergarten learners to understand and operate while preserving the fixed “Let’s Learn!” / “Tayo ay Matuto!” lesson header and all existing lesson/classroom data behavior.

**Architecture:** Add a reusable `StudentShell` presentation wrapper containing the two student destinations, then use it on both `StudentDashboard` and `StudentClassroomPage`. Keep existing hooks, portal summary helpers, lesson assets, routes, and quiz/game pages unchanged; move student-only visual tokens into scoped CSS so teacher screens are unaffected.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide icons, Wouter, Deno tests.

## Global Constraints

- Scope is limited to the student home/classroom shell; individual quiz and game screens remain unchanged.
- The existing “Let’s Learn!” and “Tayo ay Matuto!” illustrated header must remain visible, in the existing order, with image fallbacks preserved.
- Preserve current assignment filtering, lesson ordering, asset images, fallback labels, completion logic, navigation hrefs, assignment actions, and empty states.
- Do not invent progress or lesson data.
- Primary controls must be at least 48px tall/wide; status must use text/icon plus color; layouts must work at narrow mobile widths without horizontal scrolling.
- Run `npm run typecheck`, `npm test`, and `npm run build` before completion.

## File Map

- Create `src/components/student/StudentShell.tsx`: reusable student-only background, navigation, and content frame.
- Modify `src/lib/student/navigation.ts`: expose separate Lessons and Classroom navigation items and make active-state matching distinguish the two destinations.
- Modify `test/src/lib/student/navigation.test.ts`: lock the new item list and route matching behavior.
- Create `test/src/components/student/student-shell.test.ts`: source-contract checks for the shell's two destinations, active-state semantics, and scoped class hooks (the repository has no React DOM test harness).
- Modify `src/App.tsx`: render the classroom route without the generic desktop sidebar so the shared student shell owns student navigation.
- Modify `src/pages/student.tsx`: wrap both student pages in `StudentShell`, improve home/classroom hierarchy and status/action presentation without changing data flow.
- Modify `src/components/student/StudentPortalRail.tsx`: restyle the next action, classroom, and progress cards for readable kindergarten scanning.
- Modify `src/components/student/LegacyLessonMenu.tsx`: preserve both fixed bilingual header images while turning assigned lessons into larger trail stops with text status labels.
- Modify `src/components/student/StudentPortalLoading.tsx`: align loading presentation with the scoped student shell tokens.
- Modify `src/index.css`: add only `.student-shell` scoped Organic tokens, grain, focus, and reduced-motion rules.
- Modify `src/lib/i18n/useLanguage.tsx`: add only the navigation/status strings needed by the shell in English and Filipino.

### Task 1: Lock student navigation behavior

**Files:**
- Modify: `src/lib/student/navigation.ts`
- Test: `test/src/lib/student/navigation.test.ts`

**Interfaces:**
- Produces `STUDENT_NAV_ITEMS` with `{ href: '/student', labelKey: 'student.dashboard' }` and `{ href: '/student/classroom', labelKey: 'student.classroom' }`.
- Produces `isStudentNavActive(pathname: string, href: string): boolean` where lesson routes are active under Lessons, classroom is active only under Classroom, and teacher routes are false.

- [ ] **Step 1: Update the failing expectations first**

Add the classroom item assertion and change the route assertions so `/student/classroom` is false for `/student` and true for `/student/classroom`:

```ts
assertEquals(STUDENT_NAV_ITEMS, [
  { href: "/student", labelKey: "student.dashboard" },
  { href: "/student/classroom", labelKey: "student.classroom" },
]);

assertEquals(isStudentNavActive("/student", "/student"), true);
assertEquals(isStudentNavActive("/student/lessons/colors?classId=class-1", "/student"), true);
assertEquals(isStudentNavActive("/student/classroom", "/student"), false);
assertEquals(isStudentNavActive("/student/classroom", "/student/classroom"), true);
assertEquals(isStudentNavActive("/student/lessons/colors?returnTo=class", "/student/classroom"), false);
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `deno test --allow-read --allow-env --import-map=deno.json test/src/lib/student/navigation.test.ts`

Expected: FAIL because the existing item list only contains `/student` and treats classroom as part of the dashboard route.

- [ ] **Step 3: Implement the minimal route model**

Keep lesson matching on the dashboard item, but remove classroom from that branch and add an exact classroom branch:

```ts
export const STUDENT_NAV_ITEMS = [
  { href: "/student", labelKey: "student.dashboard" },
  { href: "/student/classroom", labelKey: "student.classroom" },
] as const;

export function isStudentNavActive(pathname: string, href: string): boolean {
  const cleanPath = pathname.split("?")[0].split("#")[0];

  if (href === "/student") {
    return cleanPath === "/student"
      || cleanPath === "/student/lessons"
      || cleanPath.startsWith("/student/lessons/");
  }

  if (href === "/student/classroom") {
    return cleanPath === "/student/classroom";
  }

  return cleanPath === href;
}
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `deno test --allow-read --allow-env --import-map=deno.json test/src/lib/student/navigation.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the navigation contract**

```bash
git add src/lib/student/navigation.ts test/src/lib/student/navigation.test.ts
git commit -m "feat: separate student lessons and classroom navigation"
```

### Task 2: Build the reusable student shell

**Files:**
- Create: `src/components/student/StudentShell.tsx`
- Test: `test/src/components/student/student-shell.test.ts`
- Modify: `src/lib/i18n/useLanguage.tsx`
- Modify: `src/index.css`

**Interfaces:**
- `StudentShell({ children, current }: { children: React.ReactNode; current: 'lessons' | 'classroom' })` renders the shared student background and navigation.
- Navigation links use `/student` and `/student/classroom`, `isStudentNavActive`, and `STUDENT_NAV_ITEMS` so the shell and mobile menu share one route model.

- [ ] **Step 1: Add the new translated labels**

Before creating the component, add the source-contract test at `test/src/components/student/student-shell.test.ts`:

```ts
import { assertEquals } from "jsr:@std/assert";

const source = await Deno.readTextFile(new URL("../../../../src/components/student/StudentShell.tsx", import.meta.url));

Deno.test("student shell exposes lessons and classroom destinations", () => {
  assertEquals(source.includes('href="/student"'), true);
  assertEquals(source.includes('href="/student/classroom"'), true);
  assertEquals(source.includes('aria-label="Student navigation"'), true);
});

Deno.test("student shell keeps its styling scoped to the student shell", () => {
  assertEquals(source.includes('className="student-shell'), true);
  assertEquals(source.includes('className="student-shell__nav'), true);
  assertEquals(source.includes('aria-current={active ? "page" : undefined}'), true);
});
```

- [ ] **Step 2: Run the new focused test and verify it fails**

Run: `deno test --allow-read --allow-env --import-map=deno.json test/src/components/student/student-shell.test.ts`

Expected: FAIL because `src/components/student/StudentShell.tsx` does not exist yet.

- [ ] **Step 3: Add the new translated labels**

Add `student.dashboard: 'Lessons'`, `student.classroom: 'Classroom'`, `student.backToLessons: 'Back to my lessons'`, `student.status.assigned: 'Assigned'`, and `student.status.finished: 'Finished'` to both English and Filipino dictionaries. Keep existing keys unchanged.

- [ ] **Step 4: Create the shell component**

Use Lucide `BookOpen`, `Users`, and `ArrowRight`; render a semantic `<nav aria-label="Student navigation">` with 48px-or-larger links. Use `Link` from `wouter` and a `current` prop for styling. The shell must not contain fabricated user/progress data.

```tsx
export function StudentShell({ children, current }: StudentShellProps) {
  const { t } = useLanguage();

  return (
    <div className="student-shell min-h-[100dvh]">
      <div className="student-shell__grain" aria-hidden="true" />
      <div className="mx-auto w-full max-w-[1440px] px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <nav className="student-shell__nav" aria-label="Student navigation">
          {STUDENT_NAV_ITEMS.map((item) => {
            const active = item.href === "/student"
              ? current === "lessons"
              : current === "classroom";
            const Icon = item.href === "/student" ? BookOpen : Users;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("student-shell__nav-link", active && "is-active")}
                aria-current={active ? "page" : undefined}
              >
                <Icon aria-hidden="true" />
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>
        <main>{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Add scoped Organic CSS**

Add `.student-shell` tokens using exactly `#E8DCC7`, `#8B9D83`, `#B08B6E`, `#C66B3D`, `#C08E3A`, and `#606C38`; use rounded 16–32px surfaces, a subtle repeating radial grain at 1–3%, visible focus rings, and a mobile-first nav grid. Do not change `body`, teacher classes, or shared quiz styles.

- [ ] **Step 6: Run the focused shell test and typecheck**

Run: `deno test --allow-read --allow-env --import-map=deno.json test/src/components/student/student-shell.test.ts` and `npm run typecheck`.

Expected: both PASS.

- [ ] **Step 7: Commit the shell unit**

```bash
git add src/components/student/StudentShell.tsx test/src/components/student/student-shell.test.ts src/lib/i18n/useLanguage.tsx src/index.css
git commit -m "feat: add kindergarten-friendly student shell"
```

### Task 3: Redesign the lesson trail while preserving the fixed header

**Files:**
- Modify: `src/components/student/LegacyLessonMenu.tsx`
- Modify: `src/components/student/StudentPortalRail.tsx`

**Interfaces:**
- `LegacyLessonMenu` keeps the current `topics`, `highlightedLessonId`, and `onSelect` props and continues to render `1let.png` followed by `1lets.png`.
- `StudentPortalRail` keeps the current summary/classroom/callback props and only changes presentation.

- [ ] **Step 1: Preserve the fixed bilingual header in the component structure**

Keep the existing `headerAssets` array, its map order, alt/fallback strings, and `onError` behavior. Wrap it in a stable rounded panel with a clear section heading only if the heading adds real information; do not replace the two images with text or move them below the lesson list.

- [ ] **Step 2: Restyle each lesson as a trail stop**

Keep the current `Button` click target and `topic.href`. Increase the minimum height to at least 72px on mobile and 80px on larger screens. Keep the numbered circle and lesson asset/fallback, then add a readable text status:

```tsx
<span className="student-trail-stop__status">
  {topic.isCompleted ? t("student.status.finished") : t("student.status.assigned")}
</span>
```

Use a text label in addition to the existing assigned/completed state; do not rely on the current small color dots. Keep highlighted assignment styling visually obvious with border/ring treatment.

- [ ] **Step 3: Restyle the rail cards**

Use short, high-contrast labels, larger value type, and one primary button in the next-assignment card. Keep `summary.nextAction.href`, `onOpenAssignment`, classroom callback, and all progress values unchanged. Add `aria-label`s where a card action would otherwise be unclear.

- [ ] **Step 4: Run the student navigation test and typecheck**

Run: `deno test --allow-read --allow-env --import-map=deno.json test/src/lib/student/navigation.test.ts` and `npm run typecheck`.

Expected: both PASS.

- [ ] **Step 5: Commit the lesson trail**

```bash
git add src/components/student/LegacyLessonMenu.tsx src/components/student/StudentPortalRail.tsx
git commit -m "feat: clarify student lesson trail and progress"
```

### Task 4: Apply the shell to home and classroom pages

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/student.tsx`
- Modify: `src/components/student/StudentPortalLoading.tsx`

**Interfaces:**
- Existing page exports and route paths stay unchanged.
- `StudentDashboard` uses `<StudentShell current="lessons">`.
- `StudentClassroomPage` uses `<StudentShell current="classroom">`.

- [ ] **Step 1: Change the classroom route to hidden generic sidebar mode**

Render `/student/classroom` with `<AppLayout sidebarMode="hidden">` so the student shell is the only student page navigation. Leave teacher routes and quiz routes unchanged.

- [ ] **Step 2: Wrap the dashboard**

Place the existing dashboard notice, rail, and `LegacyLessonMenu` inside `StudentShell`. Keep the `1bg.jpg` lesson backdrop if useful, but move its framing into the student-scoped palette and preserve the fixed bilingual header inside `LegacyLessonMenu`.

- [ ] **Step 3: Wrap and simplify classroom actions**

Place the existing classroom content inside `StudentShell`. Use the shared translated back label for the existing `/student` navigation action. Preserve post author/date/content, assignment name/lesson/status/score, and the current status-specific button labels and href construction. Keep the current no-classroom, no-post, and no-assignment messages.

- [ ] **Step 4: Align loading state**

Keep loading text and progress semantics but use the student shell Organic tokens, readable cards, and reduced-motion-safe animation. Do not add fake lesson counts or user data.

- [ ] **Step 5: Run page-focused checks**

Run: `npm run typecheck` and `npm run build`.

Expected: both PASS.

- [ ] **Step 6: Commit page integration**

```bash
git add src/App.tsx src/pages/student.tsx src/components/student/StudentPortalLoading.tsx
git commit -m "feat: apply student shell to lessons and classroom"
```

### Task 5: Full verification and visual review

**Files:**
- No new files.
- Review all student-shell files changed in Tasks 1–4.

- [ ] **Step 1: Run all local CI-equivalent checks**

```bash
npm run typecheck
npm test
npm run build
```

Expected: each command exits 0; no tests are skipped, focused, or weakened.

- [ ] **Step 2: Inspect the rendered home shell**

Run the dev server with `npm run dev`, open `/student`, and inspect desktop and narrow mobile widths. Confirm: Lessons and Classroom are obvious destinations; the fixed “Let’s Learn!” and “Tayo ay Matuto!” images remain present and ordered; assigned/finished text is readable; no horizontal scrolling occurs; and tap targets are large.

- [ ] **Step 3: Inspect the rendered classroom shell**

Open `/student/classroom` at the same widths. Confirm: the back-to-lessons action is obvious; announcement author/date/content remains visible; each quiz has one clear status-specific action; empty states remain understandable.

- [ ] **Step 4: Review scope boundaries**

Confirm teacher pages and quiz/game pages do not gain `.student-shell` styling or route changes. Confirm the working tree contains no unrelated modifications beyond the pre-existing untracked files.

- [ ] **Step 5: Commit any final verification-only fixes**

If visual review finds a scoped issue, make the smallest correction, rerun the affected check plus the full gate, and commit it with a message describing the correction. Do not alter unrelated files.
