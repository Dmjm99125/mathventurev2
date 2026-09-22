import { assert, assertEquals } from "jsr:@std/assert";
import {
  buildMediaDownloadStatus,
  canActivateMediaCache,
  createActiveMediaCacheName,
  createStagingMediaCacheName,
  getMissingMediaEntries,
  createRangeResponse,
} from "../../../src/pwa/mediaCache.ts";

const manifest = {
  schemaVersion: 1 as const,
  version: "abc123",
  totalFiles: 3,
  totalBytes: 600,
  entries: [
    { url: "/assets/images/one.png", bytes: 100 },
    { url: "/assets/audio/two.mp3", bytes: 200 },
    { url: "/assets/videos/three.mp4", bytes: 300 },
  ],
};

Deno.test("media cache names separate resumable staging from active versions", () => {
  assertEquals(createStagingMediaCacheName("abc123"), "mathventure-free-play-media-staging-abc123");
  assertEquals(createActiveMediaCacheName("abc123"), "mathventure-free-play-media-abc123");
});

Deno.test("media cache resumes by downloading only entries missing from staging", () => {
  const missing = getMissingMediaEntries(manifest, new Set(["/assets/images/one.png"]));

  assertEquals(missing.map((entry) => entry.url), ["/assets/audio/two.mp3", "/assets/videos/three.mp4"]);
  assertEquals(buildMediaDownloadStatus(manifest, new Set(["/assets/images/one.png"])), {
    state: "downloading",
    version: "abc123",
    totalFiles: 3,
    completedFiles: 1,
    totalBytes: 600,
    completedBytes: 100,
  });
});

Deno.test("media cache activates only after every manifest entry is complete", () => {
  assertEquals(canActivateMediaCache(manifest, new Set(["/assets/images/one.png", "/assets/audio/two.mp3"])), false);
  assertEquals(canActivateMediaCache(manifest, new Set(manifest.entries.map((entry) => entry.url))), true);
});

Deno.test("cached video ranges return a standards-compliant partial response", async () => {
  const original = new Response(new Uint8Array([0, 1, 2, 3, 4, 5]), {
    status: 200,
    headers: { "Content-Type": "video/mp4", "Content-Length": "6" },
  });
  const request = new Request("https://mathventure.test/assets/videos/sample.mp4", {
    headers: { Range: "bytes=2-4" },
  });

  const partial = await createRangeResponse(request, original);

  assert(partial);
  assertEquals(partial.status, 206);
  assertEquals(partial.headers.get("Content-Range"), "bytes 2-4/6");
  assertEquals(partial.headers.get("Accept-Ranges"), "bytes");
  assertEquals(partial.headers.get("Content-Length"), "3");
  assertEquals([...new Uint8Array(await partial.arrayBuffer())], [2, 3, 4]);
});
