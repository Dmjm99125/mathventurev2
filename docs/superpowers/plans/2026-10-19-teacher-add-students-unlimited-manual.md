# Teacher Add Students: Unlimited Manual Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the teacher’s manual Add Students editor visibly and practically usable for any number of students in one batch, including batches larger than eight.

**Architecture:** Keep the existing row-based `TeacherAddStudentsManualEditor` and shared normalization path. Add a small pure count-label helper, then give the editor a min-height-safe flex layout with an independently scrollable row list and persistent actions. No backend, import, or workflow-state changes are required.

**Tech Stack:** React 19, TypeScript, Tailwind CSS utility classes, Deno tests with `@std/assert`, Vite.

## Global Constraints

- Preserve existing test coverage and do not use focused, skipped, or weakened tests.
- Use test-first development: write and run a failing test before each production change.
- Do not introduce a fixed row count, `slice`, or count-based guard for manual students.
- Preserve the existing Organic teacher visual system: earth-tone tokens, rounded cards, and clear hierarchy.
- Run the affected test first, then frontend typecheck, the full frontend test lane, and the production build.
- Preserve unrelated dirty-worktree changes and stage only files belonging to this feature.

---

### Task 1: Add a tested live student-count label

**Files:**
- Modify: `frontend/test/src/lib/teacher/add-students/index.test.ts`
- Modify: `frontend/src/lib/teacher/add-students/index.ts`

**Interfaces:**
- Consumes: the existing manual editor row array length.
- Produces: `formatTeacherAddStudentsCount(count: number): string`, returning singular copy for `1` and plural copy for every other non-negative row count.

- [ ] **Step 1: Write the failing test**

Add this import to the existing test import list:

```ts
formatTeacherAddStudentsCount,
```

Add this test to `frontend/test/src/lib/teacher/add-students/index.test.ts`:

```ts
Deno.test("formatTeacherAddStudentsCount describes one and larger manual batches", () => {
  assertEquals(formatTeacherAddStudentsCount(1), "1 student");
  assertEquals(formatTeacherAddStudentsCount(9), "9 students");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
npm test --prefix frontend -- --filter "formatTeacherAddStudentsCount describes one and larger manual batches"
```

Expected: the test fails because `formatTeacherAddStudentsCount` is not exported yet. Do not modify production code before observing this failure.

- [ ] **Step 3: Write the minimal implementation**

Add this function to `frontend/src/lib/teacher/add-students/index.ts` after the `TeacherAddStudentsResult` type:

```ts
export function formatTeacherAddStudentsCount(count: number): string {
  return `${count} student${count === 1 ? "" : "s"}`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run the same focused command:

```powershell
npm test --prefix frontend -- --filter "formatTeacherAddStudentsCount describes one and larger manual batches"
```

Expected: the new test passes with zero failures.

- [ ] **Step 5: Commit the tested helper**

```powershell
git add -- frontend/src/lib/teacher/add-students/index.ts frontend/test/src/lib/teacher/add-students/index.test.ts
git commit -m "feat: add teacher student count label"
```

---

### Task 2: Make the manual editor scroll-safe and visibly unbounded

**Files:**
- Create: `frontend/test/src/components/teacher-add-students-manual-editor.test.ts`
- Modify: `frontend/src/components/teacher/add-students/TeacherAddStudentsManualEditor.tsx`

**Interfaces:**
- Consumes: `formatTeacherAddStudentsCount`, the existing editable row state, and the existing `onBack`/`onContinue` callbacks.
- Produces: a manual editor whose row list scrolls independently while count, add, back, and review controls remain reachable.

- [ ] **Step 1: Write the failing layout regression test**

Create `frontend/test/src/components/teacher-add-students-manual-editor.test.ts` with:

```ts
import { assert } from "jsr:@std/assert";

const source = await Deno.readTextFile(
  new URL(
    "../../../src/components/teacher/add-students/TeacherAddStudentsManualEditor.tsx",
    import.meta.url,
  ),
);

