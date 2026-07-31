# Single Teacher Classroom Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn MathVenture into a single-classroom product where each teacher owns exactly one hidden classroom, class codes disappear, and teacher/student flows no longer expose multi-class UI.

**Architecture:** Keep `public.classes` and `public.class_students` as hidden plumbing, but enforce a strict one-row-per-teacher invariant with a new migration and shared singleton helper. Refactor auth, edge functions, and frontend routes to resolve the backing classroom server-side, then collapse the teacher workspace, student classroom, and reports onto single-classroom destinations without exposing class names or join codes.

**Tech Stack:** React 19, TypeScript, Wouter, TanStack React Query, Tailwind CSS 4, Supabase Edge Functions (Deno), PostgreSQL migrations, Deno tests, Vite, `tsc`

## Global Constraints

- Each teacher must end up with exactly one classroom row.
- The classroom row must not be user-created, user-selected, or user-renamed in the product.
- No user-facing flow may require or display a class code.
- No user-facing flow may require or display a class name.
- Teacher-facing pages should refer to the space generically as the teacher's classroom, workspace, roster, or reports.
- Student self-registration must accept teacher first name instead of class code.
- Teacher pre-provisioning must remain supported.
- Existing `class_id` foreign-key relationships should remain valid after the refactor.
- Any schema work must be added in a new PostgreSQL migration file and must not rewrite prior migrations.

---

## File Structure

- Create: `supabase/migrations/0009_single_teacher_class.sql`
  Responsibility: enforce the one-teacher-one-class invariant, backfill missing hidden classrooms, and remove the database-level requirement that new classrooms carry visible join codes.
- Create: `supabase/functions/_shared/teacher_singleton_class.ts`
  Responsibility: centralize `ensureTeacherSingletonClass()` and `getTeacherSingletonClass()` so every backend flow resolves the same hidden classroom rule.
- Create: `supabase/functions/_shared/teacher_singleton_class_test.ts`
  Responsibility: prove singleton creation, singleton reads, and duplicate-class failure behavior.
- Modify: `supabase/functions/_shared/student_auth.ts`
  Responsibility: add teacher-first-name normalization next to the existing student-name helpers.
- Modify: `supabase/functions/_shared/hidden_student_provision.ts`
  Responsibility: keep hidden student provisioning reusable while teacher-scoping identity resolution in the calling handlers.
- Modify: `supabase/functions/_shared/hidden_student_provision_test.ts`
  Responsibility: preserve the provisioning contract while the auth handlers change around it.
- Modify: `supabase/functions/student-register/handler.ts`
  Responsibility: replace class-code registration with teacher-first-name classroom resolution and pre-provisioned-student reuse.
- Modify: `supabase/functions/student-register/handler_test.ts`
  Responsibility: cover teacher-first-name resolution, pre-provisioned student reuse, and new hidden-student creation.
- Modify: `supabase/functions/student-login/handler.ts`
  Responsibility: scope student sign-in to teacher first name plus student first/last name.
- Modify: `supabase/functions/student-login/handler_test.ts`
  Responsibility: cover invalid teacher, ambiguous teacher, invalid student, and successful teacher-scoped login.
- Create: `supabase/functions/classes-list/handler.ts`
  Responsibility: replace the array-style classroom response with a singleton classroom response for both teachers and students.
- Create: `supabase/functions/classes-list/handler_test.ts`
  Responsibility: prove teacher and student classroom responses are singleton-shaped and hide join codes.
- Modify: `supabase/functions/classes-list/index.ts`
  Responsibility: become a thin entrypoint for the new handler.
- Modify: `supabase/functions/classes-roster/handler.ts`
  Responsibility: infer the teacher classroom automatically instead of requiring `classId`.
- Modify: `supabase/functions/classes-roster/handler_test.ts`
  Responsibility: prove roster loading no longer depends on a chosen class id.
- Modify: `supabase/functions/classes-add-students/handler.ts`
  Responsibility: infer the teacher classroom automatically and remove `classId` from the public request contract.
- Modify: `supabase/functions/classes-add-students/handler_test.ts`
  Responsibility: prove teacher add-students succeeds without a class id and still preserves all-or-nothing behavior.
- Modify: `supabase/functions/classes-remove-student/handler.ts`
  Responsibility: infer the teacher classroom automatically and remove `classId` from the public request contract.
- Modify: `supabase/functions/classes-remove-student/handler_test.ts`
  Responsibility: prove classroom membership removal succeeds without a chosen class id.
- Create: `supabase/functions/classes-create/handler.ts`
  Responsibility: harden the old endpoint so it returns the existing singleton classroom instead of creating a second classroom.
- Create: `supabase/functions/classes-create/handler_test.ts`
  Responsibility: prove duplicate classroom creation is blocked by returning the singleton classroom payload.
- Modify: `supabase/functions/classes-create/index.ts`
  Responsibility: become a thin entrypoint for the new handler.
- Create: `supabase/functions/classes-join/handler.ts`
  Responsibility: harden the old endpoint so it returns a clear `410` style “class codes are no longer supported” response.
- Create: `supabase/functions/classes-join/handler_test.ts`
  Responsibility: prove the compatibility endpoint fails closed with the deprecation message.
- Modify: `supabase/functions/classes-join/index.ts`
  Responsibility: become a thin entrypoint for the new handler.
- Modify: `supabase/functions/attempts-submit/handler.ts`
  Responsibility: infer the student classroom automatically when no `classId` is supplied.
- Modify: `supabase/functions/attempts-submit/handler_test.ts`
  Responsibility: prove classroom inference works for free-play attempts and still rejects mismatches.
- Modify: `src/lib/api.ts`
  Responsibility: replace array-style classroom contracts and remove join-code fields from public client types.
- Modify: `src/lib/hooks.ts`
  Responsibility: expose singleton classroom hooks plus roster and mutation hooks that no longer require chosen class ids.
- Modify: `src/lib/auth.ts`
  Responsibility: send `teacherFirstName` for student login and registration.
- Modify: `src/lib/student-auth.ts`
  Responsibility: simplify the student auth response contract now that register reuses pre-provisioned students instead of returning `already_registered`.
- Modify: `src/lib/student-auth.test.ts`
  Responsibility: keep the student auth response helpers aligned with the new session-only register contract.
- Modify: `src/lib/useLanguage.tsx`
  Responsibility: replace class-code labels and copy with teacher-first-name copy.
- Modify: `src/pages/auth.tsx`
  Responsibility: add teacher-first-name fields to student login/signup and remove class-code fields.
- Modify: `src/lib/teacher-add-students.ts`
  Responsibility: remove class-name assumptions from the add-students result type.
- Modify: `src/components/teacher/add-students/TeacherAddStudentsDialog.tsx`
  Responsibility: submit singleton-classroom student creation without receiving a `classId` prop.
- Modify: `src/components/teacher/add-students/TeacherAddStudentsResultStep.tsx`
  Responsibility: show a generic classroom success message instead of a class-name success message.
- Modify: `src/App.tsx`
  Responsibility: collapse teacher routes to `/teacher` and `/teacher/reports`, add `/student/classroom`, and redirect legacy class-id routes.
- Modify: `src/pages/teacher.tsx`
  Responsibility: replace the class-list home with a singleton classroom workspace and later host the single-classroom reports page.
- Modify: `src/lib/teacher-nav.ts`
  Responsibility: keep the teacher rail active for the new singleton route model.
- Modify: `src/lib/teacher-nav.test.ts`
  Responsibility: prove the teacher rail remains active on `/teacher`, `/teacher/reports`, and the legacy redirects.
- Modify: `src/pages/student.tsx`
  Responsibility: remove join-code UI, route the student to one classroom page, and load classroom context from the singleton response.
- Modify: `src/components/student/StudentPortalRail.tsx`
  Responsibility: remove class-join controls and multi-class copy from the student rail.
- Modify: `src/lib/student-portal.ts`
  Responsibility: stop treating classes as a visible list, update lesson-exit routes, and keep hidden classroom attribution optional.
- Modify: `src/lib/student-portal.test.ts`
  Responsibility: prove lesson links, exit links, and rail summaries use `/student/classroom` instead of `/student/classes/:classId`.
- Modify: `src/lib/student-nav.ts`
  Responsibility: keep the student rail active on `/student/classroom`.
- Modify: `src/lib/student-nav.test.ts`
  Responsibility: prove `/student/classroom` and lesson routes still highlight the student destination.
- Modify: `src/lib/teacher-reports.ts`
  Responsibility: reshape reporting from cross-class comparison into one-classroom summary plus student/topic breakdowns.
- Modify: `src/lib/teacher-reports.test.ts`
  Responsibility: prove single-classroom summary, attention rules, recent activity, and student/topic breakdowns.
- Modify: `src/lib/teacher-reports-pdf.ts`
  Responsibility: export the new one-classroom report without class names or join codes.
