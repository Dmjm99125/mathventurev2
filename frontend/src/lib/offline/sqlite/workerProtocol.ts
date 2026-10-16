import type { SqliteParams, SqliteRow, SqliteValue } from './adapter.ts';

export type SqliteWorkerStatement = {
  kind: 'query' | 'execute';
  sql: string;
  params: SqliteParams;
};

export type SqliteWorkerRequest =
  | { requestId: string; type: 'query'; sql: string; params: SqliteParams }
  | { requestId: string; type: 'execute'; sql: string; params: SqliteParams }
  | { requestId: string; type: 'transaction'; statements: readonly SqliteWorkerStatement[] }
  | { requestId: string; type: 'health' }
  | { requestId: string; type: 'close' };

export type SqliteWorkerResponse =
  | { requestId: string; type: 'result'; rows: SqliteRow[]; health?: { schemaVersion: number; durable: boolean } }
  | { requestId: string; type: 'error'; error: { code: string; message: string } };

function isSqliteValue(value: unknown): value is SqliteValue {
  return value === null
    || typeof value === 'string'
    || typeof value === 'number'
    || value instanceof Uint8Array;
}

function isParams(value: unknown): value is SqliteParams {
  return Array.isArray(value) && value.every(isSqliteValue);
}

function isStatement(value: unknown): value is SqliteWorkerStatement {
  if (!value || typeof value !== 'object') return false;
  const statement = value as Partial<SqliteWorkerStatement>;
  return (statement.kind === 'query' || statement.kind === 'execute')
    && typeof statement.sql === 'string'
    && isParams(statement.params);
}

export function isSqliteWorkerRequest(value: unknown): value is SqliteWorkerRequest {
  if (!value || typeof value !== 'object') return false;
  const request = value as Partial<SqliteWorkerRequest>;
  if (typeof request.requestId !== 'string') return false;
  if (request.type === 'query' || request.type === 'execute') {
    return typeof request.sql === 'string' && isParams(request.params);
  }
  if (request.type === 'transaction') {
    return Array.isArray(request.statements) && request.statements.every(isStatement);
  }
  return request.type === 'health' || request.type === 'close';
}

export function isSqliteWorkerResponse(value: unknown): value is SqliteWorkerResponse {
  if (!value || typeof value !== 'object') return false;
  const response = value as Partial<SqliteWorkerResponse>;
  if (typeof response.requestId !== 'string') return false;
  if (response.type === 'result') return Array.isArray(response.rows);
  if (response.type === 'error') {
    return Boolean(response.error)
      && typeof response.error === 'object'
      && typeof response.error.code === 'string'
      && typeof response.error.message === 'string';
  }
  return false;
}
