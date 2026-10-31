import { describe, expect, it } from 'vitest';
import {
  buildMediaDownloadStatus,
  canActivateMediaCache,
  createActiveMediaCacheName,
  createStagingMediaCacheName,
  getMissingMediaEntries,
} from './mediaCache';

const manifest = {
  schemaVersion: 1 as const,
  version: 'v1',
  totalFiles: 2,
  totalBytes: 30,
  entries: [
    { url: '/assets/a.mp4', bytes: 10 },
    { url: '/assets/b.mp3', bytes: 20 },
  ],
};

describe('offline media cache contract', () => {
  it('keeps staging and active cache names stable', () => {
    expect(createStagingMediaCacheName('v1')).toBe('mathventure-free-play-media-staging-v1');
    expect(createActiveMediaCacheName('v1')).toBe('mathventure-free-play-media-v1');
  });

  it('identifies missing entries and activation readiness', () => {
    const completed = new Set(['/assets/a.mp4']);

    expect(getMissingMediaEntries(manifest, completed)).toEqual([manifest.entries[1]]);
    expect(canActivateMediaCache(manifest, completed)).toBe(false);
    expect(canActivateMediaCache(manifest, new Set(manifest.entries.map((entry) => entry.url)))).toBe(true);
  });

  it('reports completed file and byte progress', () => {
    expect(buildMediaDownloadStatus(manifest, new Set(['/assets/a.mp4']))).toEqual({
      state: 'downloading',
      version: 'v1',
      totalFiles: 2,
      completedFiles: 1,
      totalBytes: 30,
      completedBytes: 10,
    });
  });
});
