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

  const avgResolutionTime = stats?.avgResolutionTime || {
    triagem: "-",
    resposta: "-",
    resolucao: "-",
  };

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
      value: avgResolutionTime,
      icon: "⏱️",
      color: "text-purple-600",
      isTimeObject: true,
    },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.label} className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              {stat.isTimeObject ? (
                <div className="mt-2 space-y-1">
                  <div className="text-lg font-semibold text-gray-900">
                    <span className="text-purple-600">{t("dashboard.triagem")}:</span>{" "}
                    <span className="font-bold">{avgResolutionTime.triagem}</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    <span className="text-purple-600">{t("dashboard.resposta")}:</span>{" "}
                    <span className="font-bold">{avgResolutionTime.resposta}</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    <span className="text-purple-600">{t("dashboard.resolucao")}:</span>{" "}
                    <span className="font-bold">{avgResolutionTime.resolucao}</span>
                  </div>
                </div>
              ) : (
                <p className={`mt-2 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              )}
            </div>
            <div className="text-4xl">{stat.icon}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}

