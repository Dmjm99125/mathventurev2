# Teacher Add Students Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the real `+ Add` workflow in the teacher class workspace so teachers can add students manually, from strict `xlsx`, or from strict `json`, review the normalized roster, then create and enroll hidden student accounts immediately.

**Architecture:** Keep the existing `/teacher/classes/:classId` page and replace the disabled `+ Add` control with a responsive add-students workflow mounted in page state. Put row normalization, import validation, and flow transitions in small Deno-testable `src/lib` modules, expose one teacher-only `classes-add-students` edge function for batch creation, and extract the shared hidden-student provisioning path from `student-register` so both flows create identical accounts. Preserve the requested all-or-nothing behavior by prevalidating every row up front and rolling back any already-created auth users if a later row fails; the existing `on delete cascade` relations clean up `profiles` and `class_students` without a new schema.

**Tech Stack:** React 19, TypeScript, Wouter, TanStack React Query, Tailwind CSS 4, Supabase Edge Functions (Deno), Deno tests, `xlsx`, `tsc`, Vite

## Global Constraints

- Teacher-added students must be real hidden student accounts, not roster placeholders.
- Teacher-added students must sign in later using `last name + first name` only.
- The first version requires only `Last Name` and `First Name`.
- `xlsx` import uses a strict two-column template: `lastName`, `firstName`.
- `json` import uses a strict array of objects: `{ "lastName": "...", "firstName": "..." }`.
- Duplicate-name handling is explicitly deferred for now.
- Creation should be all-or-nothing for a submitted batch.
- No new database schema is needed for this phase.
- On larger screens, the add flow should appear as a centered modal/dialog layered over the teacher class workspace.
- On mobile, the add flow should use a full-height sheet or dialog treatment.
- If database changes are needed, each new schema change must be created as its own new PostgreSQL migration file rather than editing old migration files.

---

## File Map

- Modify: `package.json`
  Responsibility: add the browser-side `xlsx` dependency needed for strict workbook parsing.
- Modify: `package-lock.json`
  Responsibility: capture the resolved `xlsx` dependency tree.
- Create: `src/lib/teacher-add-students.ts`
  Responsibility: own the shared add-students contracts plus pure normalization and strict JSON/XLSX-shape validation.
- Create: `src/lib/teacher-add-students.test.ts`
  Responsibility: prove manual rows, JSON input, and worksheet rows normalize correctly and fail closed on invalid shapes.
- Create: `src/lib/teacher-add-students-xlsx.ts`
  Responsibility: keep the browser-only `xlsx` adapter thin by converting the first worksheet into matrix rows and delegating validation to `src/lib/teacher-add-students.ts`.
- Create: `supabase/functions/_shared/hidden_student_provision.ts`
  Responsibility: normalize student identity once, create the hidden auth user, update the profile fields, and enroll the student in a class.
- Create: `supabase/functions/_shared/hidden_student_provision_test.ts`
  Responsibility: prove shared normalization and provisioning order stay stable for both register flows.
- Modify: `supabase/functions/student-register/handler.ts:1-173`
  Responsibility: swap in the shared hidden-student helper while preserving the existing student self-registration contract.
- Modify: `supabase/functions/student-register/handler_test.ts:1-107`
  Responsibility: keep the current register behavior covered after the dependency shape changes to the shared helper.
- Create: `supabase/functions/classes-add-students/handler.ts`
  Responsibility: validate teacher ownership, validate every submitted row, create/enroll the hidden student accounts, and roll back any created users on failure.
- Create: `supabase/functions/classes-add-students/handler_test.ts`
  Responsibility: prove teacher auth, ownership checks, success summary, duplicate rejection, and rollback behavior.
- Create: `supabase/functions/classes-add-students/index.ts`
  Responsibility: thin Deno entrypoint for the new edge function.
- Modify: `src/lib/api.ts:29-156`
  Responsibility: expose the new add-students request/response types and the `classes-add-students` invoke wrapper.
- Modify: `src/lib/hooks.ts:1-122`
  Responsibility: expose the add-students mutation and invalidate the class roster, class list, and teacher dashboard after success.
- Create: `src/lib/teacher-add-students-flow.ts`
  Responsibility: keep the source -> entry -> review -> result transitions in a pure reducer the UI can reuse.
- Create: `src/lib/teacher-add-students-flow.test.ts`
  Responsibility: prove the source picker, review transition, back transition, and result transition behave predictably.
- Create: `src/components/teacher/add-students/TeacherAddStudentsDialog.tsx`
  Responsibility: own the responsive desktop/mobile shell, wire the reducer, call the mutation, and swap step content.
- Create: `src/components/teacher/add-students/TeacherAddStudentsSourcePicker.tsx`
  Responsibility: render the three source choices and their shared "review before create" messaging.
- Create: `src/components/teacher/add-students/TeacherAddStudentsManualEditor.tsx`
  Responsibility: manage multiple `Last Name`/`First Name` rows, add/remove rows, and hand normalized rows upward.
- Create: `src/components/teacher/add-students/TeacherAddStudentsImportStep.tsx`
  Responsibility: accept one uploaded `.xlsx` or `.json` file, parse it, and surface strict-template errors inline.
- Create: `src/components/teacher/add-students/TeacherAddStudentsReviewTable.tsx`
  Responsibility: render the shared normalized review table plus confirm/back controls.
- Create: `src/components/teacher/add-students/TeacherAddStudentsResultStep.tsx`
  Responsibility: render the created-count and class-name success summary before closing.
- Modify: `src/pages/teacher.tsx:108-192`
  Responsibility: replace the disabled `+ Add` placeholder with the live dialog and keep roster removal intact.

### Task 1: Add-Students Parsing Contracts

**Files:**
- Modify: `package.json:1-84`
- Modify: `package-lock.json`
- Create: `src/lib/teacher-add-students.ts`
- Create: `src/lib/teacher-add-students.test.ts`
- Create: `src/lib/teacher-add-students-xlsx.ts`

**Interfaces:**
- Consumes: none
- Produces: `type TeacherAddStudentDraft = { lastName: string; firstName: string }`
- Produces: `type TeacherAddStudentsResult = { classId: string; className: string; createdCount: number }`
- Produces: `function normalizeTeacherAddStudentRows(rows: { lastName: unknown; firstName: unknown }[]): TeacherAddStudentDraft[]`
- Produces: `function parseTeacherStudentsJson(text: string): TeacherAddStudentDraft[]`
- Produces: `function parseTeacherStudentsWorksheet(rows: unknown[][]): TeacherAddStudentDraft[]`
- Produces: `function parseTeacherStudentsXlsxFile(file: File): Promise<TeacherAddStudentDraft[]>`

- [ ] **Step 1: Write the failing parser tests**

