"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Card, LoadingSpinner } from "@ogp/ui";
import { useTranslation } from "@/lib/i18n/TranslationContext";

export function DashboardStats() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId") || "";

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats", categoryId],
    queryFn: async () => {
      const url = categoryId 
        ? `/api/dashboard/stats?categoryId=${categoryId}`
        : "/api/dashboard/stats";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      return data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const statCards = [
    {
      label: t("dashboard.openIncidents"),
      value: stats?.openIncidents || 0,
      icon: "📍",
      color: "text-blue-600",
    },
    {
      label: t("dashboard.totalTickets"),
      value: stats?.activeTickets || 0,
      icon: "🎫",
      color: "text-yellow-600",
    },
    {
      label: t("dashboard.resolvedIncidents"),
      value: stats?.resolvedThisWeek || 0,
      icon: "✅",
      color: "text-green-600",
    },
    {
      label: t("dashboard.avgResolutionTime"),
      value: stats?.avgResolutionTime || "-",
      icon: "⏱️",
      color: "text-purple-600",
    },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.label} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className={`mt-2 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
            <div className="text-4xl">{stat.icon}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}

