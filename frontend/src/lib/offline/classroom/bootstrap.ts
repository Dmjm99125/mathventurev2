import {
  isOfflineBootstrapResponse,
  type OfflineBootstrapResponse,
} from './types.ts';

export type BootstrapInvoker = (
  name: string,
  options?: { method?: 'GET' | 'POST' },
) => Promise<unknown>;

export async function downloadClassroomPack(
  invoke?: BootstrapInvoker,
): Promise<OfflineBootstrapResponse> {
  const request = invoke ?? (async (name, options) => {
    const { invokeFunction } = await import('../../api/client');
    return invokeFunction<unknown>(name, options);
  });
  const response = await request('offline-bootstrap', { method: 'GET' });
  if (!isOfflineBootstrapResponse(response)) {
    throw new Error('The offline classroom pack is invalid.');
  }
  return response;
}