```ts
// src/lib/teacher-add-students.test.ts
import { assertEquals, assertThrows } from "jsr:@std/assert";
import {
  normalizeTeacherAddStudentRows,
  parseTeacherStudentsJson,
  parseTeacherStudentsWorksheet,
} from "./teacher-add-students.ts";

Deno.test("normalizeTeacherAddStudentRows trims names and rejects incomplete rows", () => {
  assertEquals(
    normalizeTeacherAddStudentRows([
      { lastName: "  Dela   Cruz ", firstName: "  Juan  " },
      { lastName: " Santos", firstName: "Maria " },
    ]),
    [
      { lastName: "Dela Cruz", firstName: "Juan" },
      { lastName: "Santos", firstName: "Maria" },
    ],
  );

  assertThrows(
    () => normalizeTeacherAddStudentRows([{ lastName: "Only", firstName: "   " }]),
    Error,
    "Every student row needs both Last Name and First Name.",
  );
});

Deno.test("parseTeacherStudentsJson accepts only the strict lastName/firstName array shape", () => {
  assertEquals(
    parseTeacherStudentsJson('[{"lastName":" Santos ","firstName":" Maria "}]'),
    [{ lastName: "Santos", firstName: "Maria" }],
  );

  assertThrows(
    () => parseTeacherStudentsJson('{"lastName":"Santos"}'),
    Error,
    "Upload a JSON array of objects with only lastName and firstName.",
  );

  assertThrows(
    () =>
      parseTeacherStudentsJson(
        '[{"lastName":"Santos","firstName":"Maria","section":"A"}]',
      ),
    Error,
    "Upload a JSON array of objects with only lastName and firstName.",
  );
});

Deno.test("parseTeacherStudentsWorksheet enforces the exact xlsx header row", () => {
  assertEquals(
    parseTeacherStudentsWorksheet([
      ["lastName", "firstName"],
      [" Santos ", " Maria "],
      ["Cruz", "Paolo"],
    ]),
    [
      { lastName: "Santos", firstName: "Maria" },
      { lastName: "Cruz", firstName: "Paolo" },
    ],
  );

  assertThrows(
    () =>
      parseTeacherStudentsWorksheet([
        ["Last Name", "First Name"],
        ["Santos", "Maria"],
      ]),
    Error,
    "Use the exact XLSX columns: lastName, firstName.",
  );
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `deno test src/lib/teacher-add-students.test.ts`
Expected: FAIL with `Module not found` or `normalizeTeacherAddStudentRows is not a function`.

- [ ] **Step 3: Install the XLSX dependency**

```bash
npm install xlsx
```

Expected files changed: `package.json`, `package-lock.json`

- [ ] **Step 4: Write the minimal parsing implementation**

```ts
// src/lib/teacher-add-students.ts
export type TeacherAddStudentDraft = {
  lastName: string;
  firstName: string;
};

export type TeacherAddStudentsResult = {
  classId: string;
  className: string;
  createdCount: number;
};

function cleanStudentCell(value: unknown): string {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

export function normalizeTeacherAddStudentRows(
  rows: { lastName: unknown; firstName: unknown }[],
): TeacherAddStudentDraft[] {
  if (!rows.length) {
    throw new Error("Add at least one student before continuing.");
  }

  return rows.map((row) => {
    const lastName = cleanStudentCell(row.lastName);
    const firstName = cleanStudentCell(row.firstName);

    if (!lastName || !firstName) {
      throw new Error("Every student row needs both Last Name and First Name.");
    }

    return { lastName, firstName };
  });
}

export function parseTeacherStudentsJson(text: string): TeacherAddStudentDraft[] {
  const parsed = JSON.parse(text) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("Upload a JSON array of objects with only lastName and firstName.");
  }

  const rows = parsed.map((item) => {
    if (!item || Array.isArray(item) || typeof item !== "object") {
      throw new Error("Upload a JSON array of objects with only lastName and firstName.");
    }

    const record = item as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    if (keys.join(",") !== "firstName,lastName") {
      throw new Error("Upload a JSON array of objects with only lastName and firstName.");
    }

    return {
      lastName: record.lastName,
      firstName: record.firstName,
    };
  });

  return normalizeTeacherAddStudentRows(rows);
}

export function parseTeacherStudentsWorksheet(rows: unknown[][]): TeacherAddStudentDraft[] {
  if (rows.length < 2) {
    throw new Error("Add at least one student before continuing.");
  }

  const [header, ...dataRows] = rows;
  if (
    (header?.[0] ?? "") !== "lastName" ||
    (header?.[1] ?? "") !== "firstName" ||
    header.length !== 2
  ) {
    throw new Error("Use the exact XLSX columns: lastName, firstName.");
  }

  const filteredRows = dataRows.filter((row) =>
    row.some((cell) => cleanStudentCell(cell)),
  );

  return normalizeTeacherAddStudentRows(
    filteredRows.map((row) => ({
      lastName: row[0],
      firstName: row[1],
    })),
  );
}
```

```ts
// src/lib/teacher-add-students-xlsx.ts
import * as XLSX from "xlsx";
import {
  parseTeacherStudentsWorksheet,
  type TeacherAddStudentDraft,
} from "./teacher-add-students";

export async function parseTeacherStudentsXlsxFile(
  file: File,
): Promise<TeacherAddStudentDraft[]> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

  if (!firstSheet) {
    throw new Error("The workbook is empty.");
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, {
    header: 1,
    blankrows: false,
    defval: "",
  });

  return parseTeacherStudentsWorksheet(rows);
}
```

- [ ] **Step 5: Run the parser tests and typecheck**

Run: `deno test src/lib/teacher-add-students.test.ts`
Expected: PASS

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/lib/teacher-add-students.ts src/lib/teacher-add-students.test.ts src/lib/teacher-add-students-xlsx.ts
git commit -m "feat: add teacher student import parsers"
```

### Task 2: Shared Hidden-Student Provisioning

**Files:**
- Create: `supabase/functions/_shared/hidden_student_provision.ts`
- Create: `supabase/functions/_shared/hidden_student_provision_test.ts`
- Modify: `supabase/functions/student-register/handler.ts:1-173`
- Modify: `supabase/functions/student-register/handler_test.ts:1-107`

**Interfaces:**
- Consumes: `normalizeLastName`, `normalizeFirstName`, `studentDisplayName`, `buildStudentEmail` from `supabase/functions/_shared/student_auth.ts`
- Produces: `type NormalizedStudentIdentity = { rawLastName: string; rawFirstName: string; normalizedLastName: string; normalizedFirstName: string; fullName: string }`
- Produces: `function normalizeStudentIdentity(input: { lastName: string; firstName: string }): NormalizedStudentIdentity | null`
- Produces: `type HiddenStudentProvisionPersistence = { createHiddenStudent(input: { rawLastName: string; rawFirstName: string }): Promise<{ id: string; email: string }>; updateStudentProfile(input: { studentId: string; rawLastName: string; normalizedLastName: string; rawFirstName: string; normalizedFirstName: string }): Promise<void>; enrollStudent(input: { classId: string; studentId: string }): Promise<void> }`
- Produces: `async function provisionHiddenStudentForClass(persistence: HiddenStudentProvisionPersistence, input: { classId: string; identity: NormalizedStudentIdentity }): Promise<{ studentId: string; email: string }>`
- Produces: `StudentRegisterDeps["provisionStudentForClass"] = (input: { classId: string; identity: NormalizedStudentIdentity }) => Promise<{ studentId: string; email: string }>`

- [ ] **Step 1: Write the failing shared-helper tests and the updated register regression**

