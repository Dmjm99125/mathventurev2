# Teacher Assigned Quizzes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dropdown-controlled Quizzes Assigned view to the teacher classroom workspace with quiz-level, student-level, and per-game score drill-downs.

**Architecture:** Keep the existing teacher classroom route and roster API. Join assignment metadata from `useAssignments(classroom.id)` with the roster's existing assignment score objects in a focused pure helper, then render the result in a dedicated `TeacherAssignedQuizzes` component. Replace the current tab button group in `TeacherWorkspacePage` with Radix Select while preserving Student List and Student Progress behavior.

**Tech Stack:** React 19, TypeScript, TanStack Query, Radix Select, Tailwind CSS, Deno tests.

## Global Constraints

- The selected view defaults to **Student List**.
- Options are **Student List**, **Student Progress**, and **Quizzes Assigned**.
- No new route, backend endpoint, or schema change is required.
- Class-wide assignments include all current classroom students; directly targeted assignments include only the targeted student.
- Missing assignment score records remain visible as not started with null score values.
- Keep one quiz and one student detail expansion active at a time.
- The existing mobile hamburger navigation is unaffected.
- The feature must finish in no more than four commits total; the spec and plan are already separate commits, so implementation and tests share one final feature commit.

## File Map

- Create `src/lib/teacher/assigned-quizzes.ts`: pure assignment-to-roster aggregation types and function.
- Create `src/components/teacher/TeacherAssignedQuizzes.tsx`: accessible nested quiz/student/per-game UI and empty/error states.
- Modify `src/pages/teacher.tsx`: load assignment metadata, replace tabs with Select, and render the new view.
- Create `test/src/lib/teacher/assigned-quizzes.test.ts`: aggregation behavior tests.
- Create `test/src/components/teacher-assigned-quizzes.test.ts`: source-level assertions for the new component contract.
- Modify `test/src/pages/teacher-assignment.test.ts`: source-level assertions for dropdown options/default, query wiring, and view rendering.

## Implementation Tasks

### Task 1: Add the assignment/roster aggregation helper

**Files:**
- Create: `src/lib/teacher/assigned-quizzes.ts`
- Test: `test/src/lib/teacher/assigned-quizzes.test.ts`

**Interfaces:**
- Consumes: `AssignmentForTeacher`, `AssignmentQuizStatus`, `TeacherAssignmentScore`, and `TeacherClassStudent` from `src/lib/api/client.ts`.
- Produces: `TeacherAssignedQuizStudent`, `TeacherAssignedQuiz`, and `buildTeacherAssignedQuizzes(assignments, students)` for the page and component.

- [ ] **Step 1: Write the failing aggregation tests**

Create fixtures with two students and two assignments. Assert that a class-wide assignment produces both students, a missing roster score becomes `not_started` with null score fields and an empty game-score list, a matching roster assignment preserves overall/per-game results, and a targeted assignment produces only its target student.

```ts
import { assertEquals } from "jsr:@std/assert";
import type { AssignmentForTeacher, TeacherClassStudent } from "../../../src/lib/api/client";
import { buildTeacherAssignedQuizzes } from "../../../src/lib/teacher/assigned-quizzes";

const students: TeacherClassStudent[] = [
  {
    id: "student-1", fullName: "Ada Lovelace", firstName: "Ada", lastName: "Lovelace",
    joinedAt: "2026-08-01T00:00:00Z", appCompletionPct: 50, lastPlayedPct: 80,
    overallScore: 8, overallMaxScore: 10, overallScorePct: 80, gameScores: [],
    assignments: [{
      assignmentId: "quiz-1", name: "Addition Check", lessonId: "addition",
      dueAt: null, createdAt: "2026-08-20T00:00:00Z", status: "completed",
      overallScore: 8, overallMaxScore: 10, overallScorePct: 80,
      gameScores: [{ gameId: "addition", score: 8, maxScore: 10, scorePct: 80, completedAt: "2026-08-21T00:00:00Z" }],
    }],
  },
  {
    id: "student-2", fullName: "Grace Hopper", firstName: "Grace", lastName: "Hopper",
    joinedAt: "2026-08-02T00:00:00Z", appCompletionPct: null, lastPlayedPct: null,
    overallScore: null, overallMaxScore: null, overallScorePct: null, gameScores: [], assignments: [],
  },
];

const classAssignment: AssignmentForTeacher = {
  id: "quiz-1", name: "Addition Check", lessonId: "addition", classId: "class-1",
  className: "Room 1", studentId: null, dueAt: null, createdAt: "2026-08-20T00:00:00Z",
};

Deno.test("joins class assignments to scored and unstarted students", () => {
  const [quiz] = buildTeacherAssignedQuizzes([classAssignment], students);

  assertEquals(quiz.students.map((student) => student.id), ["student-1", "student-2"]);
  assertEquals(quiz.students[0].overallScorePct, 80);
  assertEquals(quiz.students[0].gameScores[0].gameId, "addition");
  assertEquals(quiz.students[1].status, "not_started");
  assertEquals(quiz.students[1].overallScore, null);
  assertEquals(quiz.students[1].gameScores, []);
});

Deno.test("limits directly targeted assignments to the target student", () => {
  const targeted = { ...classAssignment, id: "quiz-2", classId: null, studentId: "student-2" };

  assertEquals(buildTeacherAssignedQuizzes([targeted], students)[0].students.map((student) => student.id), ["student-2"]);
});
```

