import { SqliteStorageError, type SqliteDatabase, type SqliteParams, type SqliteRow, type SqliteStorageQuality, type SqliteTransaction } from './adapter.ts';
import {
  isSqliteWorkerResponse,
  type SqliteWorkerMessage,
  type SqliteWorkerRequest,
  type SqliteWorkerResponse,
} from './workerProtocol.ts';

export type PwaSqliteAdapterOptions = {
  workerFactory?: () => Worker;
  quality?: SqliteStorageQuality;
};

type PendingRequest = {
  resolve: (response: Extract<SqliteWorkerResponse, { type: 'result' }>) => void;
  reject: (error: Error) => void;
};

function defaultWorkerFactory(): Worker {
  return new Worker(new URL('./sqlite.worker.ts', import.meta.url), { type: 'module' });
}

export async function createPwaSqliteDatabase(options: PwaSqliteAdapterOptions = {}): Promise<SqliteDatabase> {
  const worker = (options.workerFactory ?? defaultWorkerFactory)();
  const pending = new Map<string, PendingRequest>();
  let sequence = 0;
  let closed = false;

  worker.onmessage = (event: MessageEvent<unknown>) => {
    if (!isSqliteWorkerResponse(event.data)) return;
    const request = pending.get(event.data.requestId);
    if (!request) return;
    pending.delete(event.data.requestId);
    if (event.data.type === 'error') {
      request.reject(new SqliteStorageError(event.data.error.message));
      return;
    }
    request.resolve(event.data);
  };
  worker.onerror = (event) => {
    const error = new SqliteStorageError(event.message || 'SQLite worker failed.');
    for (const request of pending.values()) request.reject(error);
    pending.clear();
  };

  const request = (message: SqliteWorkerMessage): Promise<Extract<SqliteWorkerResponse, { type: 'result' }>> => {
    if (closed) return Promise.reject(new SqliteStorageError('SQLite database is closed.'));
    const requestId = `sqlite-request-${sequence++}`;
    return new Promise<Extract<SqliteWorkerResponse, { type: 'result' }>>((resolve, reject) => {
      pending.set(requestId, { resolve, reject });
      worker.postMessage({ ...message, requestId } as SqliteWorkerRequest);
    });
  };

  const query = async <T extends SqliteRow = SqliteRow>(sql: string, params: SqliteParams = [], transactionId?: string): Promise<T[]> => {
    const response = await request({ type: 'query', sql, params, ...(transactionId ? { transactionId } : {}) });
    return response.rows as T[];
  };

  const execute = async (sql: string, params: SqliteParams = [], transactionId?: string): Promise<void> => {
    await request({ type: 'execute', sql, params, ...(transactionId ? { transactionId } : {}) });
  };

  const database: SqliteDatabase = {
    query,
    execute,
    transaction: async <T>(work: (transaction: SqliteTransaction) => Promise<T>): Promise<T> => {
      const transactionId = `sqlite-transaction-${sequence++}`;
      await request({ type: 'begin', transactionId });
      const transaction: SqliteTransaction = {
        query: <Row extends SqliteRow = SqliteRow>(sql: string, params?: SqliteParams) => query<Row>(sql, params ?? [], transactionId),
        execute: (sql: string, params?: SqliteParams) => execute(sql, params ?? [], transactionId),
      };
      try {
        const result = await work(transaction);
        await request({ type: 'commit', transactionId });
        return result;
      } catch (error) {
        await request({ type: 'rollback', transactionId }).catch(() => {});
        throw error;
      }
    },
    health: async () => {
      const response = await request({ type: 'health' });
      if (!response.health) throw new SqliteStorageError('SQLite worker returned no health status.');
      return { ...response.health, quality: options.quality ?? response.health.quality };
    },
    close: async () => {
      if (closed) return;
      await request({ type: 'close' });
      closed = true;
      worker.terminate();
    },
  };

  await database.health();
  return database;
}