```ts
// supabase/functions/_shared/hidden_student_provision_test.ts
import { assertEquals } from "jsr:@std/assert";
import {
  normalizeStudentIdentity,
  provisionHiddenStudentForClass,
} from "./hidden_student_provision.ts";

Deno.test("normalizeStudentIdentity trims names and computes normalized fields", () => {
  assertEquals(
    normalizeStudentIdentity({
      lastName: " Dela  Cruz ",
      firstName: " Maria ",
    }),
    {
      rawLastName: "Dela Cruz",
      rawFirstName: "Maria",
      normalizedLastName: "DELA CRUZ",
      normalizedFirstName: "MARIA",
      fullName: "Dela Cruz, Maria",
    },
  );

  assertEquals(
    normalizeStudentIdentity({ lastName: " ", firstName: "Maria" }),
    null,
  );
});

Deno.test("provisionHiddenStudentForClass creates the auth user, updates the profile, and enrolls the class", async () => {
  const calls: string[] = [];

  const created = await provisionHiddenStudentForClass(
    {
      createHiddenStudent: async () => {
        calls.push("createHiddenStudent");
        return {
          id: "student-1",
          email: "student.one@auth.mathventure.invalid",
        };
      },
      updateStudentProfile: async () => {
        calls.push("updateStudentProfile");
      },
      enrollStudent: async () => {
        calls.push("enrollStudent");
      },
    },
    {
      classId: "class-1",
      identity: {
        rawLastName: "Santos",
        rawFirstName: "Maria",
        normalizedLastName: "SANTOS",
        normalizedFirstName: "MARIA",
        fullName: "Santos, Maria",
      },
    },
  );

  assertEquals(created, {
    studentId: "student-1",
    email: "student.one@auth.mathventure.invalid",
  });
  assertEquals(calls, [
    "createHiddenStudent",
    "updateStudentProfile",
    "enrollStudent",
  ]);
});
```

```ts
// supabase/functions/student-register/handler_test.ts
Deno.test("student-register returns already_registered when the student name already exists", async () => {
  const handler = createStudentRegisterHandler({
    findClassByCode: async () => ({ id: "class-1", name: "Section A" }),
    hasStudentWithNormalizedName: async () => true,
    provisionStudentForClass: async () => {
      throw new Error("should not provision a student");
    },
    issueStudentSession: async () => {
      throw new Error("should not issue a session");
    },
  });

  const response = await handler(
    new Request("http://local/student-register", {
      method: "POST",
      body: JSON.stringify({
        classCode: "abc123",
        lastName: "Dela Cruz",
        firstName: "Juan",
      }),
    }),
  );

  assertEquals(response.status, 409);
  assertEquals(await response.json(), { status: "already_registered" });
});

Deno.test("student-register creates a student, enrolls the class, and returns a token hash", async () => {
  const calls: string[] = [];
  const handler = createStudentRegisterHandler({
    findClassByCode: async () => ({ id: "class-1", name: "Section A" }),
    hasStudentWithNormalizedName: async () => false,
    provisionStudentForClass: async () => {
      calls.push("provisionStudentForClass");
      return {
        studentId: "student-1",
        email: "student.test-key@auth.mathventure.invalid",
      };
    },
    issueStudentSession: async () => {
      calls.push("issueStudentSession");
      return {
        status: "ok" as const,
        email: "student.test-key@auth.mathventure.invalid",
        tokenHash: "token-hash",
        verifyType: "email" as const,
      };
    },
  });

  const response = await handler(
    new Request("http://local/student-register", {
      method: "POST",
      body: JSON.stringify({
        classCode: "abc123",
        lastName: "Santos",
        firstName: "Maria",
      }),
    }),
  );

  assertEquals(response.status, 201);
  assertEquals(calls, ["provisionStudentForClass", "issueStudentSession"]);
});
```

- [ ] **Step 2: Run the shared-helper and register tests to verify they fail**

Run: `deno test supabase/functions/_shared/hidden_student_provision_test.ts supabase/functions/student-register/handler_test.ts`
Expected: FAIL with `Module not found` or `provisionStudentForClass` missing from `StudentRegisterDeps`.

- [ ] **Step 3: Implement the shared helper and refactor student-register to use it**

```ts
// supabase/functions/_shared/hidden_student_provision.ts
import { adminClient } from "./client.ts";
import {
  buildStudentEmail,
  normalizeFirstName,
  normalizeLastName,
  studentDisplayName,
} from "./student_auth.ts";

export type NormalizedStudentIdentity = {
  rawLastName: string;
  rawFirstName: string;
  normalizedLastName: string;
  normalizedFirstName: string;
  fullName: string;
};

export type HiddenStudentProvisionPersistence = {
  createHiddenStudent(input: {
    rawLastName: string;
    rawFirstName: string;
  }): Promise<{ id: string; email: string }>;
  updateStudentProfile(input: {
    studentId: string;
    rawLastName: string;
    normalizedLastName: string;
    rawFirstName: string;
    normalizedFirstName: string;
  }): Promise<void>;
  enrollStudent(input: { classId: string; studentId: string }): Promise<void>;
};

export function normalizeStudentIdentity(
  input: { lastName: string; firstName: string },
): NormalizedStudentIdentity | null {
  const rawLastName = input.lastName.trim().replace(/\s+/g, " ");
  const rawFirstName = input.firstName.trim().replace(/\s+/g, " ");
  const normalizedLastName = normalizeLastName(rawLastName);
  const normalizedFirstName = normalizeFirstName(rawFirstName);

  if (!normalizedLastName || !normalizedFirstName) {
    return null;
  }

  return {
    rawLastName,
    rawFirstName,
    normalizedLastName,
    normalizedFirstName,
    fullName: studentDisplayName(rawLastName, rawFirstName),
  };
}

export const defaultHiddenStudentProvisionPersistence: HiddenStudentProvisionPersistence = {
  async createHiddenStudent({ rawLastName, rawFirstName }) {
    const email = buildStudentEmail(crypto.randomUUID());
    const password = `${crypto.randomUUID()}${crypto.randomUUID()}`;
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: "student",
        full_name: studentDisplayName(rawLastName, rawFirstName),
        first_name: rawFirstName,
        last_name: rawLastName,
      },
    });

    if (error || !data.user) {
      throw error ?? new Error("Failed to create student auth user");
    }

    return { id: data.user.id, email };
  },
  async updateStudentProfile({
    studentId,
    rawLastName,
    normalizedLastName,
    rawFirstName,
    normalizedFirstName,
  }) {
    const { error } = await adminClient
      .from("profiles")
      .update({
        full_name: studentDisplayName(rawLastName, rawFirstName),
        first_name: rawFirstName,
        normalized_first_name: normalizedFirstName,
        last_name: rawLastName,
        normalized_last_name: normalizedLastName,
      })
      .eq("id", studentId);

    if (error) {
      throw error;
    }
  },
  async enrollStudent({ classId, studentId }) {
    const { error } = await adminClient
      .from("class_students")
      .insert({ class_id: classId, student_id: studentId });

    if (error) {
      throw error;
    }
  },
};

export async function provisionHiddenStudentForClass(
  persistence: HiddenStudentProvisionPersistence,
  input: { classId: string; identity: NormalizedStudentIdentity },
): Promise<{ studentId: string; email: string }> {
  const created = await persistence.createHiddenStudent({
    rawLastName: input.identity.rawLastName,
    rawFirstName: input.identity.rawFirstName,
  });

  await persistence.updateStudentProfile({
    studentId: created.id,
    rawLastName: input.identity.rawLastName,
    normalizedLastName: input.identity.normalizedLastName,
    rawFirstName: input.identity.rawFirstName,
    normalizedFirstName: input.identity.normalizedFirstName,
  });

  await persistence.enrollStudent({
    classId: input.classId,
    studentId: created.id,
  });

  return { studentId: created.id, email: created.email };
}
```

