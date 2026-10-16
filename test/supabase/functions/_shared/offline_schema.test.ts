import { assert, assertStringIncludes } from 'jsr:@std/assert';

Deno.test('offline migration declares idempotent device operation identity', async () => {
  const sql = await Deno.readTextFile('supabase/migrations/0014_offline_sync.sql');

  assertStringIncludes(sql, 'create table if not exists public.offline_sync_operations');
  assertStringIncludes(sql, 'unique (device_id, operation_id)');
  assertStringIncludes(sql, 'enable row level security');
});

Deno.test('offline revision migration stores results, conflicts, and identity mappings', async () => {
  const sql = await Deno.readTextFile('supabase/migrations/0015_offline_revision_conflicts.sql');

  for (const column of ['base_revision', 'result_status', 'conflict_payload']) {
    assert(sql.includes(column), column);
  }
  assert(sql.includes('create table if not exists public.offline_entity_id_mappings'));
  assert(sql.includes('unique (teacher_id, device_id, entity_type, local_id)'));
  assert(sql.includes('enable row level security'));
});
