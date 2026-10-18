import { assertEquals } from 'jsr:@std/assert';
import { createPwaSqliteDatabase } from '../../../../../src/lib/offline/sqlite/pwaAdapter.ts';

class FakeWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  terminated = false;

  postMessage(message: { requestId: string; type: string }): void {
    queueMicrotask(() => {
      if (message.type === 'health') {
        this.onmessage?.({ data: { requestId: message.requestId, type: 'result', rows: [], health: { schemaVersion: 1, durable: true, quality: 'persistent' } } } as MessageEvent);
        return;
      }
      this.onmessage?.({ data: { requestId: message.requestId, type: 'result', rows: [{ value: 1 }] } } as MessageEvent);
    });
  }

  terminate(): void {
    this.terminated = true;
  }
}

Deno.test('PWA adapter correlates worker responses by request ID', async () => {
  const worker = new FakeWorker();
  const database = await createPwaSqliteDatabase({ workerFactory: () => worker as unknown as Worker });

  assertEquals(await database.query<{ value: number }>('select 1'), [{ value: 1 }]);
  assertEquals(await database.health(), { schemaVersion: 1, durable: true, quality: 'persistent' });

  await database.close();
  assertEquals(worker.terminated, true);
});