```ts
// supabase/functions/student-register/handler.ts
import {
  defaultHiddenStudentProvisionPersistence,
  normalizeStudentIdentity,
  provisionHiddenStudentForClass,
  type NormalizedStudentIdentity,
} from "../_shared/hidden_student_provision.ts";

type StudentRegisterDeps = {
  findClassByCode(joinCode: string): Promise<{ id: string; name: string } | null>;
  hasStudentWithNormalizedName(
    normalizedLastName: string,
    normalizedFirstName: string,
  ): Promise<boolean>;
  provisionStudentForClass(input: {
    classId: string;
    identity: NormalizedStudentIdentity;
  }): Promise<{ studentId: string; email: string }>;
  issueStudentSession(email: string): Promise<StudentRegisterSession>;
};

const defaultDeps: StudentRegisterDeps = {
  async findClassByCode(joinCode) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("classes")
      .select("id, name")
      .eq("join_code", joinCode)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
  async hasStudentWithNormalizedName(normalizedLastName, normalizedFirstName) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("profiles")
      .select("id")
      .eq("role", "student")
      .eq("normalized_last_name", normalizedLastName)
      .eq("normalized_first_name", normalizedFirstName)
      .limit(1);
    if (error) throw error;
    return (data?.length ?? 0) > 0;
  },
  async provisionStudentForClass(input) {
    return provisionHiddenStudentForClass(
      defaultHiddenStudentProvisionPersistence,
      input,
    );
  },
  async issueStudentSession(email) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (error || !data?.properties?.hashed_token) {
      throw error ?? new Error("Failed to generate student magic link");
    }
    return {
      status: "ok",
      email,
      tokenHash: data.properties.hashed_token,
      verifyType: STUDENT_VERIFY_TYPE,
    };
  },
};

const identity = normalizeStudentIdentity({
  lastName: rawLastName,
  firstName: rawFirstName,
});
if (!identity) {
  return errorResponse("Please enter the student's last name and first name.", 422);
}

const existingStudent = await deps.hasStudentWithNormalizedName(
  identity.normalizedLastName,
  identity.normalizedFirstName,
);

const created = await deps.provisionStudentForClass({
  classId: klass.id,
  identity,
});
return jsonResponse(await deps.issueStudentSession(created.email), 201);
```

- [ ] **Step 4: Run the shared-helper and register tests**

Run: `deno test supabase/functions/_shared/hidden_student_provision_test.ts supabase/functions/student-register/handler_test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/_shared/hidden_student_provision.ts supabase/functions/_shared/hidden_student_provision_test.ts supabase/functions/student-register/handler.ts supabase/functions/student-register/handler_test.ts
git commit -m "refactor: share hidden student provisioning"
```

### Task 3: Teacher Batch Add Edge Function

**Files:**
- Create: `supabase/functions/classes-add-students/handler.ts`
- Create: `supabase/functions/classes-add-students/handler_test.ts`
- Create: `supabase/functions/classes-add-students/index.ts`

**Interfaces:**
- Consumes: `normalizeStudentIdentity` and `provisionHiddenStudentForClass` behavior from `supabase/functions/_shared/hidden_student_provision.ts`
- Produces: `type ClassesAddStudentsDeps = { getAuthedProfile(req: Request): Promise<AuthedProfile | null>; findOwnedClass(classId: string): Promise<{ id: string; teacherId: string; name: string } | null>; hasStudentWithNormalizedName(normalizedLastName: string, normalizedFirstName: string): Promise<boolean>; provisionStudentForClass(input: { classId: string; identity: NormalizedStudentIdentity }): Promise<{ studentId: string; email: string }>; deleteHiddenStudent(studentId: string): Promise<void> }`
- Produces: `function createClassesAddStudentsHandler(deps?: ClassesAddStudentsDeps): (req: Request) => Promise<Response>`
- Produces: response JSON `{ classId: string; className: string; createdCount: number }`

- [ ] **Step 1: Write the failing handler tests**

```ts
// supabase/functions/classes-add-students/handler_test.ts
import { assertEquals } from "jsr:@std/assert";
import { createClassesAddStudentsHandler } from "./handler.ts";

Deno.test("classes-add-students rejects non-teacher callers", async () => {
  const handler = createClassesAddStudentsHandler({
    getAuthedProfile: async () => ({
      id: "student-1",
      role: "student",
      full_name: "Student One",
    }),
    findOwnedClass: async () => ({
      id: "class-1",
      teacherId: "teacher-1",
      name: "Class A",
    }),
    hasStudentWithNormalizedName: async () => false,
    provisionStudentForClass: async () => {
      throw new Error("should not create users");
    },
    deleteHiddenStudent: async () => {},
  });

  const response = await handler(
    new Request("http://local/classes-add-students", {
      method: "POST",
      body: JSON.stringify({
        classId: "class-1",
        students: [{ lastName: "Santos", firstName: "Maria" }],
      }),
    }),
  );

  assertEquals(response.status, 403);
  assertEquals(await response.json(), {
    error: "Only teachers can add students",
  });
});

Deno.test("classes-add-students creates every student and returns a summary", async () => {
  const provisioned: string[] = [];
  const handler = createClassesAddStudentsHandler({
    getAuthedProfile: async () => ({
      id: "teacher-1",
      role: "teacher",
      full_name: "Teacher One",
    }),
    findOwnedClass: async () => ({
      id: "class-1",
      teacherId: "teacher-1",
      name: "Class A",
    }),
    hasStudentWithNormalizedName: async () => false,
    provisionStudentForClass: async ({ identity }) => {
      provisioned.push(`${identity.normalizedLastName}:${identity.normalizedFirstName}`);
      return {
        studentId: crypto.randomUUID(),
        email: "student@auth.mathventure.invalid",
      };
    },
    deleteHiddenStudent: async () => {},
  });

  const response = await handler(
    new Request("http://local/classes-add-students", {
      method: "POST",
      body: JSON.stringify({
        classId: "class-1",
        students: [
          { lastName: "Santos", firstName: "Maria" },
          { lastName: "Cruz", firstName: "Paolo" },
        ],
      }),
    }),
  );

  assertEquals(response.status, 201);
  assertEquals(await response.json(), {
    classId: "class-1",
    className: "Class A",
    createdCount: 2,
  });
  assertEquals(provisioned, ["SANTOS:MARIA", "CRUZ:PAOLO"]);
});

Deno.test("classes-add-students rolls back already-created students when a later row fails", async () => {
  const deleted: string[] = [];
  let callCount = 0;
  const handler = createClassesAddStudentsHandler({
    getAuthedProfile: async () => ({
      id: "teacher-1",
      role: "teacher",
      full_name: "Teacher One",
    }),
    findOwnedClass: async () => ({
      id: "class-1",
      teacherId: "teacher-1",
      name: "Class A",
    }),
    hasStudentWithNormalizedName: async () => false,
    provisionStudentForClass: async () => {
      callCount += 1;
      if (callCount === 1) {
        return {
          studentId: "student-1",
          email: "student-1@auth.mathventure.invalid",
        };
      }
      throw new Error("boom");
    },
    deleteHiddenStudent: async (studentId) => {
      deleted.push(studentId);
    },
  });

  const response = await handler(
    new Request("http://local/classes-add-students", {
      method: "POST",
      body: JSON.stringify({
        classId: "class-1",
        students: [
          { lastName: "Santos", firstName: "Maria" },
          { lastName: "Cruz", firstName: "Paolo" },
        ],
      }),
    }),
  );

  assertEquals(response.status, 500);
  assertEquals(deleted, ["student-1"]);
});

Deno.test("classes-add-students rejects duplicate normalized names inside the same batch", async () => {
  const handler = createClassesAddStudentsHandler({
    getAuthedProfile: async () => ({
      id: "teacher-1",
      role: "teacher",
      full_name: "Teacher One",
    }),
    findOwnedClass: async () => ({
      id: "class-1",
      teacherId: "teacher-1",
      name: "Class A",
    }),
    hasStudentWithNormalizedName: async () => false,
    provisionStudentForClass: async () => {
      throw new Error("should not create users");
    },
    deleteHiddenStudent: async () => {},
  });

  const response = await handler(
    new Request("http://local/classes-add-students", {
      method: "POST",
      body: JSON.stringify({
        classId: "class-1",
        students: [
          { lastName: " Santos ", firstName: "Maria" },
          { lastName: "Santos", firstName: " Maria " },
        ],
      }),
    }),
  );

  assertEquals(response.status, 409);
  assertEquals(await response.json(), {
    error: "Each student name can appear only once per batch.",
  });
});
```

