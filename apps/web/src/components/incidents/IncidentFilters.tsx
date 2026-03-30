"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n/TranslationContext";

export function IncidentFilters() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      const data = await res.json();
      return data.data;
    },
  });

  const currentCategory = searchParams.get("categoryId") || "";

  const handleCategoryChange = (categoryId: string) => {
    const params = new URLSearchParams(searchParams);
    if (categoryId) {
      params.set("categoryId", categoryId);
    } else {
      params.delete("categoryId");
    }
    router.push(`/incidents?${params.toString()}`);
  };

  const translateCategory = (categoryName: string): string => {
    const categoryMap: Record<string, string> = {
      "Saúde Pública": t("categories.publicHealth"),
      "Obras Públicas e Habitação": t("categories.publicWorks"),
      "Segurança Pública": t("categories.publicSafety"),
      "Eventos": t("categories.events"),
      "Infraestrutura": t("categories.infrastructure"),
      "Segurança": t("categories.safety"),
      "Limpeza": t("categories.cleaning"),
      "Trânsito": t("categories.traffic"),
      "Iluminação": t("categories.lighting"),
      "Meio Ambiente": t("categories.environment"),
    };
    
    return categoryMap[categoryName] || categoryName;
  };

  return (
    <div className="mb-6">
      <div className="max-w-md">
        <select
          id="incident-category-filter"
          value={currentCategory}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">{t("incidents.allCategories")}</option>
          {categories?.map((category: any) => (
            <option key={category.id} value={category.id}>
              {translateCategory(category.name)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
