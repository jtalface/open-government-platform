"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n/TranslationContext";

export function DashboardFilters() {
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
    // Update URL without navigation to avoid page reload
    router.replace(`/dashboard?${params.toString()}`, { scroll: false });
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
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
          {t("incidents.category")}:
        </label>
        <select
          value={currentCategory}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="flex-1 max-w-xs rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{t("incidents.allCategories")}</option>
          {categories?.map((cat: any) => (
            <option key={cat.id} value={cat.id}>
              {translateCategory(cat.name)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