- [ ] **Step 2: Run the handler tests to verify they fail**

Run: `deno test supabase/functions/classes-add-students/handler_test.ts`
Expected: FAIL with `Module not found`.

- [ ] **Step 3: Implement the new edge function and rollback behavior**

```ts
// supabase/functions/classes-add-students/handler.ts
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import type { AuthedProfile } from "../_shared/client.ts";
import {
  defaultHiddenStudentProvisionPersistence,
  normalizeStudentIdentity,
  provisionHiddenStudentForClass,
  type NormalizedStudentIdentity,
} from "../_shared/hidden_student_provision.ts";

type ClassesAddStudentsDeps = {
  getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
  findOwnedClass(
    classId: string,
  ): Promise<{ id: string; teacherId: string; name: string } | null>;
  hasStudentWithNormalizedName(
    normalizedLastName: string,
    normalizedFirstName: string,
  ): Promise<boolean>;
  provisionStudentForClass(input: {
    classId: string;
    identity: NormalizedStudentIdentity;
  }): Promise<{ studentId: string; email: string }>;
  deleteHiddenStudent(studentId: string): Promise<void>;
};

const defaultDeps: ClassesAddStudentsDeps = {
  async getAuthedProfile(req) {
    const { getAuthedProfile } = await import("../_shared/client.ts");
    return getAuthedProfile(req);
  },
  async findOwnedClass(classId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("classes")
      .select("id, teacher_id, name")
      .eq("id", classId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id as string,
      teacherId: data.teacher_id as string,
      name: data.name as string,
    };
  },
  async hasStudentWithNormalizedName(normalizedLastName, normalizedFirstName) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("profiles")
      .select("id")
      .eq("role", "student")
      .eq("normalized_last_name", normalizedLastName)
      .eq("normalized_first_name", normalizedFirstName)
      .limit(1);

    if (error) throw error;
    return (data?.length ?? 0) > 0;
  },
  async provisionStudentForClass(input) {
    return provisionHiddenStudentForClass(
      defaultHiddenStudentProvisionPersistence,
      input,
    );
  },
  async deleteHiddenStudent(studentId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { error } = await adminClient.auth.admin.deleteUser(studentId);
    if (error) throw error;
  },
};

function buildIdentityKey(identity: NormalizedStudentIdentity): string {
  return `${identity.normalizedLastName}:${identity.normalizedFirstName}`;
}

export function createClassesAddStudentsHandler(
  deps: ClassesAddStudentsDeps = defaultDeps,
) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }
    if (req.method !== "POST") {
      return errorResponse("Method not allowed", 405);
    }

    try {
      const profile = await deps.getAuthedProfile(req);
      if (!profile) {
        return errorResponse("Unauthorized", 401);
      }
      if (profile.role !== "teacher") {
        return errorResponse("Only teachers can add students", 403);
      }

      const body = await req.json().catch(() => null);
      const classId = typeof body?.classId === "string" ? body.classId : "";
      const students = Array.isArray(body?.students) ? body.students : [];

      if (!classId || !students.length) {
        return errorResponse("classId and at least one student are required", 422);
      }

      const klass = await deps.findOwnedClass(classId);
      if (!klass) {
        return errorResponse("Class not found", 404);
      }
      if (klass.teacherId !== profile.id) {
        return errorResponse("Forbidden", 403);
      }

      const identities = students.map((student) =>
        normalizeStudentIdentity({
          lastName: typeof student?.lastName === "string" ? student.lastName : "",
          firstName: typeof student?.firstName === "string" ? student.firstName : "",
        }),
      );

      if (identities.some((identity) => identity === null)) {
        return errorResponse(
          "Every student row needs both Last Name and First Name.",
          422,
        );
      }

      const normalizedIdentities = identities as NormalizedStudentIdentity[];
      const seen = new Set<string>();
      for (const identity of normalizedIdentities) {
        const key = buildIdentityKey(identity);
        if (seen.has(key)) {
          return errorResponse("Each student name can appear only once per batch.", 409);
        }
        seen.add(key);
      }

      for (const identity of normalizedIdentities) {
        const existing = await deps.hasStudentWithNormalizedName(
          identity.normalizedLastName,
          identity.normalizedFirstName,
        );
        if (existing) {
          return errorResponse(
            `A student named ${identity.fullName} already exists.`,
            409,
          );
        }
      }

      const createdStudentIds: string[] = [];

      try {
        for (const identity of normalizedIdentities) {
          const created = await deps.provisionStudentForClass({
            classId: klass.id,
            identity,
          });
          createdStudentIds.push(created.studentId);
        }
      } catch (error) {
        await Promise.allSettled(
          createdStudentIds.map((studentId) => deps.deleteHiddenStudent(studentId)),
        );
        throw error;
      }

      return jsonResponse(
        {
          classId: klass.id,
          className: klass.name,
          createdCount: createdStudentIds.length,
        },
        201,
      );
    } catch (error) {
      console.error("classes-add-students failed", error);
      return errorResponse("We couldn't add those students right now.", 500);
    }
  };
}
```

```ts
// supabase/functions/classes-add-students/index.ts
import { createClassesAddStudentsHandler } from "./handler.ts";

const handler = createClassesAddStudentsHandler();

Deno.serve(handler);
```

- [ ] **Step 4: Run the handler tests**

Run: `deno test supabase/functions/classes-add-students/handler_test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/classes-add-students/handler.ts supabase/functions/classes-add-students/handler_test.ts supabase/functions/classes-add-students/index.ts
git commit -m "feat: add teacher classes-add-students function"
```

### Task 4: Client API And Flow State

**Files:**
- Modify: `src/lib/api.ts:29-156`
- Modify: `src/lib/hooks.ts:1-122`
- Create: `src/lib/teacher-add-students-flow.ts`
- Create: `src/lib/teacher-add-students-flow.test.ts`

