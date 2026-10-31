import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({ useAuth: vi.fn() }));
vi.mock('@/lib/offline/classroom/useOfflineClassroom', () => ({ useOfflineClassroom: vi.fn() }));
vi.mock('@/lib/offline/classroom/freePlay', () => ({ recordFreePlayCompletion: vi.fn() }));

import { useRecordFreePlayCompletion } from './hooks';

describe('progress hook boundary', () => {
  it('exposes free-play persistence through a non-game feature module', () => {
    expect(useRecordFreePlayCompletion).toEqual(expect.any(Function));
  });
});