Deno.test("manual add-students editor keeps long batches scrollable with persistent actions", () => {
  assert(source.includes("formatTeacherAddStudentsCount(rows.length)"));
  assert(source.includes('aria-live="polite"'));
  assert(source.includes("Add another student"));
  assert(source.includes("min-h-0 flex-1 space-y-4 overflow-y-auto"));
  assert(source.includes("border-t border-border/70"));
});
```

- [ ] **Step 2: Run the layout test to verify it fails**

Run:

```powershell
npm test --prefix frontend -- --filter "manual add-students editor keeps long batches scrollable with persistent actions"
```

Expected: the test fails because the current editor does not yet contain the live count, the new copy, or the internal scroll/footer layout.

- [ ] **Step 3: Implement the minimal editor layout change**

Update `TeacherAddStudentsManualEditor.tsx` as follows:

1. Import `formatTeacherAddStudentsCount` alongside `normalizeTeacherAddStudentRows`.
2. Change the outer `Card` to:

```tsx
<Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] p-5">
```

3. Wrap the existing `rows.map(...)` block in this scrollable region:

```tsx
<div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
  {rows.map((row) => (
    <div
      key={row.id}
      className="grid gap-3 rounded-2xl border border-border/70 p-4 md:grid-cols-[1fr_1fr_auto]"
    >
      <div className="space-y-2">
        <Label htmlFor={`last-name-${row.id}`}>Last Name</Label>
        <Input
          id={`last-name-${row.id}`}
          value={row.lastName}
          onChange={(event) =>
            setRows((current) =>
              current.map((item) =>
                item.id === row.id
                  ? { ...item, lastName: event.target.value }
                  : item,
              ),
            )
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`first-name-${row.id}`}>First Name</Label>
        <Input
          id={`first-name-${row.id}`}
          value={row.firstName}
          onChange={(event) =>
            setRows((current) =>
              current.map((item) =>
                item.id === row.id
                  ? { ...item, firstName: event.target.value }
                  : item,
              ),
            )
          }
        />
      </div>
      <div className="flex items-end">
        <Button
          variant="ghost"
          disabled={rows.length === 1}
          onClick={() =>
            setRows((current) =>
              current.filter((item) => item.id !== row.id),
            )
          }
        >
          Remove
        </Button>
      </div>
    </div>
  ))}
</div>
```

4. Keep the existing row update, remove, and validation behavior. Do not add a maximum or trim the rows array.
5. Replace the existing action section with this persistent footer, keeping the current callback bodies for `onBack`, row append, and review:

```tsx
{error && <p className="mt-4 text-sm font-bold text-destructive">{error}</p>}

<div className="mt-5 flex flex-col gap-3 border-t border-border/70 pt-5">
  <div className="flex items-center justify-between gap-3">
    <Button variant="ghost" onClick={onBack}>
      Back
    </Button>
    <p aria-live="polite" className="text-sm font-bold text-muted-foreground">
      {formatTeacherAddStudentsCount(rows.length)}
    </p>
  </div>
  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
    <Button
      variant="outline"
      onClick={() =>
        setRows((current) => [...current, createEditableRow()])
      }
    >
      Add another student
    </Button>
    <Button
      onClick={() => {
        try {
          setError(null);
          onContinue(normalizeTeacherAddStudentRows(rows));
        } catch (caught) {
          setError(
            caught instanceof Error
              ? caught.message
              : "We couldn't review those students yet.",
          );
        }
      }}
    >
      Review students
    </Button>
  </div>
</div>
```

Use the existing `Remove` button and `rows.length === 1` guard unchanged. The scroll region must be inside the card and the footer must be outside it so the footer remains visible for long lists.

- [ ] **Step 4: Run the focused tests to verify the change passes**

Run:

```powershell
npm test --prefix frontend -- --filter "formatTeacherAddStudentsCount|manual add-students editor keeps long batches scrollable with persistent actions"
```

Expected: both focused tests pass with zero failures.

Then run the existing related tests:

```powershell
npm test --prefix frontend -- --filter "teacher add-students|mobile add-students"
```

Expected: all matching add-students tests pass.

- [ ] **Step 5: Review the diff and commit the editor change**

Run:

```powershell
git diff --check
git diff -- frontend/src/components/teacher/add-students/TeacherAddStudentsManualEditor.tsx frontend/test/src/components/teacher-add-students-manual-editor.test.ts
```

Confirm the diff contains no fixed row limit, no import/backend changes, and no unrelated files. Then commit:

```powershell
git add -- frontend/src/components/teacher/add-students/TeacherAddStudentsManualEditor.tsx frontend/test/src/components/teacher-add-students-manual-editor.test.ts
git commit -m "feat: make manual student entry unbounded"
```

---

### Task 3: Run the complete frontend verification gate

**Files:**
- No source changes expected.

**Interfaces:**
- Consumes: the completed helper and manual editor changes from Tasks 1–2.
- Produces: fresh evidence for type safety, tests, and production build.

- [ ] **Step 1: Run frontend typecheck**

```powershell
npm run typecheck --prefix frontend
```

Expected: exit code 0 with no TypeScript errors.

- [ ] **Step 2: Run the full frontend test lane**

```powershell
npm test --prefix frontend
```

Expected: exit code 0 with all frontend tests passing within the repository’s 110-second lane target.

- [ ] **Step 3: Run the production build**

```powershell
npm run build --prefix frontend
```

Expected: exit code 0 and a completed Vite production build.

- [ ] **Step 4: Verify the final worktree scope**

```powershell
git status --short
git log -3 --oneline
```

Expected: the two feature commits are present, and unrelated pre-existing changes remain unstaged and unmodified.
