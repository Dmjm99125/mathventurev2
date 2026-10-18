import { assertEquals, assertRejects } from 'jsr:@std/assert';
import { createTauriSqliteDatabase, type TauriDatabaseLike } from '../../../../../src/lib/offline/sqlite/tauriAdapter.ts';

function fakePlugin(selectRows: Record<string, unknown>[] = [], calls: string[] = []): TauriDatabaseLike {
  return {
    select: async <T extends Record<string, unknown> = Record<string, unknown>>(sql: string) => {
      calls.push(`select:${sql}`);
      return selectRows as T[];
    },
    execute: async (sql) => {
      calls.push(`execute:${sql}`);
    },
    close: async () => {
      calls.push('close');
    },
  };
}

Deno.test('Tauri adapter delegates normal query and execute calls', async () => {
  const calls: string[] = [];
  const database = await createTauriSqliteDatabase({
    loadDatabase: async () => fakePlugin([{ value: 1 }], calls),
    invoke: async <T>() => undefined as T,
  });

  assertEquals(await database.query('select ? as value', [1]), [{ value: 1 }]);
  await database.execute('delete from values where id = ?', ['one']);
  assertEquals(calls, ['select:select $1 as value', 'execute:delete from values where id = $1']);
});

Deno.test('Tauri adapter rolls back the Rust transaction after callback failure', async () => {
  const commands: string[] = [];
  const database = await createTauriSqliteDatabase({
    loadDatabase: async () => fakePlugin(),
    invoke: async <T>(command: string) => {
      commands.push(command);
      return (command === 'sqlite_query_transaction' ? [] : undefined) as T;
    },
    idFactory: () => 'tx-1',
  });

  await assertRejects(() => database.transaction(async (transaction) => {
    await transaction.execute('insert into app_meta(key, value) values (?, ?)', ['one', '1']);
    throw new Error('abort');
  }));
  assertEquals(commands, ['sqlite_begin_transaction', 'sqlite_execute_transaction', 'sqlite_rollback_transaction']);
});

Deno.test('Tauri adapter commits a successful Rust transaction', async () => {
  const commands: string[] = [];
  const database = await createTauriSqliteDatabase({
    loadDatabase: async () => fakePlugin(),
    invoke: async <T>(command: string) => {
      commands.push(command);
      return (command === 'sqlite_query_transaction' ? [{ value: 1 }] : undefined) as T;
    },
    idFactory: () => 'tx-2',
  });

  const rows = await database.transaction(async (transaction) => transaction.query('select ? as value', [1]));
  assertEquals(rows, [{ value: 1 }]);
  assertEquals(commands, ['sqlite_begin_transaction', 'sqlite_query_transaction', 'sqlite_commit_transaction']);
});
