import type { OfflineRepository } from './repository.ts';

export async function resolveOfflineConflict(
  repository: Pick<OfflineRepository, 'resolveConflict'>,
  bootstrapNow: () => Promise<void>,
  key: string,
  choice: 'local' | 'server',
): Promise<void> {
  await repository.resolveConflict(key, choice);

  if (choice === 'server') {
    await bootstrapNow();
  }
}
