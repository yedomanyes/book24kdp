import React, { createContext, useContext } from 'react';
import { type Language, type Translations, t } from '../i18n';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  tr: Translations;
  isDe: boolean;
}

export const LanguageContext = createContext<LanguageContextValue>({
  language: 'de',
  setLanguage: () => {},
  tr: t('de'),
  isDe: true,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{
  language: Language;
  setLanguage: (lang: Language) => void;
  children: React.ReactNode;
}> = ({ language, setLanguage, children }) => {
  const tr = t(language);
  const isDe = language === 'de';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, tr, isDe }}>
      {children}
    </LanguageContext.Provider>
  );
};
