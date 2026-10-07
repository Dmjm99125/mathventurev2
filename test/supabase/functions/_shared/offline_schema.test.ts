import { assertStringIncludes } from 'jsr:@std/assert';

Deno.test('offline migration declares idempotent device operation identity', async () => {
  const sql = await Deno.readTextFile('supabase/migrations/0014_offline_sync.sql');

  assertStringIncludes(sql, 'create table if not exists public.offline_sync_operations');
  assertStringIncludes(sql, 'unique (device_id, operation_id)');
  assertStringIncludes(sql, 'enable row level security');
});
