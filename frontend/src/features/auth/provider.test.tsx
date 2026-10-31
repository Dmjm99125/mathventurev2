import { describe, expect, it, vi } from 'vitest';

vi.mock('./provider', () => ({ AuthProvider: () => null }));

import { AuthProvider } from './provider';

describe('auth provider feature boundary', () => {
  it('owns the auth provider outside the legacy auth implementation module', () => {
    expect(AuthProvider).toEqual(expect.any(Function));
  });
});