**Interfaces:**
- Consumes: `TeacherAddStudentDraft` and `TeacherAddStudentsResult` from `src/lib/teacher-add-students.ts`
- Consumes: `classes-add-students` response JSON `{ classId: string; className: string; createdCount: number }`
- Produces: `api.classes.addStudents(classId: string, students: TeacherAddStudentDraft[]): Promise<TeacherAddStudentsResult>`
- Produces: `useAddStudentsToClass(): UseMutationResult<TeacherAddStudentsResult, Error, { classId: string; students: TeacherAddStudentDraft[] }>`
- Produces: `type TeacherAddStudentsSource = "manual" | "xlsx" | "json"`
- Produces: `type TeacherAddStudentsFlowState = { step: "source" | "entry" | "review" | "result"; source: TeacherAddStudentsSource | null; rows: TeacherAddStudentDraft[]; result: TeacherAddStudentsResult | null }`
- Produces: `function createInitialTeacherAddStudentsFlowState(): TeacherAddStudentsFlowState`
- Produces: `function teacherAddStudentsFlowReducer(state: TeacherAddStudentsFlowState, action: TeacherAddStudentsFlowAction): TeacherAddStudentsFlowState`

- [ ] **Step 1: Write the failing flow tests**

```ts
// src/lib/teacher-add-students-flow.test.ts
import { assertEquals } from "jsr:@std/assert";
import {
  createInitialTeacherAddStudentsFlowState,
  teacherAddStudentsFlowReducer,
} from "./teacher-add-students-flow.ts";

Deno.test("teacher add-students flow selects a source and moves to entry", () => {
  const next = teacherAddStudentsFlowReducer(
    createInitialTeacherAddStudentsFlowState(),
    { type: "source.selected", source: "manual" },
  );

  assertEquals(next, {
    step: "entry",
    source: "manual",
    rows: [],
    result: null,
  });
});

Deno.test("teacher add-students flow moves from entry to review and result", () => {
  const entry = teacherAddStudentsFlowReducer(
    createInitialTeacherAddStudentsFlowState(),
    { type: "source.selected", source: "json" },
  );
  const review = teacherAddStudentsFlowReducer(entry, {
    type: "rows.prepared",
    rows: [{ lastName: "Santos", firstName: "Maria" }],
  });
  const result = teacherAddStudentsFlowReducer(review, {
    type: "submission.succeeded",
    result: {
      classId: "class-1",
      className: "Class A",
      createdCount: 1,
    },
  });

  assertEquals(review.step, "review");
  assertEquals(result.step, "result");
  assertEquals(result.result?.createdCount, 1);
});

Deno.test("teacher add-students flow returns to the chosen entry step with rows preserved", () => {
  const review = teacherAddStudentsFlowReducer(
    teacherAddStudentsFlowReducer(
      createInitialTeacherAddStudentsFlowState(),
      { type: "source.selected", source: "xlsx" },
    ),
    {
      type: "rows.prepared",
      rows: [{ lastName: "Cruz", firstName: "Paolo" }],
    },
  );

  const entryAgain = teacherAddStudentsFlowReducer(review, {
    type: "review.back",
  });

  assertEquals(entryAgain, {
    step: "entry",
    source: "xlsx",
    rows: [{ lastName: "Cruz", firstName: "Paolo" }],
    result: null,
  });
});
```

- [ ] **Step 2: Run the flow tests to verify they fail**

Run: `deno test src/lib/teacher-add-students-flow.test.ts`
Expected: FAIL with `Module not found`.

- [ ] **Step 3: Implement the API wrapper, mutation hook, and pure reducer**

```ts
// src/lib/teacher-add-students-flow.ts
import type {
  TeacherAddStudentDraft,
  TeacherAddStudentsResult,
} from "./teacher-add-students";

export type TeacherAddStudentsSource = "manual" | "xlsx" | "json";

export type TeacherAddStudentsFlowState = {
  step: "source" | "entry" | "review" | "result";
  source: TeacherAddStudentsSource | null;
  rows: TeacherAddStudentDraft[];
  result: TeacherAddStudentsResult | null;
};

export type TeacherAddStudentsFlowAction =
  | { type: "reset" }
  | { type: "source.selected"; source: TeacherAddStudentsSource }
  | { type: "rows.prepared"; rows: TeacherAddStudentDraft[] }
  | { type: "review.back" }
  | { type: "submission.succeeded"; result: TeacherAddStudentsResult };

export function createInitialTeacherAddStudentsFlowState(): TeacherAddStudentsFlowState {
  return {
    step: "source",
    source: null,
    rows: [],
    result: null,
  };
}

export function teacherAddStudentsFlowReducer(
  state: TeacherAddStudentsFlowState,
  action: TeacherAddStudentsFlowAction,
): TeacherAddStudentsFlowState {
  switch (action.type) {
    case "reset":
      return createInitialTeacherAddStudentsFlowState();
    case "source.selected":
      return {
        step: "entry",
        source: action.source,
        rows: [],
        result: null,
      };
    case "rows.prepared":
      return {
        ...state,
        step: "review",
        rows: action.rows,
      };
    case "review.back":
      return {
        ...state,
        step: "entry",
      };
    case "submission.succeeded":
      return {
        ...state,
        step: "result",
        result: action.result,
      };
  }
}
```

```ts
// src/lib/api.ts (inside api.classes)
import type {
  TeacherAddStudentDraft,
  TeacherAddStudentsResult,
} from "./teacher-add-students";

addStudents: (classId: string, students: TeacherAddStudentDraft[]) =>
  invokeFunction<TeacherAddStudentsResult>("classes-add-students", {
    method: "POST",
    body: { classId, students },
  }),
```

```ts
// src/lib/hooks.ts
import type { TeacherAddStudentDraft } from "./teacher-add-students";

export function useAddStudentsToClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      classId,
      students,
    }: {
      classId: string;
      students: TeacherAddStudentDraft[];
    }) => api.classes.addStudents(classId, students),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["classes", variables.classId, "roster"],
      });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "teacher"] });
    },
  });
}
```

- [ ] **Step 4: Run the flow tests and typecheck**

