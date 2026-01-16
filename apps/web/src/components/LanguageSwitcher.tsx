"use client";

import { useTranslation } from "@/lib/i18n/TranslationContext";

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
      <button
        onClick={() => setLocale("pt")}
        className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
          locale === "pt"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        PT
      </button>
      <button
        onClick={() => setLocale("en")}
        className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
          locale === "en"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        EN
      </button>
    </div>
  );
}