- [ ] **Step 2: Run the helper tests and confirm they fail**

Run: `deno test --allow-read test/src/lib/teacher/assigned-quizzes.test.ts`

Expected: FAIL because `src/lib/teacher/assigned-quizzes.ts` and `buildTeacherAssignedQuizzes` do not exist yet.

- [ ] **Step 3: Implement the minimal typed join**

Define the exported view models as follows:

```ts
export type TeacherAssignedQuizStudent = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string | null;
  status: AssignmentQuizStatus;
  overallScore: number | null;
  overallMaxScore: number | null;
  overallScorePct: number | null;
  gameScores: TeacherGameScore[];
};

export type TeacherAssignedQuiz = {
  assignment: AssignmentForTeacher;
  students: TeacherAssignedQuizStudent[];
};

export function buildTeacherAssignedQuizzes(
  assignments: AssignmentForTeacher[],
  students: TeacherClassStudent[],
): TeacherAssignedQuiz[]
```

For each assignment, filter students to `assignment.studentId === null || assignment.studentId === student.id`. Find the matching `student.assignments` entry by `assignmentId`. Use the matching score fields when present; otherwise return `status: 'not_started'`, null overall score values, and `gameScores: []`. Preserve the input assignment order and current roster order.

- [ ] **Step 4: Run the helper tests and confirm they pass**

Run: `deno test --allow-read test/src/lib/teacher/assigned-quizzes.test.ts`

Expected: 2 tests pass.

### Task 2: Build the nested Quizzes Assigned component

**Files:**
- Create: `src/components/teacher/TeacherAssignedQuizzes.tsx`
- Test: `test/src/components/teacher-assigned-quizzes.test.ts`

**Interfaces:**
- Consumes: `TeacherAssignedQuiz[]`, an optional `Error`, and a retry callback.
- Produces: an accessible assignment-card list with nested student rows and per-game score grids.

- [ ] **Step 1: Write source-level component assertions**

Assert the component source contains the approved progressive-disclosure contract: `expandedAssignmentId`, `expandedStudentId`, `aria-expanded`, `View games`, `GAME_CATALOG`, assignment metadata labels, the no-assignment empty state, and the retry button.

```ts
import { assertEquals } from "jsr:@std/assert";

const source = await Deno.readTextFile(new URL("../../../src/components/teacher/TeacherAssignedQuizzes.tsx", import.meta.url));

Deno.test("assigned quizzes exposes nested score drill-down", () => {
  for (const required of [
    "expandedAssignmentId", "expandedStudentId", "aria-expanded", "View games",
    "GAME_CATALOG", "assigned", "due", "Try again", "No quizzes have been assigned",
  ]) {
    assertEquals(source.includes(required), true, `missing ${required}`);
  }
});
```

- [ ] **Step 2: Run the component test and confirm it fails**

Run: `deno test --allow-read test/src/components/teacher-assigned-quizzes.test.ts`

Expected: FAIL because the component file does not exist yet.

- [ ] **Step 3: Implement the component**

Use `useState<string | null>` for one expanded assignment and one expanded student. Render an assignment header button with `aria-expanded` and `aria-controls`; when opened, render a horizontally scrollable table with last name, first name, overall score, status, and a View games button. When a student is opened, render `GAME_CATALOG` cards using a `Map` of `gameScores` and `--` for missing scores. Clear the student expansion whenever the assignment expansion changes.

Add formatting helpers:

```ts
function formatScore(score: number | null, maxScore: number | null, scorePct: number | null) {
  return score == null || maxScore == null || scorePct == null
    ? '--'
    : `${score} / ${maxScore} (${scorePct}%)`;
}

function formatStatus(status: AssignmentQuizStatus) {
  return status === 'not_started' ? 'Not started' : status === 'in_progress' ? 'In progress' : 'Completed';
}
```

Show assignment name with `lessonId` fallback, assigned date, due date or `No due date`, and a summary derived only from the joined students: `${completedCount}/${students.length} completed` plus the started count when applicable. If `error` is provided, render a `role="alert"` card with the error message and a `Try again` button calling `onRetry`. If there are no assignments, render the approved no-assignment message.

- [ ] **Step 4: Run the component test and confirm it passes**

Run: `deno test --allow-read test/src/components/teacher-assigned-quizzes.test.ts`

Expected: 1 test passes.

### Task 3: Wire the dropdown and data query into the teacher page

