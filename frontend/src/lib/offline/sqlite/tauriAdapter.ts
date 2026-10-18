import { SQLITE_SCHEMA_VERSION } from './migrations.ts';
import {
  type SqliteDatabase,
  type SqliteParams,
  type SqliteRow,
  type SqliteTransaction,
  type SqliteValue,
} from './adapter.ts';
import { normalizeSqlitePlaceholders } from './sqlPlaceholders.ts';

export type TauriDatabaseLike = {
  select<T extends SqliteRow = SqliteRow>(sql: string, params?: readonly unknown[]): Promise<T[]>;
  execute(sql: string, params?: readonly unknown[]): Promise<unknown>;
  close(): Promise<unknown> | unknown;
};

export type TauriInvoke = <T>(command: string, args?: Record<string, unknown>) => Promise<T>;

export type TauriSqliteAdapterOptions = {
  loadDatabase?: (path: string) => Promise<TauriDatabaseLike>;
  invoke?: TauriInvoke;
  databasePath?: string;
  idFactory?: () => string;
};

type EncodedBytes = { __mathventure_type: 'bytes'; base64: string };

function defaultIdFactory(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `sqlite-transaction-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function defaultLoadDatabase(path: string): Promise<TauriDatabaseLike> {
  const { default: Database } = await import('@tauri-apps/plugin-sql');
  return Database.load(path) as unknown as TauriDatabaseLike;
}

async function defaultInvoke<T>(command: string, args: Record<string, unknown>): Promise<T> {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<T>(command, args);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function encodeValue(value: SqliteValue): SqliteValue | EncodedBytes {
  return value instanceof Uint8Array
    ? { __mathventure_type: 'bytes', base64: bytesToBase64(value) }
    : value;
}

function encodeParams(params: SqliteParams): readonly unknown[] {
  return params.map(encodeValue);
}

export async function createTauriSqliteDatabase(options: TauriSqliteAdapterOptions = {}): Promise<SqliteDatabase> {
  const loadDatabase = options.loadDatabase ?? defaultLoadDatabase;
  const invoke = options.invoke ?? defaultInvoke;
  const database = await loadDatabase(options.databasePath ?? 'sqlite:mathventure-app.sqlite3');
  let closed = false;
  let queue: Promise<void> = Promise.resolve();
  let activeTransactionId: string | null = null;

  const enqueue = <T>(work: () => Promise<T>): Promise<T> => {
    const previous = queue;
    let release!: () => void;
    queue = new Promise<void>((resolve) => { release = resolve; });
    return previous.then(work).finally(release);
  };

  const ensureOpen = (): void => {
    if (closed) throw new Error('SQLite database is closed.');
  };

  const query = <T extends SqliteRow = SqliteRow>(sql: string, params: SqliteParams = []): Promise<T[]> => enqueue(async () => {
    ensureOpen();
    return database.select<T>(normalizeSqlitePlaceholders(sql), encodeParams(params));
  });

  const execute = (sql: string, params: SqliteParams = []): Promise<void> => enqueue(async () => {
    ensureOpen();
    await database.execute(normalizeSqlitePlaceholders(sql), encodeParams(params));
  });

  const transaction = <T>(work: (transaction: SqliteTransaction) => Promise<T>): Promise<T> => enqueue(async () => {
    ensureOpen();
    const transactionId = (options.idFactory ?? defaultIdFactory)();
    await invoke('sqlite_begin_transaction', { transactionId });
    activeTransactionId = transactionId;
    const transactionApi: SqliteTransaction = {
      query: async <Row extends SqliteRow = SqliteRow>(sql: string, params: SqliteParams = []) => invoke<Row[]>(
        'sqlite_query_transaction',
        { transactionId, sql: normalizeSqlitePlaceholders(sql), params: encodeParams(params) },
      ),
      execute: async (sql: string, params: SqliteParams = []) => {
        await invoke('sqlite_execute_transaction', {
          transactionId,
          sql: normalizeSqlitePlaceholders(sql),
          params: encodeParams(params),
        });
      },
    };

    try {
      const result = await work(transactionApi);
      await invoke('sqlite_commit_transaction', { transactionId });
      activeTransactionId = null;
      return result;
    } catch (error) {
      await invoke('sqlite_rollback_transaction', { transactionId }).catch(() => undefined);
      activeTransactionId = null;
      throw error;
    }
  });

  const health = async () => ({ schemaVersion: SQLITE_SCHEMA_VERSION, durable: true, quality: 'native' as const });

  return {
    query,
    execute,
    transaction,
    health,
    close: () => enqueue(async () => {
      if (closed) return;
      if (activeTransactionId) {
        await invoke('sqlite_rollback_transaction', { transactionId: activeTransactionId }).catch(() => undefined);
        activeTransactionId = null;
      }
      closed = true;
      await database.close();
    }),
  };
}
