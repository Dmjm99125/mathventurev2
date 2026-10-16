import { assert, assertEquals } from 'jsr:@std/assert';
import {
  isSqliteWorkerRequest,
  isSqliteWorkerResponse,
  type SqliteWorkerRequest,
} from '../../../../../src/lib/offline/sqlite/workerProtocol.ts';

Deno.test('worker protocol accepts a parameterized query and rejects an unknown command', () => {
  const request: SqliteWorkerRequest = {
    requestId: 'request-1',
    type: 'query',
    sql: 'select 1',
    params: [],
  };

  assert(isSqliteWorkerRequest(request));
  assert(!isSqliteWorkerRequest({ requestId: 'request-2', type: 'drop-database' }));
  assert(!isSqliteWorkerRequest({ requestId: 'request-3', type: 'query', sql: 'select 1', params: 'not-an-array' }));
});

Deno.test('worker protocol accepts result and structured error responses', () => {
  assert(isSqliteWorkerResponse({ requestId: 'request-1', type: 'result', rows: [{ value: 1 }] }));
  assert(isSqliteWorkerResponse({ requestId: 'request-2', type: 'error', error: { code: 'SQLITE_ERROR', message: 'failed' } }));
  assertEquals(isSqliteWorkerResponse({ requestId: 'request-3', type: 'result' }), false);
});