**Files:**
- Modify: `src/pages/teacher.tsx`
- Modify: `test/src/pages/teacher-assignment.test.ts`

**Interfaces:**
- Consumes: `useAssignments`, `buildTeacherAssignedQuizzes`, `TeacherAssignedQuizzes`, and the existing classroom/roster queries.
- Produces: the default Student List dropdown with all three view options and the Quizzes Assigned rendering path.

- [ ] **Step 1: Extend the page source assertions**

Add a test that asserts the teacher page imports/uses `useAssignments`, `TeacherAssignedQuizzes`, `Select`, all three option labels, the default `students` state, assignment loading, the assignment error, and `refetch`.

```ts
Deno.test("teacher classroom exposes the assigned quizzes view selector", () => {
  for (const required of [
    "useAssignments", "TeacherAssignedQuizzes", "Select", "Student List",
    "Student Progress", "Quizzes Assigned", "useState<'students' | 'progress' | 'assignments'>('students')",
    "assignmentsLoading", "assignmentsError", "refetch",
  ]) {
    assertStringIncludes(teacherPage, required);
  }
});
```

- [ ] **Step 2: Run the page test and confirm it fails**

Run: `deno test --allow-read test/src/pages/teacher-assignment.test.ts`

Expected: the existing assign flow test passes, and the new selector test fails because the page still has the old tab buttons.

- [ ] **Step 3: Replace tabs and wire assignment data**

Import the Select primitives and `TeacherAssignedQuizzes` plus `useAssignments` and the aggregation helper. Add:

```ts
const { data: assignmentsData, isLoading: assignmentsLoading, error: assignmentsError, refetch } = useAssignments(classroom?.id);
const [activeTab, setActiveTab] = useState<'students' | 'progress' | 'assignments'>('students');
```

Call the hook unconditionally with `classroom?.id`; pass only teacher-shaped assignment records (`'className' in assignment`) to `buildTeacherAssignedQuizzes`. Include `assignmentsLoading` in the existing loading guard. Replace the bordered Button group with a labeled Radix Select whose values are `students`, `progress`, and `assignments`. Render the existing list/progress components unchanged for their values and render `TeacherAssignedQuizzes` for `assignments`, passing `assignments`, `assignmentsError as Error | null`, and `() => { void refetch(); }`.

- [ ] **Step 4: Run the page test and typecheck**

Run: `deno test --allow-read test/src/pages/teacher-assignment.test.ts` and `npm.cmd run typecheck`

Expected: all page tests pass and TypeScript reports no errors.

### Task 4: Full verification and single implementation commit

**Files:**
- Verify: `src/lib/teacher/assigned-quizzes.ts`
- Verify: `src/components/teacher/TeacherAssignedQuizzes.tsx`
- Verify: `src/pages/teacher.tsx`
- Verify: the three focused test files from Tasks 1–3

- [ ] **Step 1: Run focused teacher tests**

Run: `deno test --allow-read test/src/lib/teacher/assigned-quizzes.test.ts test/src/components/teacher-assigned-quizzes.test.ts test/src/pages/teacher-assignment.test.ts test/src/components/teacher-student-progress-table.test.ts`

Expected: all focused tests pass.

- [ ] **Step 2: Run the full repository test suite with required read access**

Run: `deno test --allow-read test`

Expected: all feature-relevant tests pass. Record any unrelated pre-existing failures without changing unrelated files.

- [ ] **Step 3: Build the application**

Run: `npm.cmd run build`

Expected: Vite production build completes successfully; existing non-fatal bundle/font warnings may remain.

- [ ] **Step 4: Check the diff and commit the implementation**

Run: `git diff --check; git status --short`

Confirm only the planned source/test files are staged and leave the unrelated `.tmp-shape-matching-build/` directory untouched. Then run:

```bash
git add src/pages/teacher.tsx src/lib/teacher/assigned-quizzes.ts src/components/teacher/TeacherAssignedQuizzes.tsx test/src/lib/teacher/assigned-quizzes.test.ts test/src/components/teacher-assigned-quizzes.test.ts test/src/pages/teacher-assignment.test.ts
git commit -m "feat: add teacher assigned quizzes view"
```

Expected: one implementation commit, keeping the feature at three total commits including the spec and plan commits.

## Self-Review

- Spec coverage: navigation is covered by Task 3; nested quiz/student/game disclosure, metadata, statuses, and empty/error states by Task 2; data-source joining and targeted/class-wide behavior by Task 1; loading and verification by Tasks 3–4.
- Placeholder scan: the plan contains concrete paths, signatures, code snippets, commands, and expected outcomes; no TODO/TBD implementation steps are used.
- Type consistency: Task 1 exports `TeacherAssignedQuiz` and `TeacherAssignedQuizStudent`; Task 2 consumes `TeacherAssignedQuiz[]`; Task 3 consumes the helper and component. The page's assignment union is narrowed before aggregation.
