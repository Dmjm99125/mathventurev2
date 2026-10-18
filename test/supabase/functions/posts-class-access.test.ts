import { assertEquals } from "jsr:@std/assert";
import { createPostsCreateHandler } from "../../../supabase/functions/posts-create/handler.ts";
import { createPostsListHandler } from "../../../supabase/functions/posts-list/handler.ts";

function teacher() {
  return { id: "teacher-1", role: "teacher" as const, full_name: "Ana Cruz" };
}

function classroom(classId: string, archivedAt: string | null = null) {
  return {
    id: classId,
    teacherId: "teacher-1",
    name: classId,
    createdAt: "2026-07-01T00:00:00.000Z",
    archivedAt,
  };
}

Deno.test("posts-list reads only the selected teacher class", async () => {
  let requestedClassId = "";
  const handler = createPostsListHandler({
    getAuthedProfile: async () => teacher(),
    getTeacherClass: async (_teacherId, classId) => classId === "class-2" ? classroom(classId) : null,
    listPosts: async (classId) => {
      requestedClassId = classId;
      return [{
        id: "post-2",
        classId,
        content: "Class 2 only",
        createdAt: "2026-08-01T00:00:00.000Z",
        authorName: "Ana Cruz",
      }];
    },
  });

  const response = await handler(new Request("http://local/posts-list?classId=class-2"));

  assertEquals(response.status, 200);
  assertEquals(requestedClassId, "class-2");
  assertEquals((await response.json()).posts[0].classId, "class-2");
});

Deno.test("posts-create rejects archived classes before writing", async () => {
  let created = false;
  const handler = createPostsCreateHandler({
    getAuthedProfile: async () => teacher(),
    getTeacherClass: async () => classroom("class-1", "2026-09-01T00:00:00.000Z"),
    createPost: async () => {
      created = true;
      return {};
    },
  });

  const response = await handler(new Request("http://local/posts-create", {
    method: "POST",
    body: JSON.stringify({ classId: "class-1", content: "No write" }),
  }));

  assertEquals(response.status, 409);
  assertEquals(created, false);
});
