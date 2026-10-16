import { SqliteStorageError, type SqliteDatabase } from './adapter.ts';
import { createPwaSqliteDatabase } from './pwaAdapter.ts';

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

export type ApplicationDatabaseOptions = {
  storage?: DurableStorageManager;
  databaseFactory?: () => Promise<SqliteDatabase>;
};

function defaultStorageManager(): DurableStorageManager | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return (navigator as Navigator & { storage?: DurableStorageManager }).storage;
}

export async function openApplicationDatabase(options: ApplicationDatabaseOptions = {}): Promise<SqliteDatabase> {
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
  if (!persisted) {
    throw new OfflineDurableStorageError('Durable storage permission was not granted. Offline writes are disabled to protect local work.');
  }

  const databaseFactory = options.databaseFactory ?? (() => createPwaSqliteDatabase());
  try {
    const database = await databaseFactory();
    const health = await database.health();
    if (!health.durable) {
      await database.close();
      throw new OfflineDurableStorageError('SQLite opened without durable storage.');
    }
    return database;
  } catch (error) {
    if (error instanceof OfflineDurableStorageError) throw error;
    throw new OfflineDurableStorageError('The offline SQLite database could not be opened.', { cause: error });
  }
}