Run: `deno test src/lib/teacher-add-students-flow.test.ts`
Expected: PASS

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/api.ts src/lib/hooks.ts src/lib/teacher-add-students-flow.ts src/lib/teacher-add-students-flow.test.ts
git commit -m "feat: add teacher add-students client flow state"
```

### Task 5: Teacher Add-Students UI Integration

**Files:**
- Create: `src/components/teacher/add-students/TeacherAddStudentsDialog.tsx`
- Create: `src/components/teacher/add-students/TeacherAddStudentsSourcePicker.tsx`
- Create: `src/components/teacher/add-students/TeacherAddStudentsManualEditor.tsx`
- Create: `src/components/teacher/add-students/TeacherAddStudentsImportStep.tsx`
- Create: `src/components/teacher/add-students/TeacherAddStudentsReviewTable.tsx`
- Create: `src/components/teacher/add-students/TeacherAddStudentsResultStep.tsx`
- Modify: `src/pages/teacher.tsx:108-192`

**Interfaces:**
- Consumes: `useAddStudentsToClass` from `src/lib/hooks.ts`
- Consumes: `parseTeacherStudentsJson` and `parseTeacherStudentsXlsxFile` from `src/lib/teacher-add-students.ts` and `src/lib/teacher-add-students-xlsx.ts`
- Consumes: `createInitialTeacherAddStudentsFlowState` and `teacherAddStudentsFlowReducer` from `src/lib/teacher-add-students-flow.ts`
- Produces: `TeacherAddStudentsDialog(props: { classId: string; className: string; open: boolean; onOpenChange(open: boolean): void }): JSX.Element`
- Produces: `TeacherAddStudentsSourcePicker(props: { onSelect(source: TeacherAddStudentsSource): void }): JSX.Element`
- Produces: `TeacherAddStudentsManualEditor(props: { initialRows: TeacherAddStudentDraft[]; onBack(): void; onContinue(rows: TeacherAddStudentDraft[]): void }): JSX.Element`
- Produces: `TeacherAddStudentsImportStep(props: { source: "xlsx" | "json"; onBack(): void; onContinue(rows: TeacherAddStudentDraft[]): void }): JSX.Element`
- Produces: `TeacherAddStudentsReviewTable(props: { rows: TeacherAddStudentDraft[]; isSubmitting: boolean; error: string | null; onBack(): void; onConfirm(): void }): JSX.Element`
- Produces: `TeacherAddStudentsResultStep(props: { result: TeacherAddStudentsResult; onDone(): void }): JSX.Element`

- [ ] **Step 1: Write the failing teacher page integration**

```tsx
// src/pages/teacher.tsx
import { TeacherAddStudentsDialog } from "@/components/teacher/add-students/TeacherAddStudentsDialog";

export function TeacherClassWorkspace({ classId }: { classId: string }) {
  const { data: classesData } = useClasses();
  const { data: rosterData, isLoading } = useClassRoster(classId);
  const removeStudent = useRemoveStudentFromClass();
  const [isAddStudentsOpen, setIsAddStudentsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"students" | "progress">("students");
  const [pendingRemoval, setPendingRemoval] = useState<TeacherClassStudent | null>(null);
  const classes = (classesData?.classes ?? []) as TeacherClassSummary[];
  const klass = classes.find((row) => row.id === classId);
  const students = (rosterData?.students ?? []) as TeacherClassStudent[];

  return (
    <TeacherWorkspaceBoard
      heading={(
        <>
          <h1 className="text-4xl font-display font-bold">{klass.name}</h1>
          <p className="mt-2 font-bold text-muted-foreground">Code: {klass.joinCode}</p>
        </>
      )}
      action={<Button variant="outline" onClick={() => setIsAddStudentsOpen(true)}>+ Add</Button>}
    >
      <TeacherAddStudentsDialog
        classId={classId}
        className={klass.name}
        open={isAddStudentsOpen}
        onOpenChange={setIsAddStudentsOpen}
      />
    </TeacherWorkspaceBoard>
  );
}
```

- [ ] **Step 2: Run typecheck to verify it fails**

Run: `npm run typecheck`
Expected: FAIL with `Cannot find module '@/components/teacher/add-students/TeacherAddStudentsDialog'`.

- [ ] **Step 3: Implement the responsive add-students workflow components**

```tsx
// src/components/teacher/add-students/TeacherAddStudentsDialog.tsx
import React from "react";
import { Button } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAddStudentsToClass } from "@/lib/hooks";
import {
  createInitialTeacherAddStudentsFlowState,
  teacherAddStudentsFlowReducer,
} from "@/lib/teacher-add-students-flow";
import { TeacherAddStudentsSourcePicker } from "./TeacherAddStudentsSourcePicker";
import { TeacherAddStudentsManualEditor } from "./TeacherAddStudentsManualEditor";
import { TeacherAddStudentsImportStep } from "./TeacherAddStudentsImportStep";
import { TeacherAddStudentsReviewTable } from "./TeacherAddStudentsReviewTable";
import { TeacherAddStudentsResultStep } from "./TeacherAddStudentsResultStep";

