"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import ptTranslations from "../../../public/locales/pt.json";
import enTranslations from "../../../public/locales/en.json";

type Locale = "pt" | "en";
type Translations = typeof ptTranslations;

interface TranslationContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

const translations: Record<Locale, Translations> = {
  pt: ptTranslations,
  en: enTranslations,
};

const LOCALE_COOKIE = "locale";

export function TranslationProvider({ children }: { children: ReactNode }) {
  // Always start with default locale to avoid hydration mismatch
  const [locale, setLocaleState] = useState<Locale>("pt");
  const [isHydrated, setIsHydrated] = useState(false);

  // Read locale from cookie after hydration
  useEffect(() => {
    const savedLocale = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${LOCALE_COOKIE}=`))
      ?.split("=")[1] as Locale;
    
    if (savedLocale && (savedLocale === "pt" || savedLocale === "en")) {
      setLocaleState(savedLocale);
    }
    
    setIsHydrated(true);
  }, []);

  // Save locale to cookie when it changes
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    // Set cookie for 1 year
    document.cookie = `${LOCALE_COOKIE}=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`;
  };

  // Translation function with nested key support (e.g., "common.loading")
  const t = (key: string): string => {
    const keys = key.split(".");
    let value: any = translations[locale];

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation missing for key: ${key} (locale: ${locale})`);
        return key; // Return the key if translation not found
      }
    }

    return typeof value === "string" ? value : key;
  };

  return (
    <TranslationContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

// Custom hook to use translations
export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
}

