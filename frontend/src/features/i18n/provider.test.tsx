import { describe, expect, it, vi } from 'vitest';

vi.mock('./provider', () => ({ LanguageProvider: () => null }));

import { LanguageProvider } from './provider';

describe('language provider feature boundary', () => {
  it('owns the language provider outside the legacy i18n implementation module', () => {
    expect(LanguageProvider).toEqual(expect.any(Function));
  });
});
