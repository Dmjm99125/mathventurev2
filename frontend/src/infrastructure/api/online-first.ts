export async function loadOnlineFirst<T>(input: {
  isOffline: boolean;
  readCache: () => Promise<T | null>;
  readServer: () => Promise<T>;
}): Promise<T> {
  if (input.isOffline) {
    const cached = await input.readCache();
    if (cached !== null) return cached;
    throw new Error('No cached data is available while offline.');
  }

  try {
    return await input.readServer();
  } catch (error) {
    const cached = await input.readCache();
    if (cached !== null) return cached;
    throw error;
  }
}
