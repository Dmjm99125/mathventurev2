import { assertEquals, assertRejects } from 'jsr:@std/assert';
import { createMemorySqlite } from '../../../../../src/lib/offline/sqlite/memoryAdapter.ts';

Deno.test('memory SQLite adapter rolls back all statements when a transaction fails', async () => {
  const database = await createMemorySqlite();

  await assertRejects(() => database.transaction(async (transaction) => {
    await transaction.execute(
      'insert into app_meta(key, value, updated_at) values (?, ?, ?)',
      ['one', '1', '2026-10-16T00:00:00.000Z'],
    );
    throw new Error('abort');
  }));

  assertEquals(await database.query('select * from app_meta'), []);
});

Deno.test('memory SQLite adapter commits parameterized rows', async () => {
  const database = await createMemorySqlite();

  await database.execute(
    'insert into app_meta(key, value, updated_at) values (?, ?, ?)',
    ['one', '1', '2026-10-16T00:00:00.000Z'],
  );

  assertEquals(await database.query('select value from app_meta where key = ?', ['one']), [{ value: '1' }]);
});
