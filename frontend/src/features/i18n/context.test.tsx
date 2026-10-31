import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LanguageContext, useLanguage, type LanguageContextType } from './context';

const value: LanguageContextType = {
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
};

describe('language context boundary', () => {
  it('preserves the language consumer contract', () => {
    const result = renderHook(() => useLanguage(), {
      wrapper: ({ children }) => (
        <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
      ),
    });

    expect(result.result.current).toBe(value);
  });
});
