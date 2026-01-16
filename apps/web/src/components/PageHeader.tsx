"use client";

import { useTranslation } from "@/lib/i18n/TranslationContext";

interface PageHeaderProps {
  titleKey: string;
  descriptionKey: string;
}

export function PageHeader({ titleKey, descriptionKey }: PageHeaderProps) {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">{t(titleKey)}</h1>
      <p className="mt-2 text-gray-600">{t(descriptionKey)}</p>
    </div>
  );
}

