"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n/TranslationContext";

export function ManagerIncidentFilters() {
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
  const currentStatus = searchParams.get("status") || "";

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/dashboard/incidents?${params.toString()}`);
  };

  const statuses = [
    { value: "", label: t("incidents.allStatuses") },
    { value: "OPEN", label: t("incidents.status_open") },
    { value: "TRIAGED", label: t("incidents.status_triaged") },
    { value: "TICKETED", label: t("incidents.status_ticketed") },
    { value: "RESOLVED", label: t("incidents.status_resolved") },
    { value: "CLOSED", label: t("incidents.status_closed") },
  ];

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
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">{t("incidents.filters")}</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Category Filter */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">{t("incidents.category")}</label>
          <select
            value={currentCategory}
            onChange={(e) => handleFilterChange("categoryId", e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t("incidents.allCategories")}</option>
            {categories?.map((cat: any) => (
              <option key={cat.id} value={cat.id}>
                {translateCategory(cat.name)}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">{t("incidents.status")}</label>
          <select
            value={currentStatus}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">{t("common.search")}</label>
          <input
            type="text"
            placeholder={t("common.searchPlaceholder")}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => {
              const value = e.target.value;
              const params = new URLSearchParams(searchParams);
              if (value) {
                params.set("search", value);
              } else {
                params.delete("search");
              }
              router.push(`/dashboard/incidents?${params.toString()}`);
            }}
          />
        </div>
      </div>
    </div>
  );
}
