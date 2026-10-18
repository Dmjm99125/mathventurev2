import { SqliteStorageError, type SqliteDatabase, type SqliteStorageQuality } from './adapter.ts';
import { SQLITE_MIGRATIONS } from './migrations.ts';
import { isTauriRuntime } from './platform.ts';
import { createPwaSqliteDatabase } from './pwaAdapter.ts';
import { createTauriSqliteDatabase } from './tauriAdapter.ts';

export class OfflineDurableStorageError extends SqliteStorageError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'OfflineDurableStorageError';
  }
}

export type DurableStorageManager = {
  persist?: () => Promise<boolean>;
  persisted?: () => Promise<boolean>;
};

export type ApplicationDatabaseFactoryContext = { quality: SqliteStorageQuality };

export type ApplicationDatabaseOptions = {
  storage?: DurableStorageManager;
  databaseFactory?: (context: ApplicationDatabaseFactoryContext) => Promise<SqliteDatabase>;
  runtime?: 'browser' | 'tauri';
};

let sharedDatabasePromise: Promise<SqliteDatabase> | null = null;

function defaultStorageManager(): DurableStorageManager | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return (navigator as Navigator & { storage?: DurableStorageManager }).storage;
}

async function closeQuietly(database: SqliteDatabase): Promise<void> {
  await database.close().catch(() => undefined);
}

async function validateOpenedDatabase(database: SqliteDatabase): Promise<SqliteDatabase> {
  try {
    await database.execute('create table if not exists schema_migrations (version integer primary key, name text not null, applied_at text not null)');
    const appliedRows = await database.query<{ version: number }>('select version from schema_migrations');
    const appliedVersions = new Set(appliedRows.map((row) => Number(row.version)));
    for (const migration of SQLITE_MIGRATIONS) {
      if (appliedVersions.has(migration.version)) continue;
      await database.transaction(async (transaction) => {
        for (const statement of migration.statements) await transaction.execute(statement);
        await transaction.execute(
          'insert into schema_migrations(version, name, applied_at) values (?, ?, ?)',
          [migration.version, migration.name, new Date().toISOString()],
        );
      });
    }

    const health = await database.health();
    if (!health.durable) throw new OfflineDurableStorageError('SQLite opened without durable storage.');
    return database;
  } catch (error) {
    await closeQuietly(database);
    if (error instanceof OfflineDurableStorageError) throw error;
    throw new OfflineDurableStorageError('The offline SQLite database could not be opened.', { cause: error });
  }
}

export async function openApplicationDatabase(options: ApplicationDatabaseOptions = {}): Promise<SqliteDatabase> {
  if (options.runtime === 'tauri' || isTauriRuntime()) {
    try {
      const databaseFactory = options.databaseFactory ?? (() => createTauriSqliteDatabase());
      const database = await databaseFactory({ quality: 'native' });
      return await validateOpenedDatabase(database);
    } catch (error) {
      if (error instanceof OfflineDurableStorageError) throw error;
      throw new OfflineDurableStorageError('The native offline SQLite database could not be opened.', { cause: error });
    }
  }

  const storage = options.storage ?? defaultStorageManager();
  if (!storage) {
    throw new OfflineDurableStorageError('Durable browser storage is unavailable.');
  }

  let persisted = false;
  try {
    persisted = storage.persist ? await storage.persist() : storage.persisted ? await storage.persisted() : false;
  } catch (error) {
    throw new OfflineDurableStorageError('The browser could not prepare durable storage.', { cause: error });
  }
  const quality: SqliteStorageQuality = persisted ? 'persistent' : 'best-effort';
  const databaseFactory = options.databaseFactory ?? ((context: ApplicationDatabaseFactoryContext) => createPwaSqliteDatabase({ quality: context.quality }));
  try {
    const database = await databaseFactory({ quality });
    return await validateOpenedDatabase(database);
  } catch (error) {
    if (error instanceof OfflineDurableStorageError) throw error;
    throw new OfflineDurableStorageError('The offline SQLite database could not be opened.', { cause: error });
  }
}

export function getApplicationDatabase(options: ApplicationDatabaseOptions = {}): Promise<SqliteDatabase> {
  sharedDatabasePromise ??= openApplicationDatabase(options);
  return sharedDatabasePromise;
}

export function resetApplicationDatabaseForTests(): void {
  sharedDatabasePromise = null;
}
