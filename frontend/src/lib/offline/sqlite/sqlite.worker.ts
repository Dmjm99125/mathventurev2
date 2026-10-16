/// <reference lib="webworker" />

import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { SQLITE_MIGRATIONS, SQLITE_SCHEMA_VERSION } from './migrations.ts';
import {
  isSqliteWorkerRequest,
  type SqliteWorkerRequest,
  type SqliteWorkerResponse,
} from './workerProtocol.ts';

type SqliteHandle = {
  exec(options: unknown): unknown;
  close(): void;
};

type WorkerSqlite = {
  oo1: { OpfsDb: new (filename: string) => SqliteHandle };
  opfs?: unknown;
};

const workerScope = self as unknown as DedicatedWorkerGlobalScope;
let databasePromise: Promise<SqliteHandle> | null = null;
const openTransactions = new Set<string>();

function post(response: SqliteWorkerResponse): void {
  workerScope.postMessage(response);
}

function rowsFromResult(result: unknown): Record<string, unknown>[] {
  return Array.isArray(result) ? result as Record<string, unknown>[] : [];
}

function execute(handle: SqliteHandle, sql: string, params: readonly unknown[] = []): void {
  handle.exec({ sql, bind: params });
}

function query(handle: SqliteHandle, sql: string, params: readonly unknown[] = []): Record<string, unknown>[] {
  return rowsFromResult(handle.exec({ sql, bind: params, returnValue: 'resultRows', rowMode: 'object' }));
}

async function openDatabase(): Promise<SqliteHandle> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const sqlite3 = await sqlite3InitModule() as unknown as WorkerSqlite;
      if (!sqlite3.opfs) {
        throw new Error('SQLite OPFS is unavailable. Enable a supported browser and cross-origin isolation.');
      }
      const handle = new sqlite3.oo1.OpfsDb('/mathventure-app.sqlite3');
      execute(handle, 'create table if not exists schema_migrations (version integer primary key, name text not null, applied_at text not null)');
      for (const migration of SQLITE_MIGRATIONS) {
        if (query(handle, 'select version from schema_migrations where version = ?', [migration.version]).length > 0) continue;
        execute(handle, 'begin immediate');
        try {
          for (const statement of migration.statements) execute(handle, statement);
          execute(handle, 'insert into schema_migrations(version, name, applied_at) values (?, ?, ?)', [migration.version, migration.name, new Date().toISOString()]);
          execute(handle, 'commit');
        } catch (error) {
          execute(handle, 'rollback');
          throw error;
        }
      }
      return handle;
    })();
  }
  return databasePromise;
}

async function handleRequest(request: SqliteWorkerRequest): Promise<SqliteWorkerResponse> {
  const handle = await openDatabase();
  if ((request.type === 'query' || request.type === 'execute') && request.transactionId && !openTransactions.has(request.transactionId)) {
    throw new Error(`SQLite transaction ${request.transactionId} is not active.`);
  }

  if (request.type === 'query') {
    return { requestId: request.requestId, type: 'result', rows: query(handle, request.sql, request.params) };
  }
  if (request.type === 'execute') {
    execute(handle, request.sql, request.params);
    return { requestId: request.requestId, type: 'result', rows: [] };
  }
  if (request.type === 'begin') {
    execute(handle, 'begin immediate');
    openTransactions.add(request.transactionId);
    return { requestId: request.requestId, type: 'result', rows: [] };
  }
  if (request.type === 'commit') {
    execute(handle, 'commit');
    openTransactions.delete(request.transactionId);
    return { requestId: request.requestId, type: 'result', rows: [] };
  }
  if (request.type === 'rollback') {
    execute(handle, 'rollback');
    openTransactions.delete(request.transactionId);
    return { requestId: request.requestId, type: 'result', rows: [] };
  }
  if (request.type === 'health') {
    return {
      requestId: request.requestId,
      type: 'result',
      rows: [],
      health: { schemaVersion: SQLITE_SCHEMA_VERSION, durable: true },
    };
  }
  handle.close();
  databasePromise = null;
  return { requestId: request.requestId, type: 'result', rows: [] };
}

workerScope.addEventListener('message', (event: MessageEvent<unknown>) => {
  const request = event.data;
  if (!isSqliteWorkerRequest(request)) return;
  void handleRequest(request)
    .then(post)
    .catch((error: unknown) => post({
      requestId: request.requestId,
      type: 'error',
      error: { code: error instanceof Error ? error.name : 'SQLITE_ERROR', message: error instanceof Error ? error.message : 'SQLite request failed.' },
    }));
});
