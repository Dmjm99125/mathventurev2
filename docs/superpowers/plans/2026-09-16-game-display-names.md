# Game Display Names Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

Goal: Replace generated teacher-facing game labels with actual visible game names while preserving stored game IDs and report calculations.

Architecture: Keep GAME_CATALOG as the single source of display names. Give every topic/order slot an explicit title, resolve titles from the catalog in report builders, and pass resolved titles to recent-activity views and PDF models. Unknown historical rows fall back to their stable ID.

Tech Stack: React 19, TypeScript, Deno tests, Vite, jsPDF, jspdf-autotable, Supabase Edge Functions.

## Global Constraints

- Keep persisted and API-facing game IDs unchanged (colors:0, addition:13, and so on).
- Keep game order, game counts, scoring, completion calculations, and assignment behavior unchanged.
- Use the visible title/name presented by the game component as the display name.
- Do not refactor game components or change student-facing game screens.
- Unknown or malformed historical rows must fall back to the stable gameId without breaking report generation.
- Run targeted checks first, then npm test, npm run typecheck, and npm run build.

## File Map

- Modify src/lib/games/catalog.ts: explicit titles for all 80 existing catalog entries.
- Modify test/src/lib/games/catalog.test.ts: actual-title and generated-label regression coverage.
- Modify src/lib/teacher/reports/index.ts: resolve titles for recent-pass rows.
- Modify test/src/lib/teacher/reports/index.test.ts: known-title and unknown-ID fallback coverage.
- Modify src/components/teacher/reports/TeacherReportsRecentActivity.tsx: render recent-pass titles.
- Modify src/components/teacher/TeacherRecentActivity.tsx: render dashboard activity titles.
- Modify src/lib/teacher/reports/pdf.ts: expose and render classroom game-detail rows.
- Modify test/src/lib/teacher/reports/pdf.test.ts: classroom PDF title coverage.
- Modify test/src/lib/teacher/assigned-quizzes-pdf.test.ts: assigned-quiz PDF title coverage.

### Task 1: Add explicit actual names to the game catalog

Files:
- Modify: src/lib/games/catalog.ts
- Test: test/src/lib/games/catalog.test.ts

Interfaces:
- Consumes: existing GAME_COUNT_BY_TOPIC, TeacherTopicId, and getGameCatalogEntry().
- Produces: existing GameCatalogEntry.title, now a literal display name for every slot.

- [ ] Step 1: Write the failing catalog test

Add this test to test/src/lib/games/catalog.test.ts:

    Deno.test("GAME_CATALOG uses actual display names instead of generated topic labels", () => {
      assertEquals(GAME_CATALOG[0].title, "Color Matching Game");
      assertEquals(getGameCatalogEntry("addition", 13)?.title, "Magic Pizza Chef");
      assertEquals(GAME_CATALOG.at(-1)?.title, "What Time Is It?");
      assertEquals(
        GAME_CATALOG.some((entry) => entry.title === entry.topicId + "-" + (entry.gameOrder + 1)),
        false,
      );
    });

- [ ] Step 2: Verify the test fails for the intended reason

Run: npm test -- test/src/lib/games/catalog.test.ts

Expected: FAIL because current titles are colors-1, addition-14, and clock-7.

- [ ] Step 3: Implement the minimal catalog change

