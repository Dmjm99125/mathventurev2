import { describe, expect, it } from 'vitest';
import {
  isFreePlayMediaManifest,
  isFreePlayMediaUrl,
} from './mediaManifest';

describe('offline media manifest contract', () => {
  it('classifies only supported local asset media URLs', () => {
    expect(isFreePlayMediaUrl('/assets/videos/lesson.mp4')).toBe(true);
    expect(isFreePlayMediaUrl('/assets/audio/lesson.mp3')).toBe(true);
    expect(isFreePlayMediaUrl('/assets/data/lesson.json')).toBe(false);
    expect(isFreePlayMediaUrl('https://example.com/lesson.mp4')).toBe(false);
  });

  it('validates the manifest shape and rejects malformed entries', () => {
    expect(isFreePlayMediaManifest({
      schemaVersion: 1,
      version: 'v1',
      totalFiles: 1,
      totalBytes: 12,
      entries: [{ url: '/assets/videos/lesson.mp4', bytes: 12 }],
    })).toBe(true);
    expect(isFreePlayMediaManifest({ schemaVersion: 2, entries: [] })).toBe(false);
    expect(isFreePlayMediaManifest({
      schemaVersion: 1,
      version: 'v1',
      totalFiles: 1,
      totalBytes: 12,
      entries: [{ url: '/not-an-asset.mp4', bytes: 12 }],
    })).toBe(false);
  });
});
