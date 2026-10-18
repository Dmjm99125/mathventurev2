import { assert, assertNotMatch, assertStringIncludes } from "jsr:@std/assert";

const migration = await Deno.readTextFile(
  new URL("../../../supabase/migrations/0017_restore_teacher_multi_class.sql", import.meta.url),
);

Deno.test("multi-class migration is additive and removes only singleton enforcement", () => {
  assert(migration.includes("add column if not exists archived_at timestamptz"));
  assertStringIncludes(migration, "drop index if exists public.classes_teacher_singleton_idx");
  assertStringIncludes(migration, "not exists");
  assertNotMatch(migration, /delete\s+from\s+public\./i);
  assertNotMatch(migration, /truncate\s+/i);
});
