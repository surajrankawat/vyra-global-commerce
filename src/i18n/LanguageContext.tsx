import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  SupportedLanguageCode,
  SUPPORTED_LANGUAGES,
  LanguageInfo,
  translations,
  TranslationDictionary,
} from './translations';

interface LanguageContextType {
  language: SupportedLanguageCode;
  setLanguage: (lang: SupportedLanguageCode) => void;
  currentLanguageInfo: LanguageInfo;
  isRTL: boolean;
  t: TranslationDictionary;
  supportedLanguages: LanguageInfo[];
}

const STORAGE_KEY = 'ms_nexus_user_language';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguageCode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguageCode;
      if (saved && translations[saved]) {
        return saved;
      }
      // Browser language auto-detection
      const browserLang = navigator.language?.split('-')[0]?.toLowerCase() as SupportedLanguageCode;
      if (browserLang && translations[browserLang]) {
        return browserLang;
      }
    }
    return 'en';
  });

  const currentLanguageInfo = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  const isRTL = currentLanguageInfo.direction === 'rtl';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
  }, [language, isRTL]);

  const setLanguage = (newLang: SupportedLanguageCode) => {
    if (translations[newLang]) {
      setLanguageState(newLang);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, newLang);
      }
    }
  };

  const currentTranslations = useMemo(() => {
    return translations[language] || translations.en;
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        currentLanguageInfo,
        isRTL,
        t: currentTranslations,
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
