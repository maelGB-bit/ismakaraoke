import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations, languages } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const LANGUAGE_KEY = 'karaoke_language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Initialize from localStorage synchronously to avoid flash
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LANGUAGE_KEY) as Language | null;
      if (saved && languages.some(l => l.code === saved)) {
        return saved;
      }
    }
    return 'pt';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_KEY, lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
