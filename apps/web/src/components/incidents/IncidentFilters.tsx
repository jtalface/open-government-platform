"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

export function IncidentFilters() {
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

  return (
    <div className="mb-6">
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => handleCategoryChange("")}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            !currentCategory
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          Todas
        </button>
        {categories?.map((category: any) => (
          <button
            key={category.id}
            onClick={() => handleCategoryChange(category.id)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              currentCategory === category.id
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}

