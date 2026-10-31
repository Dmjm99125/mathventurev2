import { createContext, useContext } from 'react';

export type Language = 'en' | 'tl';

export type LanguageContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
};

export const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: () => '',
});

export function useLanguage(): LanguageContextType {
  return useContext(LanguageContext);
}