export function TeacherAddStudentsDialog({
  classId,
  className,
  open,
  onOpenChange,
}: {
  classId: string;
  className: string;
  open: boolean;
  onOpenChange(open: boolean): void;
}) {
  const isMobile = useIsMobile();
  const addStudents = useAddStudentsToClass();
  const [state, dispatch] = React.useReducer(
    teacherAddStudentsFlowReducer,
    undefined,
    createInitialTeacherAddStudentsFlowState,
  );
  const [error, setError] = React.useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setError(null);
      dispatch({ type: "reset" });
    }
  };

  const handleConfirm = async () => {
    try {
      setError(null);
      const result = await addStudents.mutateAsync({
        classId,
        students: state.rows,
      });
      dispatch({ type: "submission.succeeded", result });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "We couldn't add those students right now.",
      );
    }
  };

  const content = (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {state.step === "source" && (
        <TeacherAddStudentsSourcePicker
          onSelect={(source) =>
            dispatch({ type: "source.selected", source })
          }
        />
      )}

      {state.step === "entry" && state.source === "manual" && (
        <TeacherAddStudentsManualEditor
          initialRows={state.rows}
          onBack={() => dispatch({ type: "reset" })}
          onContinue={(rows) => dispatch({ type: "rows.prepared", rows })}
        />
      )}

      {state.step === "entry" &&
        (state.source === "xlsx" || state.source === "json") && (
          <TeacherAddStudentsImportStep
            source={state.source}
            onBack={() => dispatch({ type: "reset" })}
            onContinue={(rows) => dispatch({ type: "rows.prepared", rows })}
          />
        )}

      {state.step === "review" && (
        <TeacherAddStudentsReviewTable
          rows={state.rows}
          isSubmitting={addStudents.isPending}
          error={error}
          onBack={() => dispatch({ type: "review.back" })}
          onConfirm={handleConfirm}
        />
      )}

      {state.step === "result" && state.result && (
        <TeacherAddStudentsResultStep
          result={state.result}
          onDone={() => handleOpenChange(false)}
        />
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="h-[100dvh] rounded-none border-0 px-4 pb-6">
          <DrawerHeader className="px-0 pt-6 text-left">
            <DrawerTitle>Add Students</DrawerTitle>
            <DrawerDescription>
              Add students to {className} and review everything before creation.
            </DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden p-0">
        <div className="flex h-full min-h-[36rem] flex-col p-6">
          <DialogHeader>
            <DialogTitle>Add Students</DialogTitle>
            <DialogDescription>
              Add students to {className} and review everything before creation.
            </DialogDescription>
          </DialogHeader>
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

```tsx
// src/components/teacher/add-students/TeacherAddStudentsSourcePicker.tsx
import { Button, Card } from "@/components/ui";
import type { TeacherAddStudentsSource } from "@/lib/teacher-add-students-flow";

const SOURCE_OPTIONS: {
  source: TeacherAddStudentsSource;
  title: string;
  body: string;
}[] = [
  {
    source: "manual",
    title: "Manual",
    body: "Type one or more students, then review before anyone is created.",
  },
  {
    source: "xlsx",
    title: "Import XLSX",
    body: "Upload the strict template with lastName and firstName columns.",
  },
  {
    source: "json",
    title: "Import JSON",
    body: "Upload a strict array of objects with only lastName and firstName.",
  },
];

export function TeacherAddStudentsSourcePicker({
  onSelect,
}: {
  onSelect(source: TeacherAddStudentsSource): void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {SOURCE_OPTIONS.map((option) => (
        <Card key={option.source} className="rounded-[24px] p-5">
          <h3 className="text-lg font-bold">{option.title}</h3>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            {option.body}
          </p>
          <Button className="mt-5 w-full" onClick={() => onSelect(option.source)}>
            Choose {option.title}
          </Button>
        </Card>
      ))}
    </div>
  );
}
```

```tsx
// src/components/teacher/add-students/TeacherAddStudentsManualEditor.tsx
import React from "react";
import { Button, Card, Input, Label } from "@/components/ui";
import {
  normalizeTeacherAddStudentRows,
  type TeacherAddStudentDraft,
} from "@/lib/teacher-add-students";

type EditableRow = TeacherAddStudentDraft & { id: string };

function createEditableRow(seed?: TeacherAddStudentDraft): EditableRow {
  return {
    id: crypto.randomUUID(),
    lastName: seed?.lastName ?? "",
    firstName: seed?.firstName ?? "",
  };
}

export function TeacherAddStudentsManualEditor({
  initialRows,
  onBack,
  onContinue,
}: {
  initialRows: TeacherAddStudentDraft[];
  onBack(): void;
  onContinue(rows: TeacherAddStudentDraft[]): void;
}) {
  const [rows, setRows] = React.useState<EditableRow[]>(
    initialRows.length ? initialRows.map((row) => createEditableRow(row)) : [createEditableRow()],
  );
  const [error, setError] = React.useState<string | null>(null);

  return (
    <Card className="flex flex-1 flex-col rounded-[24px] p-5">
      <div className="space-y-4">
        {rows.map((row, index) => (
          <div key={row.id} className="grid gap-3 rounded-2xl border border-border/70 p-4 md:grid-cols-[1fr_1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor={`last-name-${row.id}`}>Last Name</Label>
              <Input
                id={`last-name-${row.id}`}
                value={row.lastName}
                onChange={(event) =>
                  setRows((current) =>
                    current.map((item) =>
                      item.id === row.id ? { ...item, lastName: event.target.value } : item,
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
                      item.id === row.id ? { ...item, firstName: event.target.value } : item,
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
                  setRows((current) => current.filter((item) => item.id !== row.id))
                }
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="mt-4 text-sm font-bold text-destructive">{error}</p>}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setRows((current) => [...current, createEditableRow()])}>
            + Add Row
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
            Review Students
          </Button>
        </div>
      </div>
    </Card>
  );
}
```

```tsx
// src/components/teacher/add-students/TeacherAddStudentsImportStep.tsx
import React from "react";
import { Button, Card, Input } from "@/components/ui";
import {
  parseTeacherStudentsJson,
  type TeacherAddStudentDraft,
} from "@/lib/teacher-add-students";
import { parseTeacherStudentsXlsxFile } from "@/lib/teacher-add-students-xlsx";

export function TeacherAddStudentsImportStep({
  source,
  onBack,
  onContinue,
}: {
  source: "xlsx" | "json";
  onBack(): void;
  onContinue(rows: TeacherAddStudentDraft[]): void;
}) {
  const [error, setError] = React.useState<string | null>(null);

  const parseFile = async (file: File) => {
    if (source === "xlsx") {
      return parseTeacherStudentsXlsxFile(file);
    }
    return parseTeacherStudentsJson(await file.text());
  };

  return (
    <Card className="rounded-[24px] p-5">
      <p className="text-sm font-bold text-muted-foreground">
        {source === "xlsx"
          ? "Upload one .xlsx file with the exact columns: lastName, firstName."
          : "Upload one .json file with a strict array of objects containing only lastName and firstName."}
      </p>

      <Input
        className="mt-4"
        type="file"
        accept={source === "xlsx" ? ".xlsx" : ".json,application/json"}
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) {
            return;
          }

          try {
            setError(null);
            onContinue(await parseFile(file));
          } catch (caught) {
            setError(
              caught instanceof Error
                ? caught.message
                : "We couldn't parse that file.",
            );
          } finally {
            event.target.value = "";
          }
        }}
      />

      {error && <p className="mt-4 text-sm font-bold text-destructive">{error}</p>}

      <Button className="mt-5" variant="ghost" onClick={onBack}>
        Back
      </Button>
    </Card>
  );
}
```

```tsx
// src/components/teacher/add-students/TeacherAddStudentsReviewTable.tsx
import { Button } from "@/components/ui";
import type { TeacherAddStudentDraft } from "@/lib/teacher-add-students";

export function TeacherAddStudentsReviewTable({
  rows,
  isSubmitting,
  error,
  onBack,
  onConfirm,
}: {
  rows: TeacherAddStudentDraft[];
  isSubmitting: boolean;
  error: string | null;
  onBack(): void;
  onConfirm(): void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-bold text-muted-foreground">
          Review {rows.length} student{rows.length === 1 ? "" : "s"} before creation.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-[24px] border-2 border-border bg-white">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-border bg-muted/40">
              <th className="p-4 font-bold text-muted-foreground">Last Name</th>
              <th className="p-4 font-bold text-muted-foreground">First Name</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.lastName}-${row.firstName}-${index}`} className="border-b border-border/60">
                <td className="p-4 font-bold">{row.lastName}</td>
                <td className="p-4 font-bold">{row.firstName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && <p className="mt-4 text-sm font-bold text-destructive">{error}</p>}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button disabled={isSubmitting} onClick={onConfirm}>
          {isSubmitting ? "Adding Students..." : "Confirm And Create"}
        </Button>
      </div>
    </div>
  );
}
```

```tsx
// src/components/teacher/add-students/TeacherAddStudentsResultStep.tsx
import { Button, Card } from "@/components/ui";
import type { TeacherAddStudentsResult } from "@/lib/teacher-add-students";

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
        Added {result.createdCount} student{result.createdCount === 1 ? "" : "s"} to {result.className}.
      </p>
      <Button className="mt-6" onClick={onDone}>
        Done
      </Button>
    </Card>
  );
}
```

- [ ] **Step 4: Run typecheck and manual verification**

Run: `npm run typecheck`
Expected: PASS

Run: `npm run dev`
Expected:
- Teacher class workspace loads with a live `+ Add` button.
- `Manual`, `Import XLSX`, and `Import JSON` all open inside the same flow.
- Manual mode supports multiple rows and blocks blank names.
- Invalid `xlsx` headers show the strict-template error.
- Invalid `json` shape shows the strict-array error.
- Valid rows reach the shared review table.
- Confirming success shows the result summary and the roster refreshes after closing.
- On a mobile viewport, the add flow uses the full-height drawer instead of the centered dialog.

- [ ] **Step 5: Commit**

```bash
git add src/components/teacher/add-students/TeacherAddStudentsDialog.tsx src/components/teacher/add-students/TeacherAddStudentsSourcePicker.tsx src/components/teacher/add-students/TeacherAddStudentsManualEditor.tsx src/components/teacher/add-students/TeacherAddStudentsImportStep.tsx src/components/teacher/add-students/TeacherAddStudentsReviewTable.tsx src/components/teacher/add-students/TeacherAddStudentsResultStep.tsx src/pages/teacher.tsx
git commit -m "feat: wire teacher add-students workflow"
```
