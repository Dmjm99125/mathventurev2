import { describe, expect, it, vi } from 'vitest';

import { loadOnlineFirst } from '@infrastructure/api/online-first';

describe('loadOnlineFirst', () => {
  it('uses the server result when a stale cache is present', async () => {
    const readCache = vi.fn().mockResolvedValue({ score: 0 });
    const readServer = vi.fn().mockResolvedValue({ score: 87 });

    await expect(loadOnlineFirst({
      isOffline: false,
      readCache,
      readServer,
    })).resolves.toEqual({ score: 87 });
    expect(readServer).toHaveBeenCalledOnce();
  });

  it('falls back to a usable cached result when the server is unavailable', async () => {
    const readCache = vi.fn().mockResolvedValue({ score: 87 });
    const readServer = vi.fn().mockRejectedValue(new Error('offline'));

    await expect(loadOnlineFirst({
      isOffline: false,
      readCache,
      readServer,
    })).resolves.toEqual({ score: 87 });
  });

  it('does not hide a server error behind an unusable empty cache', async () => {
    const serverError = new Error('server failed');
    const readCache = vi.fn().mockResolvedValue(null);
    const readServer = vi.fn().mockRejectedValue(serverError);

    await expect(loadOnlineFirst({
      isOffline: false,
      readCache,
      readServer,
    })).rejects.toBe(serverError);
  });
});
