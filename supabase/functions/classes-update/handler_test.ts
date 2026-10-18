import { assertEquals } from "jsr:@std/assert";
import { createClassesUpdateHandler } from "./handler.ts";

function classRecord(archivedAt: string | null = null) {
  return {
    id: "class-1",
    teacherId: "teacher-1",
    name: "Grade 1",
    createdAt: "2026-07-31T00:00:00.000Z",
    archivedAt,
    studentCount: 4,
  };
}

Deno.test("classes-update renames an owned class", async () => {
  let renamedTo = "";
  const handler = createClassesUpdateHandler({
    getAuthedProfile: async () => ({ id: "teacher-1", role: "teacher", full_name: "Ana Cruz" }),
    getTeacherClass: async () => classRecord(),
    renameClass: async (_classId, name) => {
      renamedTo = name;
      return { ...classRecord(), name };
    },
    setArchivedAt: async (_classId, archivedAt) => classRecord(archivedAt),
  });

  const response = await handler(new Request("http://local/classes-update", {
    method: "POST",
    body: JSON.stringify({ classId: "class-1", action: "rename", name: "  Grade 1 - Blue  " }),
  }));

  assertEquals(response.status, 200);
  assertEquals(renamedTo, "Grade 1 - Blue");
});

Deno.test("classes-update archives and unarchives an owned class", async () => {
  const archivedAt = "2026-10-18T00:00:00.000Z";
  const actions: Array<string | null> = [];
  let currentClass = classRecord();
  const handler = createClassesUpdateHandler({
    getAuthedProfile: async () => ({ id: "teacher-1", role: "teacher", full_name: "Ana Cruz" }),
    getTeacherClass: async () => currentClass,
    renameClass: async (_classId, name) => ({ ...classRecord(), name }),
    setArchivedAt: async (_classId, value) => {
      actions.push(value);
      currentClass = classRecord(value);
      return currentClass;
    },
    now: () => archivedAt,
  });

  const archiveResponse = await handler(new Request("http://local/classes-update", {
    method: "POST",
    body: JSON.stringify({ classId: "class-1", action: "archive" }),
  }));
  const unarchiveResponse = await handler(new Request("http://local/classes-update", {
    method: "POST",
    body: JSON.stringify({ classId: "class-1", action: "unarchive" }),
  }));

  assertEquals(archiveResponse.status, 200);
  assertEquals(unarchiveResponse.status, 200);
  assertEquals(actions, [archivedAt, null]);
});

Deno.test("classes-update rejects a blank rename", async () => {
  const handler = createClassesUpdateHandler({
    getAuthedProfile: async () => ({ id: "teacher-1", role: "teacher", full_name: "Ana Cruz" }),
    getTeacherClass: async () => classRecord(),
    renameClass: async () => classRecord(),
    setArchivedAt: async (_classId, archivedAt) => classRecord(archivedAt),
  });

  const response = await handler(new Request("http://local/classes-update", {
    method: "POST",
    body: JSON.stringify({ classId: "class-1", action: "rename", name: "   " }),
  }));

  assertEquals(response.status, 422);
});

Deno.test("classes-update rejects non-teachers before loading a class", async () => {
  let loaded = false;
  const handler = createClassesUpdateHandler({
    getAuthedProfile: async () => ({ id: "student-1", role: "student", full_name: "Maria Santos" }),
    getTeacherClass: async () => {
      loaded = true;
      return classRecord();
    },
    renameClass: async () => classRecord(),
    setArchivedAt: async (_classId, archivedAt) => classRecord(archivedAt),
  });

  const response = await handler(new Request("http://local/classes-update", {
    method: "POST",
    body: JSON.stringify({ classId: "class-1", action: "archive" }),
  }));

  assertEquals(response.status, 403);
  assertEquals(loaded, false);
});

Deno.test("classes-update rejects a class owned by another teacher", async () => {
  let changed = false;
  const handler = createClassesUpdateHandler({
    getAuthedProfile: async () => ({ id: "teacher-1", role: "teacher", full_name: "Ana Cruz" }),
    getTeacherClass: async () => null,
    renameClass: async () => {
      changed = true;
      return classRecord();
    },
    setArchivedAt: async (_classId, archivedAt) => {
      changed = true;
      return classRecord(archivedAt);
    },
  });

  const response = await handler(new Request("http://local/classes-update", {
    method: "POST",
    body: JSON.stringify({ classId: "class-2", action: "rename", name: "Nope" }),
  }));

  assertEquals(response.status, 404);
  assertEquals(changed, false);
});

Deno.test("classes-update makes archive idempotent", async () => {
  let changed = false;
  const handler = createClassesUpdateHandler({
    getAuthedProfile: async () => ({ id: "teacher-1", role: "teacher", full_name: "Ana Cruz" }),
    getTeacherClass: async () => classRecord("2026-09-01T00:00:00.000Z"),
    renameClass: async () => classRecord(),
    setArchivedAt: async (_classId, archivedAt) => {
      changed = true;
      return classRecord(archivedAt);
    },
  });

  const response = await handler(new Request("http://local/classes-update", {
    method: "POST",
    body: JSON.stringify({ classId: "class-1", action: "archive" }),
  }));

  assertEquals(response.status, 200);
  assertEquals(changed, false);
});
