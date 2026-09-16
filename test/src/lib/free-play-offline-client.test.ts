import { assertEquals, assertRejects } from "jsr:@std/assert";
import { createFreePlayOfflineClient } from "../../../src/lib/offline/freePlayOfflineClient.ts";
import type { MediaDownloadStatus } from "../../../src/pwa/mediaCache.ts";

const readyStatus = {
  state: "ready" as const,
  version: "abc123",
  totalFiles: 3,
  completedFiles: 3,
  totalBytes: 600,
  completedBytes: 600,
};

class FakeWorker extends EventTarget {
  readonly messages: unknown[] = [];

  postMessage(message: unknown) {
    this.messages.push(message);
  }
}

class FakeContainer extends EventTarget {
  readonly controller: FakeWorker;
  readonly ready: Promise<{ active: FakeWorker }>;

  constructor(worker: FakeWorker) {
    super();
    this.controller = worker;
    this.ready = Promise.resolve({ active: worker });
  }
}

function dispatchMessage(container: FakeContainer, data: unknown) {
  container.dispatchEvent(new MessageEvent("message", { data }));
}

Deno.test("offline client requests durable status through the active worker", async () => {
  const worker = new FakeWorker();
  const container = new FakeContainer(worker);
  const client = createFreePlayOfflineClient(container as unknown as Parameters<typeof createFreePlayOfflineClient>[0]);
  const statusPromise = client.getStatus();

  await new Promise((resolve) => setTimeout(resolve, 0));
  const request = worker.messages[0] as { type: string; requestId: string };
  assertEquals(request.type, "GET_MEDIA_STATUS");
  dispatchMessage(container, { type: "MEDIA_STATUS", requestId: request.requestId, status: readyStatus });

  assertEquals(await statusPromise, readyStatus);
  client.dispose();
});

Deno.test("offline client publishes progress and resolves a download after atomic ready status", async () => {
  const worker = new FakeWorker();
  const container = new FakeContainer(worker);
  const client = createFreePlayOfflineClient(container as unknown as Parameters<typeof createFreePlayOfflineClient>[0]);
  const received: string[] = [];
  const unsubscribe = client.subscribe((status: MediaDownloadStatus) => received.push(status.state));
  const downloadPromise = client.download();

  await new Promise((resolve) => setTimeout(resolve, 0));
  const request = worker.messages[0] as { type: string; requestId: string };
  dispatchMessage(container, {
    type: "MEDIA_PROGRESS",
    status: { ...readyStatus, state: "downloading", completedFiles: 2, completedBytes: 400 },
  });
  dispatchMessage(container, { type: "MEDIA_STATUS", requestId: request.requestId, status: readyStatus });

  await downloadPromise;
  assertEquals(received, ["downloading", "ready"]);
  unsubscribe();
  client.dispose();
});

Deno.test("offline client rejects unsupported browsers instead of silently pretending to download", async () => {
  const client = createFreePlayOfflineClient(undefined);

  await assertRejects(() => client.getStatus(), Error, "Offline Free Play is not supported");
  client.dispose();
});
