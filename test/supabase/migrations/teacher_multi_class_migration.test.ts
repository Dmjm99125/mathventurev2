import { assert, assertNotMatch, assertStringIncludes } from "jsr:@std/assert";

const migration = await Deno.readTextFile(
  new URL("../../../supabase/migrations/0017_restore_teacher_multi_class.sql", import.meta.url),
);
const scopedQueryMigration = await Deno.readTextFile(
  new URL("../../../supabase/migrations/0018_scope_teacher_queries_by_class.sql", import.meta.url),
);

Deno.test("multi-class migration is additive and removes only singleton enforcement", () => {
  assert(migration.includes("add column if not exists archived_at timestamptz"));
  assertStringIncludes(migration, "drop index if exists public.classes_teacher_singleton_idx");
  assertStringIncludes(migration, "not exists");
  assertNotMatch(migration, /delete\s+from\s+public\./i);
  assertNotMatch(migration, /truncate\s+/i);
});

Deno.test("scoped query migration replaces both legacy and already-scoped function signatures", () => {
  assertStringIncludes(scopedQueryMigration, "drop function if exists public.get_teacher_report_summary(uuid, uuid, timestamptz, timestamptz, integer, uuid);");
  assertStringIncludes(scopedQueryMigration, "drop function if exists public.get_teacher_roster_page(uuid, uuid, integer, timestamptz, uuid);");
});
