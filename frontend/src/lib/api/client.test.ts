import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSupabase = vi.hoisted(() => ({
  functions: {
    invoke: vi.fn(),
  },
}));

vi.mock('../supabase/client', () => ({
  supabase: mockSupabase,
}));

import { invokeFunction } from './client';

describe('invokeFunction', () => {
  beforeEach(() => {
    mockSupabase.functions.invoke.mockReset();
  });

  it('builds the function path and request options from the transport contract', async () => {
    const invoke = vi.fn().mockResolvedValue({ data: { ok: true }, error: null });

    await expect(invokeFunction<{ ok: boolean }>('reports-overview', {
      method: 'POST',
      body: { window: '30d' },
      searchParams: { window: '30d', classId: 'class 1' },
    }, { functions: { invoke } })).resolves.toEqual({ ok: true });

    expect(invoke).toHaveBeenCalledWith(
      'reports-overview?window=30d&classId=class+1',
      { method: 'POST', body: { window: '30d' } },
    );
  });

  it('uses GET and omits a body when options do not provide them', async () => {
    const invoke = vi.fn().mockResolvedValue({ data: { ok: true }, error: null });

    await invokeFunction('dashboard-student', undefined, { functions: { invoke } });

    expect(invoke).toHaveBeenCalledWith('dashboard-student', { method: 'GET', body: undefined });
  });

  it('prefers an error returned by the function response context', async () => {
    const contextJson = vi.fn().mockResolvedValue({ error: 'Only teachers can view reports' });
    const invoke = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Edge Function returned a non-2xx status code', context: { json: contextJson } },
    });

    await expect(invokeFunction('reports-overview', undefined, { functions: { invoke } }))
      .rejects.toThrow('Only teachers can view reports');
  });
});