Add this exact table in src/lib/games/catalog.ts before GAME_CATALOG:

    const GAME_TITLES: Record<TeacherTopicId, readonly string[]> = {
      colors: ["Color Matching Game", "Balloon Finding Game", "Rainbow Color Catcher", "Rainbow Color Adventure Deluxe", "Rainbow Galaxy Explorer", "Choose Which Color", "Multiple Choice"],
      shapes: ["Shape Matching", "Find the Shape", "Monster Cafe", "Shape Matcher", "Shape Hunter", "Shape Racing", "Shape Wizard", "Hungry Dinosaur"],
      sequencing: ["Arrange Numbers", "Alphabet Express", "Size Sorter", "Shortest to Longest", "Smallest to Biggest Cake", "Surprise Sequencing", "Mega Animal & Vehicle Builder", "Pattern Academy", "Sandwich Maker"],
      addition: ["Addition Adventure", "Dice Addition Adventure", "Star Math", "Rainbow Addition Garden", "Addition Fun", "Count the Apples", "Fruit Pop Math", "Addition Adventure", "Addition Round 2", "Animal Safari", "Under the Sea", "Magic Carnival", "Ice Cream Shop", "Magic Pizza Chef", "Star Catcher"],
      subtraction: ["Balloon Pop Subtraction", "Fruit Subtraction", "Gentle Math Drift", "Subtraction Adventure", "Subtraction Pop", "Magical Dino Egg Hatchery", "Farmyard Hide & Seek", "Feed the Hippo", "Space Blast"],
      numbers: ["Drag the Correct Number", "Count & Match Adventure", "Animal Pop", "Feed the Hungry Monster", "Whack-a-Mole", "Deep Diver: Number Explorer", "The Magic Toy Factory", "Number Monster"],
      measurement: ["Slow & Fun Measurement", "Small & Short", "Heavy or Light?", "The Tiny Builder's Ruler", "Magic Rainbow Bridge", "Growing Inchworm"],
      comparison: ["Paghahambing ng Mahaba, Mas Mahaba, Pinakamahaba", "Pag-aayos ng Laki", "Marami o Kaunti?", "Mataas o Mababa?", "Match Big & Small Letters", "The Barnyard Balance", "The Sky Explorer", "The Mad Scientist's Liquid Lab", "Which is Longer?", "Heavy or Light?", "Catch & Measure!"],
      clock: ["Time Adventure", "Time Matcher", "Drag the Matching Clock", "Fill in the Missing Time", "Daily Routine Time", "Build the Clock", "What Time Is It?"],
    };

Change only the generated title expression to title: GAME_TITLES[topicId][gameOrder]. Keep the existing topic/order-based gameId expression and all count/order fields unchanged.

- [ ] Step 4: Verify catalog tests pass

Run: npm test -- test/src/lib/games/catalog.test.ts

Expected: PASS, including the existing 80-entry and count assertions and the new generated-label guard.

- [ ] Step 5: Commit the catalog change

    git add src/lib/games/catalog.ts test/src/lib/games/catalog.test.ts
    git commit -m "feat: add actual game display names"

### Task 2: Resolve titles in teacher report activity data and UI

Files:
- Modify: src/lib/teacher/reports/index.ts
- Modify: src/components/teacher/reports/TeacherReportsRecentActivity.tsx
- Modify: src/components/teacher/TeacherRecentActivity.tsx
- Test: test/src/lib/teacher/reports/index.test.ts

Interfaces:
- Consumes: TeacherReportGameResultRecord and getGameCatalogEntry(topicId, gameOrder).
- Produces: gameTitle: string on recent-pass rows; known rows use catalog titles and unknown rows use gameId.

- [ ] Step 1: Write the failing report test

In test/src/lib/teacher/reports/index.test.ts, assert a known recent pass contains gameTitle: "Shape Matching". Add a passed result with gameId: "colors:99", gameOrder: 99, and a later completion time, then assert:

    assertEquals(overview.recentActivity.recentPasses[0].gameTitle, "colors:99");
    assertEquals(overview.recentActivity.recentPasses[1].gameTitle, "Shape Matching");

- [ ] Step 2: Verify the report test fails

Run: npm test -- test/src/lib/teacher/reports/index.test.ts

Expected: FAIL because recent-pass rows currently have no gameTitle property.

- [ ] Step 3: Implement title resolution

Add gameTitle: string to the recent-pass row types in both TeacherReportsOverviewPayload and TeacherSingleClassroomReportPayload. In buildTeacherReportsOverview(), resolve each row with:

    const catalogEntry = getGameCatalogEntry(row.topicId, row.gameOrder);
    return {
      studentId: row.studentId,
      fullName: studentByClassKey.get(row.classId + ":" + row.studentId)?.fullName ?? "Student",
      classId: row.classId,
      className: studentByClassKey.get(row.classId + ":" + row.studentId)?.className ?? "Class",
      gameId: row.gameId,
      gameTitle: catalogEntry?.title ?? row.gameId,
      completedAt: row.completedAt,
      scorePct: row.scorePct,
    };

Copy gameTitle through the buildTeacherSingleClassroomReport() recent-pass mapping. Do not change IDs or sorting.

- [ ] Step 4: Render the new title property

In both activity components, replace the raw ID with:

    <p className="text-sm font-semibold text-[var(--teacher-ink)]/65">
      Completed {pass.gameTitle}
    </p>

