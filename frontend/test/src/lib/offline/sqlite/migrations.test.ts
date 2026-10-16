import { assert, assertEquals } from 'jsr:@std/assert';
import {
  SQLITE_DATABASE_NAME,
  SQLITE_MIGRATIONS,
  SQLITE_SCHEMA_VERSION,
} from '../../../../../src/lib/offline/sqlite/migrations.ts';

Deno.test('schema includes durable application tables and indexes', () => {
  const sql = SQLITE_MIGRATIONS.flatMap((migration) => migration.statements).join('\n').toLowerCase();

  assertEquals(SQLITE_DATABASE_NAME, 'mathventure-app');
  assertEquals(SQLITE_SCHEMA_VERSION, SQLITE_MIGRATIONS.at(-1)?.version);

  for (const table of [
    'app_meta',
    'device_enrollment',
    'local_sessions',
    'profiles',
    'classrooms',
    'class_students',
    'assignments',
    'attempts',
    'attempt_game_results',
    'posts',
    'free_play_sessions',
    'free_play_progress',
    'sync_outbox',
    'sync_conflicts',
    'entity_id_mappings',
    'schema_migrations',
  ]) {
    assert(sql.includes(`create table if not exists ${table}`), `missing table ${table}`);
  }

  assert(sql.includes('create index if not exists sync_outbox_status_created_at_idx'));
  assert(sql.includes('create index if not exists sync_conflicts_status_created_at_idx'));
});