- Modify: `src/lib/teacher-reports-pdf.test.ts`
  Responsibility: prove the PDF header and table content reflect the single-classroom payload.
- Modify: `supabase/functions/_shared/teacher_reports.ts`
  Responsibility: load only the teacher singleton classroom and return one-classroom datasets.
- Modify: `supabase/functions/reports-overview/handler.ts`
  Responsibility: return the single-classroom reports payload for `/teacher/reports`.
- Modify: `supabase/functions/reports-overview/handler_test.ts`
  Responsibility: prove `/teacher/reports` returns one-classroom data instead of cross-class comparison rows.
- Modify: `supabase/functions/reports-class/handler.ts`
  Responsibility: keep the compatibility endpoint validating the singleton class and returning the same one-classroom payload.
- Modify: `supabase/functions/reports-class/handler_test.ts`
  Responsibility: prove legacy class-id report requests only work for the singleton classroom and otherwise fail safely.
- Create: `src/components/teacher/reports/TeacherReportsClassroomSummary.tsx`
  Responsibility: replace the old cross-class comparison card with a single-classroom summary card.
- Modify: `src/components/teacher/reports/TeacherReportsAttentionList.tsx`
  Responsibility: remove class-link wording that assumes cross-class drill-down.
- Modify: `src/components/teacher/reports/TeacherReportsRecentActivity.tsx`
  Responsibility: stop rendering quiet/active class lists and instead summarize recent classroom activity.
- Modify: `src/components/teacher/reports/TeacherClassReportStudentTable.tsx`
  Responsibility: continue rendering the detailed student table inside `/teacher/reports`.
- Modify: `src/components/teacher/reports/TeacherClassReportTopicBreakdown.tsx`
  Responsibility: continue rendering topic/game breakdown inside `/teacher/reports`.
- Modify: `src/components/teacher/reports/TeacherClassReportPdfButton.tsx`
  Responsibility: export the new one-classroom report payload and preserve honest empty states.

### Task 1: Singleton Schema And Shared Classroom Helpers

**Files:**
- Create: `supabase/migrations/0009_single_teacher_class.sql`
- Create: `supabase/functions/_shared/teacher_singleton_class.ts`
- Create: `supabase/functions/_shared/teacher_singleton_class_test.ts`

**Interfaces:**
- Consumes: none
- Produces: `type TeacherSingletonClass = { id: string; teacherId: string; name: string; createdAt: string }`
- Produces: `type TeacherSingletonClassPersistence = { listTeacherClasses(teacherId: string): Promise<TeacherSingletonClass[]>; insertTeacherClass(teacherId: string): Promise<TeacherSingletonClass> }`
- Produces: `const HIDDEN_CLASSROOM_NAME = "Classroom"`
- Produces: `async function ensureTeacherSingletonClass(persistence: TeacherSingletonClassPersistence, teacherId: string): Promise<TeacherSingletonClass>`
- Produces: `async function getTeacherSingletonClass(persistence: Pick<TeacherSingletonClassPersistence, "listTeacherClasses">, teacherId: string): Promise<TeacherSingletonClass>`

- [ ] **Step 1: Write the failing singleton helper tests**

```ts
// supabase/functions/_shared/teacher_singleton_class_test.ts
import { assertEquals, assertRejects } from "jsr:@std/assert";
import {
  HIDDEN_CLASSROOM_NAME,
  ensureTeacherSingletonClass,
  getTeacherSingletonClass,
} from "./teacher_singleton_class.ts";

Deno.test("ensureTeacherSingletonClass creates one hidden classroom when a teacher has none", async () => {
  const calls: string[] = [];

  const classroom = await ensureTeacherSingletonClass(
    {
      listTeacherClasses: async () => [],
      insertTeacherClass: async (teacherId) => {
        calls.push(`insert:${teacherId}`);
        return {
          id: "classroom-1",
          teacherId,
          name: HIDDEN_CLASSROOM_NAME,
          createdAt: "2026-07-31T00:00:00.000Z",
        };
      },
    },
    "teacher-1",
  );

  assertEquals(classroom, {
    id: "classroom-1",
    teacherId: "teacher-1",
    name: HIDDEN_CLASSROOM_NAME,
    createdAt: "2026-07-31T00:00:00.000Z",
  });
  assertEquals(calls, ["insert:teacher-1"]);
});

Deno.test("ensureTeacherSingletonClass reuses the existing hidden classroom when one already exists", async () => {
  const classroom = await ensureTeacherSingletonClass(
    {
      listTeacherClasses: async () => [
        {
          id: "classroom-1",
          teacherId: "teacher-1",
          name: HIDDEN_CLASSROOM_NAME,
          createdAt: "2026-07-31T00:00:00.000Z",
        },
      ],
      insertTeacherClass: async () => {
        throw new Error("should not insert a second classroom");
      },
    },
    "teacher-1",
  );

  assertEquals(classroom.id, "classroom-1");
});

Deno.test("getTeacherSingletonClass rejects duplicate classrooms for one teacher", async () => {
  await assertRejects(
    () =>
      getTeacherSingletonClass(
        {
          listTeacherClasses: async () => [
            {
              id: "classroom-1",
              teacherId: "teacher-1",
              name: HIDDEN_CLASSROOM_NAME,
              createdAt: "2026-07-31T00:00:00.000Z",
            },
            {
              id: "classroom-2",
              teacherId: "teacher-1",
              name: HIDDEN_CLASSROOM_NAME,
              createdAt: "2026-07-31T00:00:01.000Z",
            },
          ],
        },
        "teacher-1",
      ),
    Error,
    "Expected exactly one classroom for teacher teacher-1.",
  );
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `deno test supabase/functions/_shared/teacher_singleton_class_test.ts`
Expected: FAIL with `Module not found` for `teacher_singleton_class.ts`.

- [ ] **Step 3: Implement the migration and shared singleton helpers**

```sql
-- supabase/migrations/0009_single_teacher_class.sql
do $$
begin
  if exists (
    select 1
    from public.classes
    group by teacher_id
    having count(*) > 1
  ) then
    raise exception
      'single teacher classroom migration aborted: at least one teacher already owns multiple classes';
  end if;
end
$$;

alter table public.classes
  alter column join_code drop not null;

create unique index if not exists classes_teacher_singleton_idx
  on public.classes (teacher_id);

insert into public.classes (teacher_id, name, join_code)
select
  profiles.id,
  'Classroom',
  null