Keep gameId in each React key.

- [ ] Step 5: Verify report tests pass

Run: npm test -- test/src/lib/teacher/reports/index.test.ts

Expected: PASS with actual names for known games and stable-ID fallback for the unknown row.

- [ ] Step 6: Commit the report activity change

    git add src/lib/teacher/reports/index.ts src/components/teacher/reports/TeacherReportsRecentActivity.tsx src/components/teacher/TeacherRecentActivity.tsx test/src/lib/teacher/reports/index.test.ts
    git commit -m "feat: show game names in teacher activity"

### Task 3: Put actual game names in classroom and assigned-quiz PDF models

Files:
- Modify: src/lib/teacher/reports/pdf.ts
- Test: test/src/lib/teacher/reports/pdf.test.ts
- Test: test/src/lib/teacher/assigned-quizzes-pdf.test.ts

Interfaces:
- Consumes: TeacherSingleClassroomReportPayload.topicBreakdown[].games[].title and GAME_CATALOG[].title.
- Produces: TeacherClassReportPdfModel.gameRows and PDF tables whose game-title cells contain actual names.

- [ ] Step 1: Write failing PDF assertions

Change the assigned-quiz PDF test’s first two expected title cells to "Addition Adventure" and "Dice Addition Adventure". Add this classroom PDF assertion:

    assertEquals(model.gameRows[0], [
      "colors",
      "Color Matching Game",
      "100%",
      "1",
      "1",
      "2026-07-28",
    ]);

- [ ] Step 2: Verify the PDF tests fail

Run: npm test -- test/src/lib/teacher/assigned-quizzes-pdf.test.ts test/src/lib/teacher/reports/pdf.test.ts

Expected: FAIL because assigned-quiz rows still use generated labels and the classroom PDF model has no gameRows.

- [ ] Step 3: Add classroom game rows to the model

Add gameRows: string[][] to TeacherClassReportPdfModel, then build it in buildTeacherClassReportPdfModel() with:

    gameRows: report.topicBreakdown.flatMap((topic) =>
      topic.games.map((game) => [
        topic.topicId,
        game.title,
        formatPct(game.averageScorePct),
        String(game.passCount),
        String(game.attemptCount),
        formatDate(game.lastPlayedAt),
      ])
    ),

Do not modify assigned-quiz PDF title lookup; it already consumes GAME_CATALOG[].title from Task 1.

- [ ] Step 4: Render classroom game rows in the PDF

After the current topic table in downloadTeacherClassReportPdf(), render:

    autoTable(pdf, {
      startY: previousTable.lastAutoTable?.finalY
        ? previousTable.lastAutoTable.finalY + 24
        : 320,
      head: [["Topic", "Game", "Avg Score", "Passes", "Attempts", "Last Played"]],
      body: model.gameRows,
    });

Use game.title, never game.gameId, in the game column.

- [ ] Step 5: Verify PDF tests pass

Run: npm test -- test/src/lib/teacher/assigned-quizzes-pdf.test.ts test/src/lib/teacher/reports/pdf.test.ts

Expected: PASS with actual names in both PDF models.

- [ ] Step 6: Commit the PDF change

    git add src/lib/teacher/reports/pdf.ts test/src/lib/teacher/reports/pdf.test.ts test/src/lib/teacher/assigned-quizzes-pdf.test.ts
    git commit -m "feat: include game names in teacher PDFs"

### Task 4: Run the complete verification gate

Files:
- No source changes expected; fix only regressions in files already listed above.

Interfaces:
- Consumes: Tasks 1–3.
- Produces: fresh local evidence for the repository test, typecheck, and build gates.

- [ ] Step 1: Run the complete test suite

Run: npm test

Expected: PASS with no skipped, focused, swallowed, or weakened tests.

- [ ] Step 2: Run TypeScript validation

Run: npm run typecheck

Expected: exit code 0 with no type errors.

- [ ] Step 3: Run the production build

Run: npm run build

Expected: exit code 0 and a successful Vite production build.

- [ ] Step 4: Inspect the final diff and worktree

Run:

    git diff HEAD~3..HEAD --stat
    git status --short

Confirm only catalog, report activity, PDF, tests, and approved spec/plan documents are part of this work. Preserve the pre-existing .tmp-shape-matching-build/, dev-dist/, and unrelated plan files.
