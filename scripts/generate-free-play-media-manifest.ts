import { createHash } from 'node:crypto';
import { readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

export const SUPPORTED_MEDIA_EXTENSIONS = new Set([
  '.avif',
  '.gif',
  '.jpeg',
  '.jpg',
  '.mp3',
  '.mp4',
  '.ogg',
  '.png',
  '.wav',
  '.webm',
  '.webp',
]);

export interface FreePlayMediaManifestEntry {
  url: string;
  bytes: number;
}

export interface FreePlayMediaManifest {
  schemaVersion: 1;
  version: string;
  totalFiles: number;
  totalBytes: number;
  entries: FreePlayMediaManifestEntry[];
}

export function isSupportedMediaPath(filePath: string): boolean {
  const extension = filePath.slice(filePath.lastIndexOf('.')).toLowerCase();
  return SUPPORTED_MEDIA_EXTENSIONS.has(extension);
}

function toMediaUrl(filePath: string): string {
  return `/assets/${filePath.replaceAll('\\', '/')}`;
}

function createManifestVersion(entries: FreePlayMediaManifestEntry[]): string {
  return createHash('sha256')
    .update(entries.map((entry) => `${entry.url}:${entry.bytes}`).join('\n'))
    .digest('hex')
    .slice(0, 16);
}

async function collectFiles(root: string, current: string, entries: FreePlayMediaManifestEntry[]) {
  for (const item of await readdir(current, { withFileTypes: true })) {
    const absolutePath = join(current, item.name);
    if (item.isDirectory()) {
      await collectFiles(root, absolutePath, entries);
      continue;
    }

    if (!item.isFile()) {
      continue;
    }

    const relativePath = relative(root, absolutePath);
    if (!isSupportedMediaPath(relativePath)) {
      continue;
    }

    entries.push({
      url: toMediaUrl(relativePath),
      bytes: (await stat(absolutePath)).size,
    });
  }
}

export async function collectFreePlayMediaManifest(assetsDirectory: string): Promise<FreePlayMediaManifest> {
  const entries: FreePlayMediaManifestEntry[] = [];
  await collectFiles(assetsDirectory, assetsDirectory, entries);
  entries.sort((left, right) => (left.url < right.url ? -1 : left.url > right.url ? 1 : 0));

  return {
    schemaVersion: 1,
    version: createManifestVersion(entries),
    totalFiles: entries.length,
    totalBytes: entries.reduce((total, entry) => total + entry.bytes, 0),
    entries,
  };
}