from public.profiles
where profiles.role = 'teacher'
  and not exists (
    select 1
    from public.classes
    where classes.teacher_id = profiles.id
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  next_role text;
begin
  next_role := coalesce(new.raw_user_meta_data ->> 'role', 'student');

  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    next_role,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;

  if next_role = 'teacher' then
    insert into public.classes (teacher_id, name, join_code)
    values (new.id, 'Classroom', null)
    on conflict (teacher_id) do nothing;
  end if;

  return new;
end;
$function$;
```

```ts
// supabase/functions/_shared/teacher_singleton_class.ts
export const HIDDEN_CLASSROOM_NAME = "Classroom";

export type TeacherSingletonClass = {
  id: string;
  teacherId: string;
  name: string;
  createdAt: string;
};

export type TeacherSingletonClassPersistence = {
  listTeacherClasses(teacherId: string): Promise<TeacherSingletonClass[]>;
  insertTeacherClass(teacherId: string): Promise<TeacherSingletonClass>;
};

function assertSingleton(
  teacherId: string,
  classrooms: TeacherSingletonClass[],
): TeacherSingletonClass {
  if (classrooms.length !== 1) {
    throw new Error(`Expected exactly one classroom for teacher ${teacherId}.`);
  }

  return classrooms[0];
}

export async function ensureTeacherSingletonClass(
  persistence: TeacherSingletonClassPersistence,
  teacherId: string,
): Promise<TeacherSingletonClass> {
  const existing = await persistence.listTeacherClasses(teacherId);
  if (existing.length === 0) {
    return persistence.insertTeacherClass(teacherId);
  }

  return assertSingleton(teacherId, existing);
}

export async function getTeacherSingletonClass(
  persistence: Pick<TeacherSingletonClassPersistence, "listTeacherClasses">,
  teacherId: string,
): Promise<TeacherSingletonClass> {
  return assertSingleton(teacherId, await persistence.listTeacherClasses(teacherId));
}
```

- [ ] **Step 4: Run the singleton helper tests**

Run: `deno test supabase/functions/_shared/teacher_singleton_class_test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0009_single_teacher_class.sql supabase/functions/_shared/teacher_singleton_class.ts supabase/functions/_shared/teacher_singleton_class_test.ts
git commit -m "db: enforce one classroom per teacher"
```

### Task 2: Teacher-Scoped Student Auth Backends

**Files:**
- Modify: `supabase/functions/_shared/student_auth.ts`
- Modify: `supabase/functions/_shared/hidden_student_provision.ts`
- Modify: `supabase/functions/_shared/hidden_student_provision_test.ts`
- Modify: `supabase/functions/student-register/handler.ts`
- Modify: `supabase/functions/student-register/handler_test.ts`
- Modify: `supabase/functions/student-login/handler.ts`
- Modify: `supabase/functions/student-login/handler_test.ts`

**Interfaces:**
- Consumes: `getTeacherSingletonClass()` from `supabase/functions/_shared/teacher_singleton_class.ts`
- Produces: `function normalizeTeacherFirstName(input: string): string`
- Produces: `StudentRegisterDeps["findTeacherClassByFirstName"] = (normalizedTeacherFirstName: string) => Promise<{ teacherId: string; classId: string } | null | "ambiguous">`
- Produces: `StudentRegisterDeps["findExistingStudentEmailInClass"] = (input: { classId: string; normalizedLastName: string; normalizedFirstName: string }) => Promise<string | null | "ambiguous">`
- Produces: `StudentLoginDeps["findStudentEmailByTeacherAndName"] = (input: { normalizedTeacherFirstName: string; normalizedLastName: string; normalizedFirstName: string }) => Promise<string | null | "ambiguous">`
- Produces: `POST /student-register { teacherFirstName: string; lastName: string; firstName: string }`
- Produces: `POST /student-login { teacherFirstName: string; lastName: string; firstName: string }`

- [ ] **Step 1: Write the failing auth-handler tests**

```ts
// supabase/functions/student-register/handler_test.ts
import { assertEquals } from "jsr:@std/assert";
import { createStudentRegisterHandler } from "./handler.ts";

Deno.test("student-register reuses a pre-provisioned student in the teacher classroom", async () => {
  const calls: string[] = [];
  const handler = createStudentRegisterHandler({
    findTeacherClassByFirstName: async () => ({ teacherId: "teacher-1", classId: "classroom-1" }),
    findExistingStudentEmailInClass: async () => "student.preprovisioned@auth.mathventure.invalid",
    provisionStudentForClass: async () => {
      throw new Error("should not provision a second account");
    },
    issueStudentSession: async (email) => {
      calls.push(`issue:${email}`);
      return {
        status: "ok" as const,
        email,
        tokenHash: "token-hash",
        verifyType: "email" as const,
      };
    },
  });

  const response = await handler(
    new Request("http://local/student-register", {
      method: "POST",
      body: JSON.stringify({
        teacherFirstName: "Ana",
        lastName: "Santos",
        firstName: "Maria",
      }),
    }),
  );

  assertEquals(response.status, 201);
  assertEquals(calls, ["issue:student.preprovisioned@auth.mathventure.invalid"]);
});

Deno.test("student-register provisions a hidden student when no classroom match exists", async () => {
  const calls: string[] = [];
  const handler = createStudentRegisterHandler({
    findTeacherClassByFirstName: async () => ({ teacherId: "teacher-1", classId: "classroom-1" }),
    findExistingStudentEmailInClass: async () => null,
    provisionStudentForClass: async () => {
      calls.push("provision");
      return {
        studentId: "student-1",
        email: "student.generated@auth.mathventure.invalid",
      };
    },
    issueStudentSession: async (email) => {
      calls.push(`issue:${email}`);
      return {
        status: "ok" as const,
        email,
        tokenHash: "token-hash",
        verifyType: "email" as const,
      };
    },
  });

  const response = await handler(
    new Request("http://local/student-register", {
      method: "POST",
      body: JSON.stringify({
        teacherFirstName: "Ana",
        lastName: "Santos",
        firstName: "Maria",
      }),
    }),
  );

  assertEquals(response.status, 201);
  assertEquals(calls, ["provision", "issue:student.generated@auth.mathventure.invalid"]);
});
```

```ts
// supabase/functions/student-login/handler_test.ts
import { assertEquals } from "jsr:@std/assert";
import { createStudentLoginHandler } from "./handler.ts";

Deno.test("student-login returns invalid_credentials when the teacher first name is unknown", async () => {
  const handler = createStudentLoginHandler({
    findStudentEmailByTeacherAndName: async () => null,
    issueStudentSession: async () => {
      throw new Error("should not issue session");
    },
  });

  const response = await handler(new Request("http://local/student-login", {
    method: "POST",
    body: JSON.stringify({
      teacherFirstName: "Missing",
      lastName: "Santos",
      firstName: "Maria",
    }),
  }));

  assertEquals(response.status, 401);
  assertEquals(await response.json(), { status: "invalid_credentials" });
});

Deno.test("student-login uses teacher first name plus student name to issue the session", async () => {
  const handler = createStudentLoginHandler({
    findStudentEmailByTeacherAndName: async () => "student.test-key@auth.mathventure.invalid",
    issueStudentSession: async (email) => ({
      status: "ok" as const,
      email,
      tokenHash: "token-hash",
      verifyType: "email" as const,
    }),
  });

  const response = await handler(new Request("http://local/student-login", {
    method: "POST",
    body: JSON.stringify({
      teacherFirstName: "Ana",
      lastName: "Santos",
      firstName: "Maria",
    }),
  }));

  assertEquals(response.status, 200);
  assertEquals((await response.json()).email, "student.test-key@auth.mathventure.invalid");
});
```

- [ ] **Step 2: Run the auth-handler tests to verify they fail**

Run: `deno test supabase/functions/student-register/handler_test.ts supabase/functions/student-login/handler_test.ts`
Expected: FAIL because `teacherFirstName`-based dependencies and request parsing do not exist yet.

- [ ] **Step 3: Implement teacher-scoped student registration and login**

```ts
// supabase/functions/_shared/student_auth.ts
export const STUDENT_VERIFY_TYPE = "email" as const;

function normalizePersonName(input: string): string {
  return input.trim().replace(/\s+/g, " ").toUpperCase();
}

export function normalizeTeacherFirstName(input: string): string {
  return normalizePersonName(input);
}

export function normalizeFirstName(input: string): string {
  return normalizePersonName(input);
}

export function normalizeLastName(input: string): string {
  return normalizePersonName(input);
}
```

```ts
// supabase/functions/student-register/handler.ts
const normalizedTeacherFirstName = normalizeTeacherFirstName(
  typeof body?.teacherFirstName === "string" ? body.teacherFirstName : "",
);

if (!normalizedTeacherFirstName || !identity) {
  return errorResponse("Please enter the teacher's first name plus the student's last name and first name.", 422);
}

const teacherClass = await deps.findTeacherClassByFirstName(normalizedTeacherFirstName);
if (!teacherClass || teacherClass === "ambiguous") {
  return errorResponse("We couldn't find that teacher classroom.", 404);
}

const existingEmail = await deps.findExistingStudentEmailInClass({
  classId: teacherClass.classId,
  normalizedLastName: identity.normalizedLastName,
  normalizedFirstName: identity.normalizedFirstName,
});

if (existingEmail === "ambiguous") {
  return errorResponse("We couldn't resolve that student in the teacher classroom.", 409);
}

if (existingEmail) {
  return jsonResponse(await deps.issueStudentSession(existingEmail), 201);
}

const created = await deps.provisionStudentForClass({
  classId: teacherClass.classId,
  identity,
});

return jsonResponse(await deps.issueStudentSession(created.email), 201);
```

```ts
// supabase/functions/student-login/handler.ts
const normalizedTeacherFirstName = normalizeTeacherFirstName(
  typeof body?.teacherFirstName === "string" ? body.teacherFirstName : "",
);
const normalizedLastName = normalizeLastName(typeof body?.lastName === "string" ? body.lastName : "");
const normalizedFirstName = normalizeFirstName(typeof body?.firstName === "string" ? body.firstName : "");

if (!normalizedTeacherFirstName || !normalizedLastName || !normalizedFirstName) {
  return jsonResponse({ status: "invalid_credentials" }, 401);
}

const studentEmail = await deps.findStudentEmailByTeacherAndName({
  normalizedTeacherFirstName,
  normalizedLastName,
  normalizedFirstName,
});

if (!studentEmail || studentEmail === "ambiguous") {
  return jsonResponse({ status: "invalid_credentials" }, 401);
}

return jsonResponse(await deps.issueStudentSession(studentEmail));
```

- [ ] **Step 4: Run the auth Deno tests**

Run: `deno test supabase/functions/_shared/hidden_student_provision_test.ts supabase/functions/student-register/handler_test.ts supabase/functions/student-login/handler_test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/_shared/student_auth.ts supabase/functions/_shared/hidden_student_provision.ts supabase/functions/_shared/hidden_student_provision_test.ts supabase/functions/student-register/handler.ts supabase/functions/student-register/handler_test.ts supabase/functions/student-login/handler.ts supabase/functions/student-login/handler_test.ts
git commit -m "feat: scope student auth to teacher classroom"
```

### Task 3: Singleton Classroom Endpoints And Compatibility Wrappers

**Files:**
- Create: `supabase/functions/classes-list/handler.ts`
- Create: `supabase/functions/classes-list/handler_test.ts`
- Modify: `supabase/functions/classes-list/index.ts`
- Modify: `supabase/functions/classes-roster/handler.ts`
- Modify: `supabase/functions/classes-roster/handler_test.ts`
- Modify: `supabase/functions/classes-add-students/handler.ts`
- Modify: `supabase/functions/classes-add-students/handler_test.ts`
- Modify: `supabase/functions/classes-remove-student/handler.ts`
- Modify: `supabase/functions/classes-remove-student/handler_test.ts`
- Create: `supabase/functions/classes-create/handler.ts`
- Create: `supabase/functions/classes-create/handler_test.ts`
- Modify: `supabase/functions/classes-create/index.ts`
- Create: `supabase/functions/classes-join/handler.ts`
- Create: `supabase/functions/classes-join/handler_test.ts`
- Modify: `supabase/functions/classes-join/index.ts`
- Modify: `supabase/functions/attempts-submit/handler.ts`
- Modify: `supabase/functions/attempts-submit/handler_test.ts`

**Interfaces:**
- Consumes: `ensureTeacherSingletonClass()` and `getTeacherSingletonClass()` from `supabase/functions/_shared/teacher_singleton_class.ts`
- Produces: `GET /classes-list -> { classroom: TeacherClassroomSummary | StudentClassroomSummary | null }`
- Produces: `GET /classes-roster -> { students: TeacherClassStudent[] }`
- Produces: `POST /classes-add-students { students: { lastName: string; firstName: string }[] }`
- Produces: `POST /classes-remove-student { studentId: string }`
- Produces: `POST /classes-create -> { classroom: TeacherClassroomSummary }`
- Produces: `POST /classes-join -> 410 { error: "Class codes are no longer supported." }`
- Produces: `resolveAttemptClassId(input: { studentId: string; assignmentId: string | null; requestedClassId: string | null }): Promise<string | null>`

- [ ] **Step 1: Write the failing endpoint tests**

```ts
// supabase/functions/classes-list/handler_test.ts
import { assertEquals } from "jsr:@std/assert";
import { createClassesListHandler } from "./handler.ts";

Deno.test("classes-list returns one teacher classroom without join codes", async () => {
  const handler = createClassesListHandler({
    getAuthedProfile: async () => ({ id: "teacher-1", role: "teacher", full_name: "Ana Cruz" }),
    getTeacherClassroom: async () => ({
      id: "classroom-1",
      teacherId: "teacher-1",
      name: "Classroom",
      createdAt: "2026-07-31T00:00:00.000Z",
      studentCount: 4,
    }),
    getStudentClassroom: async () => null,
  });

  const response = await handler(new Request("http://local/classes-list"));
  assertEquals(response.status, 200);
  assertEquals(await response.json(), {
    classroom: {
      id: "classroom-1",
      createdAt: "2026-07-31T00:00:00.000Z",
      studentCount: 4,
    },
  });
});
```

```ts
// supabase/functions/classes-add-students/handler_test.ts
Deno.test("classes-add-students creates students without requiring classId", async () => {
  const handler = createClassesAddStudentsHandler({
    getAuthedProfile: async () => ({ id: "teacher-1", role: "teacher", full_name: "Ana Cruz" }),
    getTeacherClassroom: async () => ({ id: "classroom-1", teacherId: "teacher-1", name: "Classroom" }),
    hasStudentWithNormalizedName: async () => false,
    provisionStudentForClass: async () => ({
      studentId: "student-1",
      email: "student.1@auth.mathventure.invalid",
    }),
    deleteHiddenStudent: async () => {},
  });

  const response = await handler(new Request("http://local/classes-add-students", {
    method: "POST",
    body: JSON.stringify({
      students: [{ lastName: "Santos", firstName: "Maria" }],
    }),
  }));

  assertEquals(response.status, 201);
  assertEquals(await response.json(), {
    createdCount: 1,
  });
});
```

```ts
// supabase/functions/attempts-submit/handler_test.ts
import { assertEquals } from "jsr:@std/assert";
import { resolveAttemptClassId } from "./handler.ts";

Deno.test("resolveAttemptClassId infers the classroom for free-play attempts when classId is omitted", async () => {
  const classId = await resolveAttemptClassId(
    {
      studentId: "student-a",
      assignmentId: null,
      requestedClassId: null,
    },
    {
      getAssignmentContext: async () => null,
      isStudentEnrolledInClass: async () => true,
      getStudentSingletonClassId: async () => "classroom-1",
    },
  );

  assertEquals(classId, "classroom-1");
});
```

- [ ] **Step 2: Run the endpoint tests to verify they fail**

Run: `deno test supabase/functions/classes-list/handler_test.ts supabase/functions/classes-add-students/handler_test.ts supabase/functions/attempts-submit/handler_test.ts`
Expected: FAIL because the singleton handlers, request contracts, and classroom inference do not exist yet.

- [ ] **Step 3: Implement singleton classroom endpoint behavior**

```ts
// supabase/functions/classes-list/handler.ts
export function createClassesListHandler(
  deps: {
    getAuthedProfile(req: Request): Promise<{ id: string; role: "student" | "teacher"; full_name: string } | null>;
    getTeacherClassroom(teacherId: string): Promise<{ id: string; teacherId: string; name: string; createdAt: string; studentCount: number } | null>;
    getStudentClassroom(studentId: string): Promise<{ id: string; teacherName: string; joinedAt: string } | null>;
  },
) {
  return async (req: Request): Promise<Response> => {
    const profile = await deps.getAuthedProfile(req);
    if (!profile) return errorResponse("Unauthorized", 401);

    if (profile.role === "teacher") {
      const classroom = await deps.getTeacherClassroom(profile.id);
      return jsonResponse({
        classroom: classroom
          ? {
              id: classroom.id,
              createdAt: classroom.createdAt,
              studentCount: classroom.studentCount,
            }
          : null,
      });
    }

    const classroom = await deps.getStudentClassroom(profile.id);
    return jsonResponse({
      classroom: classroom
        ? {
            id: classroom.id,
            teacherName: classroom.teacherName,
            joinedAt: classroom.joinedAt,
          }
        : null,
    });
  };
}
```

```ts
// supabase/functions/classes-roster/handler.ts
const classroom = await deps.getTeacherClassroom(profile.id);
if (!classroom) {
  return errorResponse("Classroom not found", 404);
}

const students = await deps.listRosterStudents(classroom.id);
```

```ts
// supabase/functions/classes-add-students/handler.ts
const students = Array.isArray(body?.students)
  ? body.students as Record<string, unknown>[]
  : [];

if (!students.length) {
  return errorResponse("At least one student is required", 422);
}

const classroom = await deps.getTeacherClassroom(profile.id);
if (!classroom) {
  return errorResponse("Classroom not found", 404);
}

const created = await deps.provisionStudentForClass({
  classId: classroom.id,
  identity,
});

return jsonResponse({ createdCount: createdStudentIds.length }, 201);
```

```ts
// supabase/functions/classes-remove-student/handler.ts
const studentId = typeof body?.studentId === "string" ? body.studentId : "";
if (!studentId) {
  return errorResponse("studentId is required", 422);
}

const classroom = await deps.getTeacherClassroom(profile.id);
if (!classroom) {
  return errorResponse("Classroom not found", 404);
}

await deps.removeMembership({ classId: classroom.id, studentId });
return jsonResponse({ removed: true });
```

```ts
// supabase/functions/classes-create/handler.ts
export function createClassesCreateHandler(
  deps: {
    getAuthedProfile(req: Request): Promise<{ id: string; role: "student" | "teacher"; full_name: string } | null>;
    ensureTeacherClassroom(teacherId: string): Promise<{ id: string; createdAt: string; studentCount: number }>;
  },
) {
  return async (req: Request): Promise<Response> => {
    const profile = await deps.getAuthedProfile(req);
    if (!profile) return errorResponse("Unauthorized", 401);
    if (profile.role !== "teacher") return errorResponse("Only teachers can access classrooms", 403);

    const classroom = await deps.ensureTeacherClassroom(profile.id);
    return jsonResponse({ classroom }, 200);
  };
}
```

```ts
// supabase/functions/classes-join/handler.ts
export function createClassesJoinHandler() {
  return async (): Promise<Response> => {
    return errorResponse("Class codes are no longer supported.", 410);
  };
}
```

```ts
// supabase/functions/attempts-submit/handler.ts
type ResolveAttemptClassIdDeps = {
  getAssignmentContext(assignmentId: string): Promise<AssignmentContext | null>;
  isStudentEnrolledInClass(studentId: string, classId: string): Promise<boolean>;
  getStudentSingletonClassId(studentId: string): Promise<string | null>;
};

if (!input.requestedClassId) {
  return deps.getStudentSingletonClassId(input.studentId);
}
```

- [ ] **Step 4: Run the endpoint Deno tests**

Run: `deno test supabase/functions/classes-list/handler_test.ts supabase/functions/classes-roster/handler_test.ts supabase/functions/classes-add-students/handler_test.ts supabase/functions/classes-remove-student/handler_test.ts supabase/functions/classes-create/handler_test.ts supabase/functions/classes-join/handler_test.ts supabase/functions/attempts-submit/handler_test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/classes-list/handler.ts supabase/functions/classes-list/handler_test.ts supabase/functions/classes-list/index.ts supabase/functions/classes-roster/handler.ts supabase/functions/classes-roster/handler_test.ts supabase/functions/classes-add-students/handler.ts supabase/functions/classes-add-students/handler_test.ts supabase/functions/classes-remove-student/handler.ts supabase/functions/classes-remove-student/handler_test.ts supabase/functions/classes-create/handler.ts supabase/functions/classes-create/handler_test.ts supabase/functions/classes-create/index.ts supabase/functions/classes-join/handler.ts supabase/functions/classes-join/handler_test.ts supabase/functions/classes-join/index.ts supabase/functions/attempts-submit/handler.ts supabase/functions/attempts-submit/handler_test.ts
git commit -m "feat: make classroom endpoints singleton-aware"
```

### Task 4: Client Auth And Classroom API Contracts

**Files:**
- Modify: `src/lib/api.ts`
- Modify: `src/lib/hooks.ts`
- Modify: `src/lib/auth.ts`
- Modify: `src/lib/student-auth.ts`
- Modify: `src/lib/student-auth.test.ts`
- Modify: `src/lib/useLanguage.tsx`
- Modify: `src/pages/auth.tsx`
- Modify: `src/lib/teacher-add-students.ts`

**Interfaces:**
- Consumes: the singleton `classes-list`, `classes-roster`, `classes-add-students`, and `classes-remove-student` response contracts from Task 3
- Produces: `type TeacherClassroomSummary = { id: string; createdAt: string; studentCount: number }`
- Produces: `type StudentClassroomSummary = { id: string; teacherName: string; joinedAt: string }`
- Produces: `api.classes.list(): Promise<{ classroom: TeacherClassroomSummary | StudentClassroomSummary | null }>`
- Produces: `api.classes.roster(): Promise<{ students: TeacherClassStudent[] }>`
- Produces: `api.classes.addStudents(students: TeacherAddStudentDraft[]): Promise<TeacherAddStudentsResult>`
- Produces: `api.classes.removeStudent(studentId: string): Promise<{ removed: true }>`
- Produces: `studentRegister(input: { teacherFirstName: string; lastName: string; firstName: string }): Promise<unknown>`
- Produces: `studentSignIn(input: { teacherFirstName: string; lastName: string; firstName: string }): Promise<unknown>`
- Produces: `type TeacherAddStudentsResult = { createdCount: number }`

- [ ] **Step 1: Write the failing client contract call sites**

```ts
// src/lib/hooks.ts
export function useTeacherClassroom() {
  return useQuery({
    queryKey: ["classroom", "teacher"],
    queryFn: () => api.classes.list(),
  });
}

export function useStudentClassroom() {
  return useQuery({
    queryKey: ["classroom", "student"],
    queryFn: () => api.classes.list(),
  });
}

export function useClassRoster() {
  return useQuery({
    queryKey: ["classroom", "roster"],
    queryFn: () => api.classes.roster(),
  });
}
```

```tsx
// src/pages/auth.tsx
const [teacherFirstName, setTeacherFirstName] = useState("");

await studentSignIn({ teacherFirstName, lastName, firstName });
await studentRegister({ teacherFirstName, lastName, firstName });
```

- [ ] **Step 2: Run typecheck to verify it fails**

Run: `npm run typecheck`
Expected: FAIL because `api.ts`, `auth.ts`, and the student auth types still use the old array contracts and `classCode` inputs.

- [ ] **Step 3: Implement the new client contracts**

```ts
// src/lib/api.ts
export interface TeacherClassroomSummary {
  id: string;
  createdAt: string;
  studentCount: number;
}

export interface StudentClassroomSummary {
  id: string;
  teacherName: string;
  joinedAt: string;
}

export const api = {
  classes: {
    list: () =>
      invokeFunction<{ classroom: TeacherClassroomSummary | StudentClassroomSummary | null }>("classes-list"),
    roster: () =>
      invokeFunction<{ students: TeacherClassStudent[] }>("classes-roster"),
    addStudents: (students: TeacherAddStudentDraft[]) =>
      invokeFunction<TeacherAddStudentsResult>("classes-add-students", {
        method: "POST",
        body: { students },
      }),
    removeStudent: (studentId: string) =>
      invokeFunction<{ removed: true }>("classes-remove-student", {
        method: "POST",
        body: { studentId },
      }),
  },
};
```

```ts
// src/lib/auth.ts
export async function studentRegister(input: {
  teacherFirstName: string;
  lastName: string;
  firstName: string;
}) {
  const response = await invokeFunction<StudentSessionPayload>("student-register", {
    method: "POST",
    body: input,
  });
  return completeStudentSession(response);
}

export async function studentSignIn(input: {
  teacherFirstName: string;
  lastName: string;
  firstName: string;
}) {
  const response = await invokeFunction<StudentLoginResponse>("student-login", {
    method: "POST",
    body: input,
  });
  if (response.status === "invalid_credentials") {
    throw new Error("We couldn't sign you in with that information.");
  }
  return completeStudentSession(response);
}
```

```ts
// src/lib/student-auth.ts
export type StudentRegisterResponse = StudentSessionPayload;

export function isStudentSessionPayload(value: unknown): value is StudentSessionPayload {
  return typeof value === "object"
    && value !== null
    && (value as StudentSessionPayload).status === "ok"
    && typeof (value as StudentSessionPayload).tokenHash === "string";
}
```

```ts
// src/lib/useLanguage.tsx
"auth.teacherFirstName": "Teacher First Name",
"auth.studentLoginHelp": "Use your teacher's first name, your last name, and your first name.",
"auth.studentSignupHelp": "Use your teacher's first name, your last name, and your first name.",
```

```tsx
// src/pages/auth.tsx
<div className="space-y-2">
  <Label htmlFor="teacherFirstName">{t("auth.teacherFirstName")}</Label>
  <Input
    id="teacherFirstName"
    required
    value={teacherFirstName}
    onChange={(event) => setTeacherFirstName(event.target.value)}
  />
</div>
```

```ts
// src/lib/teacher-add-students.ts
export type TeacherAddStudentsResult = {
  createdCount: number;
};
```

- [ ] **Step 4: Run the client contract verification**

Run: `deno test src/lib/student-auth.test.ts`
Expected: PASS

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/api.ts src/lib/hooks.ts src/lib/auth.ts src/lib/student-auth.ts src/lib/student-auth.test.ts src/lib/useLanguage.tsx src/pages/auth.tsx src/lib/teacher-add-students.ts
git commit -m "feat: update auth and classroom client contracts"
```

### Task 5: Collapse The Teacher Workspace To One Classroom

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/teacher.tsx`
- Modify: `src/lib/teacher-nav.ts`
- Modify: `src/lib/teacher-nav.test.ts`
- Modify: `src/components/teacher/add-students/TeacherAddStudentsDialog.tsx`
- Modify: `src/components/teacher/add-students/TeacherAddStudentsResultStep.tsx`

**Interfaces:**
- Consumes: `useTeacherClassroom()` and `useClassRoster()` from `src/lib/hooks.ts`
- Produces: `TeacherWorkspacePage(): JSX.Element`
- Produces: `/teacher -> TeacherWorkspacePage`
- Produces: `/teacher/classes -> redirect("/teacher")`
- Produces: `/teacher/classes/:classId -> redirect("/teacher")`
- Produces: `TeacherAddStudentsDialog(props: { open: boolean; onOpenChange(open: boolean): void }): JSX.Element`

- [ ] **Step 1: Write the failing teacher-route and dialog wiring**

```tsx
// src/App.tsx
import {
  TeacherWorkspacePage,
  TeacherReportsPage,
  TeacherSettingsPlaceholder,
} from "@/pages/teacher";

<Route path="/teacher">
  {() => <AppLayout sidebarMode="hidden"><TeacherWorkspacePage /></AppLayout>}
</Route>
<Route path="/teacher/classes">
  {() => <Redirect to="/teacher" replace />}
</Route>
<Route path="/teacher/classes/:classId">
  {() => <Redirect to="/teacher" replace />}
</Route>
```

```tsx
// src/components/teacher/add-students/TeacherAddStudentsDialog.tsx
const result = await addStudents.mutateAsync({
  students: state.rows,
});
```

- [ ] **Step 2: Run typecheck to verify it fails**

Run: `npm run typecheck`
Expected: FAIL because `TeacherWorkspacePage`, the singleton hooks, and the no-`classId` add-students flow are not implemented yet.

- [ ] **Step 3: Implement the singleton teacher workspace**

```tsx
// src/pages/teacher.tsx
export function TeacherWorkspacePage() {
  const { data: classroomData, isLoading: classroomLoading } = useTeacherClassroom();
  const { data: rosterData, isLoading: rosterLoading } = useClassRoster();
  const removeStudent = useRemoveStudentFromClass();
  const [isAddStudentsOpen, setIsAddStudentsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"students" | "progress">("students");
  const [pendingRemoval, setPendingRemoval] = useState<TeacherClassStudent | null>(null);

  if (classroomLoading || rosterLoading) {
    return <div className="p-8 text-center font-bold">Loading classroom...</div>;
  }

  const classroom = classroomData?.classroom as TeacherClassroomSummary | null;
  const students = (rosterData?.students ?? []) as TeacherClassStudent[];

  if (!classroom) {
    return <div className="p-8 text-center font-bold">Classroom unavailable.</div>;
  }

  return (
    <TeacherWorkspaceBoard
      heading={(
        <>
          <h1 className="text-4xl font-display font-bold">Classroom</h1>
          <p className="mt-2 font-bold text-muted-foreground">
            Manage your students and monitor progress in one place.
          </p>
        </>
      )}
      action={<Button variant="outline" onClick={() => setIsAddStudentsOpen(true)}>+ Add</Button>}
    >
      <TeacherAddStudentsDialog
        open={isAddStudentsOpen}
        onOpenChange={setIsAddStudentsOpen}
      />
      <div className="mb-5 inline-flex rounded-2xl border-2 border-border bg-white p-1">
        <Button
          variant={activeTab === "students" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("students")}
        >
          Student List
        </Button>
        <Button
          variant={activeTab === "progress" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("progress")}
        >
          Student Progress
        </Button>
      </div>

      {activeTab === "students"
        ? <TeacherStudentListTable students={students} onRemove={setPendingRemoval} />
        : <TeacherStudentProgressTable students={students} />}

      <Dialog open={pendingRemoval !== null} onOpenChange={(open) => !open && setPendingRemoval(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove student from your classroom?</DialogTitle>
            <DialogDescription>
              This removes the student from your classroom only. Their account and progress stay intact.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              variant="danger"
              onClick={async () => {
                if (!pendingRemoval) return;
                await removeStudent.mutateAsync({ studentId: pendingRemoval.id });
                setPendingRemoval(null);
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TeacherWorkspaceBoard>
  );
}
```

```tsx
// src/components/teacher/add-students/TeacherAddStudentsResultStep.tsx
export function TeacherAddStudentsResultStep({
  result,
  onDone,
}: {
  result: TeacherAddStudentsResult;
  onDone(): void;
}) {
  return (
    <Card className="rounded-[24px] p-6">
      <h3 className="text-2xl font-display font-bold">Students Added</h3>
      <p className="mt-3 font-bold text-muted-foreground">
        Added {result.createdCount} student{result.createdCount === 1 ? "" : "s"} to your classroom.
      </p>
      <Button className="mt-6" onClick={onDone}>
        Done
      </Button>
    </Card>
  );
}
```

```ts
// src/lib/teacher-nav.ts
export function isTeacherNavActive(pathname: string, href: string): boolean {
  const cleanPath = pathname.split("?")[0].split("#")[0];

  if (href === "/teacher") {
    return cleanPath === "/teacher"
      || cleanPath === "/teacher/classes"
      || cleanPath.startsWith("/teacher/classes/");
  }

  if (href === "/teacher/reports") {
    return cleanPath === "/teacher/reports"
      || cleanPath.startsWith("/teacher/reports");
  }

  return cleanPath === href;
}
```

- [ ] **Step 4: Run the teacher workspace verification**

Run: `deno test src/lib/teacher-nav.test.ts`
Expected: PASS

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/pages/teacher.tsx src/lib/teacher-nav.ts src/lib/teacher-nav.test.ts src/components/teacher/add-students/TeacherAddStudentsDialog.tsx src/components/teacher/add-students/TeacherAddStudentsResultStep.tsx
git commit -m "feat: collapse teacher workspace to singleton classroom"
```

### Task 6: Collapse The Student Dashboard And Classroom Flow

**Files:**
- Modify: `src/pages/student.tsx`
- Modify: `src/components/student/StudentPortalRail.tsx`
- Modify: `src/lib/student-portal.ts`
- Modify: `src/lib/student-portal.test.ts`
- Modify: `src/lib/student-nav.ts`
- Modify: `src/lib/student-nav.test.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useStudentClassroom()` from `src/lib/hooks.ts`
- Produces: `StudentClassroomPage(): JSX.Element`
- Produces: `/student/classroom -> StudentClassroomPage`
- Produces: `buildStudentLessonExitHref(input: { returnTo?: string | null }): string`
- Produces: `StudentPortalRail(props: { summary: PortalRailSummary; classroom: StudentClassroomSummary | null; onOpenAssignment(href: string): void; onOpenClassroom(): void }): JSX.Element`

- [ ] **Step 1: Write the failing student route and portal tests**

```ts
// src/lib/student-portal.test.ts
import { assertEquals } from "jsr:@std/assert";
import { buildStudentLessonExitHref, summarizePortalRail } from "./student-portal.ts";

Deno.test("buildStudentLessonExitHref returns /student/classroom for classroom exits", () => {
  assertEquals(
    buildStudentLessonExitHref({ returnTo: "class" }),
    "/student/classroom",
  );
});

Deno.test("summarizePortalRail no longer exposes join prompts or multi-class counts", () => {
  const summary = summarizePortalRail({
    assignments: [],
    classroom: null,
    dashboard: {
      completedLessons: 0,
      streakDays: 0,
      recentAttempts: [],
    },
  });

  assertEquals(summary.classroom, null);
  assertEquals(summary.showClassroomPrompt, false);
});
```

```ts
// src/lib/student-nav.test.ts
import { assertEquals } from "jsr:@std/assert";
import { isStudentNavActive } from "./student-nav.ts";

Deno.test("student nav stays active on the classroom route", () => {
  assertEquals(isStudentNavActive("/student/classroom", "/student"), true);
  assertEquals(isStudentNavActive("/student/lessons/colors?returnTo=class", "/student"), true);
});
```

- [ ] **Step 2: Run the student portal tests to verify they fail**

Run: `deno test src/lib/student-portal.test.ts src/lib/student-nav.test.ts`
Expected: FAIL because the student helpers still expect class-id routes and join-class UI.

- [ ] **Step 3: Implement the one-classroom student flow**

```ts
// src/lib/student-portal.ts
export type PortalRailSummary = {
  nextAction:
    | { kind: "assignment"; lessonId: PortalTopicId; href: string; dueAt: string | null }
    | { kind: "free-play"; href: string };
  classroom: PortalClass | null;
  completedLessons: number;
  streakDays: number;
  recentLessonId: PortalTopicId | null;
  recentScorePct: number | null;
  showClassroomPrompt: boolean;
};

export function buildStudentLessonExitHref(input: {
  returnTo?: string | null;
}): string {
  if (input.returnTo === "class") {
    return "/student/classroom";
  }

  return "/student";
}

export function summarizePortalRail(input: {
  assignments: PortalAssignment[];
  classroom: PortalClass | null;
  dashboard: PortalDashboardSummary;
}): PortalRailSummary {
  const nextAssignment = sortPendingAssignments(input.assignments).find((assignment) => {
    return !assignment.completed && toPortalTopicId(assignment.lessonId) !== null;
  }) ?? null;

  return {
    nextAction: nextAssignment
      ? {
          kind: "assignment",
          lessonId: toPortalTopicId(nextAssignment.lessonId)!,
          href: buildStudentLessonHref({
            lessonId: toPortalTopicId(nextAssignment.lessonId)!,
            assignmentId: nextAssignment.id,
            classId: nextAssignment.classId ?? null,
          }),
          dueAt: nextAssignment.dueAt,
        }
      : { kind: "free-play", href: "/student" },
    classroom: input.classroom,
    completedLessons: input.dashboard.completedLessons,
    streakDays: input.dashboard.streakDays,
    recentLessonId: input.dashboard.recentAttempts[0]
      ? toPortalTopicId(input.dashboard.recentAttempts[0].lessonId)
      : null,
    recentScorePct: input.dashboard.recentAttempts[0]
      ? toScorePct(input.dashboard.recentAttempts[0].score, input.dashboard.recentAttempts[0].maxScore)
      : null,
    showClassroomPrompt: false,
  };
}
```

```tsx
// src/components/student/StudentPortalRail.tsx
export function StudentPortalRail({
  summary,
  classroom,
  onOpenAssignment,
  onOpenClassroom,
}: {
  summary: PortalRailSummary;
  classroom: StudentClassroomSummary | null;
  onOpenAssignment: (href: string) => void;
  onOpenClassroom: () => void;
}) {
  return (
    <aside className="flex flex-col gap-4">
      <Card className="rounded-[28px] border-white/70 bg-[#fff7db]/95 p-5 shadow-[0_20px_45px_rgba(59,109,42,0.12)]">
        {/* next assignment block unchanged */}
      </Card>

      <Card className="rounded-[28px] bg-white/92 p-5 shadow-[0_20px_45px_rgba(59,109,42,0.1)]">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">
          Your Classroom
        </p>
        {classroom ? (
          <button
            type="button"
            className="mt-3 w-full rounded-2xl bg-muted/50 px-4 py-3 text-left"
            onClick={onOpenClassroom}
          >
            <span className="block text-lg font-extrabold text-foreground">Classroom</span>
            <span className="block text-sm font-bold text-muted-foreground">{classroom.teacherName}</span>
          </button>
        ) : (
          <p className="mt-3 text-sm font-bold text-muted-foreground">
            Your classroom will appear here once your teacher adds you.
          </p>
        )}
      </Card>
    </aside>
  );
}
```

```tsx
// src/pages/student.tsx
export function StudentDashboard() {
  const { data: dashboard } = useStudentDashboard();
  const { data: assignmentsData } = useAssignments();
  const { data: classroomData } = useStudentClassroom();
  const [, setLocation] = useLocation();

  const classroom = (classroomData?.classroom ?? null) as StudentClassroomSummary | null;
  const summary = summarizePortalRail({
    assignments: (assignmentsData?.assignments ?? []) as AssignmentForStudent[],
    classroom: classroom
      ? { id: classroom.id, name: "Classroom", teacherName: classroom.teacherName }
      : null,
    dashboard: dashboard ?? { completedLessons: 0, streakDays: 0, recentAttempts: [] },
  });

  return (
    <div className="animate-in fade-in duration-500">
      <div className="grid gap-4 lg:grid-cols-[minmax(260px,25%)_minmax(0,1fr)]">
        <StudentPortalRail
          summary={summary}
          classroom={classroom}
          onOpenAssignment={(href) => setLocation(href)}
          onOpenClassroom={() => setLocation("/student/classroom")}
        />
        {/* lesson menu unchanged */}
      </div>
    </div>
  );
}

export function StudentClassroomPage() {
  const { data: classroomData } = useStudentClassroom();
  const { data: assignmentsData } = useAssignments();
  const [, setLocation] = useLocation();

  const classroom = (classroomData?.classroom ?? null) as StudentClassroomSummary | null;
  if (!classroom) {
    return <div className="p-8 text-center font-bold">Classroom not found.</div>;
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/student")}>
          <ArrowLeft className="h-6 w-6 text-foreground" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-extrabold text-foreground">Classroom</h1>
          <p className="text-muted-foreground font-bold">Teacher: {classroom.teacherName}</p>
        </div>
      </header>
      {/* reuse the existing pending assignment and announcement UI */}
    </div>
  );
}
```

- [ ] **Step 4: Run the student-flow verification**

Run: `deno test src/lib/student-portal.test.ts src/lib/student-nav.test.ts`
Expected: PASS

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/student.tsx src/components/student/StudentPortalRail.tsx src/lib/student-portal.ts src/lib/student-portal.test.ts src/lib/student-nav.ts src/lib/student-nav.test.ts src/App.tsx
git commit -m "feat: collapse student classroom flow"
```

### Task 7: Refactor Reports For One Classroom And Finish Verification

**Files:**
- Modify: `src/lib/teacher-reports.ts`
- Modify: `src/lib/teacher-reports.test.ts`
- Modify: `src/lib/teacher-reports-pdf.ts`
- Modify: `src/lib/teacher-reports-pdf.test.ts`
- Modify: `supabase/functions/_shared/teacher_reports.ts`
- Modify: `supabase/functions/reports-overview/handler.ts`
- Modify: `supabase/functions/reports-overview/handler_test.ts`
- Modify: `supabase/functions/reports-class/handler.ts`
- Modify: `supabase/functions/reports-class/handler_test.ts`
- Create: `src/components/teacher/reports/TeacherReportsClassroomSummary.tsx`
- Modify: `src/components/teacher/reports/TeacherReportsAttentionList.tsx`
- Modify: `src/components/teacher/reports/TeacherReportsRecentActivity.tsx`
- Modify: `src/components/teacher/reports/TeacherClassReportStudentTable.tsx`
- Modify: `src/components/teacher/reports/TeacherClassReportTopicBreakdown.tsx`
- Modify: `src/components/teacher/reports/TeacherClassReportPdfButton.tsx`
- Modify: `src/pages/teacher.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: the singleton classroom helper and singleton classroom endpoint contracts from Tasks 1 and 3
- Produces: `type TeacherSingleClassroomReportPayload = { classroomSummary: { id: string; studentCount: number; activeStudentCount: number; averageScorePct: number | null; completionPct: number; lastActivityAt: string | null }; attentionStudents: ...; recentActivity: ...; studentRows: ...; topicBreakdown: ...; windowKey: TeacherReportsWindowKey; windowLabel: string; hasData: boolean }`
- Produces: `GET /reports-overview -> TeacherSingleClassroomReportPayload`
- Produces: `GET /reports-class?classId=<singleton>&window=<key> -> TeacherSingleClassroomReportPayload`
- Produces: `TeacherReportsPage(): JSX.Element`

- [ ] **Step 1: Write the failing single-classroom reports tests**

```ts
// src/lib/teacher-reports.test.ts
import { assertEquals } from "jsr:@std/assert";
import { buildTeacherSingleClassroomReport } from "./teacher-reports.ts";

Deno.test("buildTeacherSingleClassroomReport returns one classroom summary plus detailed student and topic rows", () => {
  const report = buildTeacherSingleClassroomReport({
    classroom: { id: "classroom-1", studentCount: 2 },
    students: [
      {
        id: "student-1",
        classId: "classroom-1",
        className: "Classroom",
        fullName: "Maria Santos",
        firstName: "Maria",
        lastName: "Santos",
        joinedAt: "2026-07-01T00:00:00.000Z",
      },
    ],
    results: [
      {
        studentId: "student-1",
        classId: "classroom-1",
        topicId: "colors",
        gameId: "colors:0",
        gameOrder: 0,
        score: 1,
        maxScore: 1,
        scorePct: 100,
        passed: true,
        completedAt: "2026-07-30T00:00:00.000Z",
      },
    ],
    windowKey: "7d",
    now: new Date("2026-07-31T00:00:00.000Z"),
  });

  assertEquals(report.classroomSummary.studentCount, 2);
  assertEquals(report.hasData, true);
  assertEquals(report.studentRows[0].averageScorePct, 100);
  assertEquals(report.topicBreakdown[0].topicId, "colors");
});
```

```ts
// supabase/functions/reports-overview/handler_test.ts
import { assertEquals } from "jsr:@std/assert";
import { createReportsOverviewHandler } from "./handler.ts";

Deno.test("reports-overview returns the single-classroom report payload", async () => {
  const handler = createReportsOverviewHandler({
    getAuthedProfile: async () => ({ id: "teacher-1", role: "teacher", full_name: "Ana Cruz" }),
    loadTeacherReportsDataset: async () => ({
      classroom: { id: "classroom-1", studentCount: 1 },
      students: [],
      results: [],
    }),
    now: () => new Date("2026-07-31T00:00:00.000Z"),
  });

  const response = await handler(new Request("http://local/reports-overview?window=7d"));
  assertEquals(response.status, 200);
  assertEquals((await response.json()).classroomSummary.id, "classroom-1");
});
```

- [ ] **Step 2: Run the reports tests to verify they fail**

Run: `deno test src/lib/teacher-reports.test.ts supabase/functions/reports-overview/handler_test.ts supabase/functions/reports-class/handler_test.ts`
Expected: FAIL because the report payload is still cross-class and `/teacher/reports` still expects comparison rows.

- [ ] **Step 3: Implement the single-classroom reports model and UI**

```ts
// src/lib/teacher-reports.ts
export type TeacherSingleClassroomReportPayload = {
  classroomSummary: {
    id: string;
    studentCount: number;
    activeStudentCount: number;
    averageScorePct: number | null;
    completionPct: number;
    lastActivityAt: string | null;
  };
  attentionStudents: TeacherReportsAttentionRow[];
  recentActivity: {
    recentPasses: {
      studentId: string;
      fullName: string;
      gameId: string;
      completedAt: string;
      scorePct: number;
    }[];
    lastPlayedAt: string | null;
    inactiveStudentCount: number;
  };
  studentRows: TeacherClassReportPayload["studentRows"];
  topicBreakdown: TeacherClassReportPayload["topicBreakdown"];
  windowKey: TeacherReportsWindowKey;
  windowLabel: string;
  hasData: boolean;
};

export function buildTeacherSingleClassroomReport(input: {
  classroom: { id: string; studentCount: number };
  students: TeacherReportStudentRecord[];
  results: TeacherReportGameResultRecord[];
  windowKey: TeacherReportsWindowKey;
  now?: Date;
}): TeacherSingleClassroomReportPayload {
  const classReport = buildTeacherClassReport({
    classes: [{
      id: input.classroom.id,
      name: "Classroom",
      joinCode: "",
      studentCount: input.classroom.studentCount,
    }],
    students: input.students,
    results: input.results,
    classId: input.classroom.id,
    windowKey: input.windowKey,
    now: input.now,
  });

  return {
    classroomSummary: {
      id: input.classroom.id,
      studentCount: input.classroom.studentCount,
      activeStudentCount: classReport.studentRows.filter((row) => row.lastActivityAt !== null).length,
      averageScorePct: classReport.studentRows.length
        ? Math.round(
            classReport.studentRows.reduce((sum, row) => sum + (row.averageScorePct ?? 0), 0)
            / classReport.studentRows.length,
          )
        : null,
      completionPct: classReport.studentRows.length
        ? Math.round(
            classReport.studentRows.reduce((sum, row) => sum + row.completionPct, 0)
            / classReport.studentRows.length,
          )
        : 0,
      lastActivityAt: classReport.studentRows
        .map((row) => row.lastActivityAt)
        .filter((value): value is string => Boolean(value))
        .sort()
        .at(-1) ?? null,
    },
    attentionStudents: buildTeacherReportsOverview({
      classes: [{
        id: input.classroom.id,
        name: "Classroom",
        joinCode: "",
        studentCount: input.classroom.studentCount,
      }],
      students: input.students,
      results: input.results,
      windowKey: input.windowKey,
      now: input.now,
    }).attentionStudents,
    recentActivity: {
      recentPasses: input.results
        .filter((row) => row.passed)
        .sort((left, right) => right.completedAt.localeCompare(left.completedAt))
        .slice(0, 5)
        .map((row) => ({
          studentId: row.studentId,
          fullName: input.students.find((student) => student.id === row.studentId)?.fullName ?? "Student",
          gameId: row.gameId,
          completedAt: row.completedAt,
          scorePct: row.scorePct,
        })),
      lastPlayedAt: classReport.studentRows
        .map((row) => row.lastActivityAt)
        .filter((value): value is string => Boolean(value))
        .sort()
        .at(-1) ?? null,
      inactiveStudentCount: classReport.studentRows.filter((row) => row.lastActivityAt === null).length,
    },
    studentRows: classReport.studentRows,
    topicBreakdown: classReport.topicBreakdown,
    windowKey: classReport.windowKey,
    windowLabel: classReport.windowLabel,
    hasData: classReport.hasData,
  };
}
```

```tsx
// src/components/teacher/reports/TeacherReportsClassroomSummary.tsx
import { Card } from "@/components/ui";
import type { TeacherSingleClassroomReportPayload } from "@/lib/teacher-reports";

function formatPct(value: number | null) {
  return value == null ? "--" : `${value}%`;
}

export function TeacherReportsClassroomSummary({
  summary,
}: {
  summary: TeacherSingleClassroomReportPayload["classroomSummary"];
}) {
  return (
    <Card className="rounded-[24px] p-6">
      <h2 className="text-2xl font-display font-bold">Classroom Summary</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-muted/30 p-4">
          <p className="text-sm font-bold text-muted-foreground">Students</p>
          <p className="text-2xl font-extrabold">{summary.studentCount}</p>
        </div>
        <div className="rounded-2xl bg-muted/30 p-4">
          <p className="text-sm font-bold text-muted-foreground">Active</p>
          <p className="text-2xl font-extrabold">{summary.activeStudentCount}</p>
        </div>
        <div className="rounded-2xl bg-muted/30 p-4">
          <p className="text-sm font-bold text-muted-foreground">Average Score</p>
          <p className="text-2xl font-extrabold">{formatPct(summary.averageScorePct)}</p>
        </div>
        <div className="rounded-2xl bg-muted/30 p-4">
          <p className="text-sm font-bold text-muted-foreground">Completion</p>
          <p className="text-2xl font-extrabold">{formatPct(summary.completionPct)}</p>
        </div>
      </div>
    </Card>
  );
}
```

```tsx
// src/pages/teacher.tsx
export function TeacherReportsPage() {
  const [location, setLocation] = useLocation();
  const windowKey = React.useMemo(
    () => parseTeacherReportsWindow(window.location.search),
    [location],
  );
  const { data, isLoading, error } = useTeacherReportsOverview(windowKey);

  if (isLoading) {
    return <div className="p-8 text-center font-bold">Loading reports...</div>;
  }

  return (
    <TeacherWorkspaceBoard
      heading={(
        <>
          <h1 className="text-4xl font-display font-bold">Reports</h1>
          <p className="mt-2 font-bold text-muted-foreground">
            Review classroom performance, attention students, and activity in one place.
          </p>
        </>
      )}
      action={data ? <TeacherClassReportPdfButton report={data} disabled={!data.hasData} /> : undefined}
    >
      <TeacherReportsWindowPicker
        value={windowKey}
        onChange={(nextWindow) => setLocation(`/teacher/reports?window=${nextWindow}`)}
      />

      {error && (
        <Card className="mb-6 rounded-[24px] p-6 font-bold text-destructive">
          {(error as Error).message || "We couldn't load reports right now."}
        </Card>
      )}

      {data && (
        <div className="grid gap-6">
          <TeacherReportsClassroomSummary summary={data.classroomSummary} />
          <TeacherReportsAttentionList rows={data.attentionStudents} />
          <TeacherReportsRecentActivity data={data.recentActivity} />
          <TeacherClassReportStudentTable rows={data.studentRows} />
          <TeacherClassReportTopicBreakdown rows={data.topicBreakdown} />
        </div>
      )}
    </TeacherWorkspaceBoard>
  );
}
```

```tsx
// src/App.tsx
<Route path="/teacher/reports/classes/:classId">
  {() => <Redirect to="/teacher/reports" replace />}
</Route>
<Route path="/teacher/reports">
  {() => <AppLayout sidebarMode="hidden"><TeacherReportsPage /></AppLayout>}
</Route>
```

- [ ] **Step 4: Run the final verification suite**

Run: `deno test src/lib/teacher-reports.test.ts src/lib/teacher-reports-pdf.test.ts src/lib/teacher-nav.test.ts src/lib/student-portal.test.ts src/lib/student-nav.test.ts supabase/functions/_shared/teacher_singleton_class_test.ts supabase/functions/student-register/handler_test.ts supabase/functions/student-login/handler_test.ts supabase/functions/classes-list/handler_test.ts supabase/functions/classes-roster/handler_test.ts supabase/functions/classes-add-students/handler_test.ts supabase/functions/classes-remove-student/handler_test.ts supabase/functions/classes-create/handler_test.ts supabase/functions/classes-join/handler_test.ts supabase/functions/attempts-submit/handler_test.ts supabase/functions/reports-overview/handler_test.ts supabase/functions/reports-class/handler_test.ts`
Expected: PASS

Run: `npm run typecheck`
Expected: PASS

Run: `npm run build`
Expected: PASS

Run: `npm run dev`
Expected:
- `/teacher` opens the singleton classroom workspace with no class cards, class name, or join code.
- `/teacher/reports` shows the classroom summary, attention list, recent activity, student table, and topic breakdown in one page.
- `/teacher/classes`, `/teacher/classes/:classId`, and `/teacher/reports/classes/:classId` redirect safely.
- `/student` no longer shows join-code UI or multi-class copy.
- `/student/classroom` is the only classroom-detail page.
- Student login and signup require teacher first name instead of class code.
- Lesson exit routes return to `/student/classroom` when `returnTo=class`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/teacher-reports.ts src/lib/teacher-reports.test.ts src/lib/teacher-reports-pdf.ts src/lib/teacher-reports-pdf.test.ts supabase/functions/_shared/teacher_reports.ts supabase/functions/reports-overview/handler.ts supabase/functions/reports-overview/handler_test.ts supabase/functions/reports-class/handler.ts supabase/functions/reports-class/handler_test.ts src/components/teacher/reports/TeacherReportsClassroomSummary.tsx src/components/teacher/reports/TeacherReportsAttentionList.tsx src/components/teacher/reports/TeacherReportsRecentActivity.tsx src/components/teacher/reports/TeacherClassReportStudentTable.tsx src/components/teacher/reports/TeacherClassReportTopicBreakdown.tsx src/components/teacher/reports/TeacherClassReportPdfButton.tsx src/pages/teacher.tsx src/App.tsx
git commit -m "feat: refactor reports for one classroom"
```
