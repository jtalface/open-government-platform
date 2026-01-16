"use client";

import { useQuery } from "@tanstack/react-query";
import { Card } from "@ogp/ui";

export function DashboardStats() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      // TODO: Implement stats API endpoint
      return {
        openIncidents: 12,
        activeTickets: 8,
        resolvedThisWeek: 15,
        avgResolutionTime: "3.5 dias",
      };
    },
  });

  const statCards = [
    {
      label: "Ocorrências Abertas",
      value: stats?.openIncidents || 0,
      icon: "📍",
      color: "text-blue-600",
    },
    {
      label: "Tickets Ativos",
      value: stats?.activeTickets || 0,
      icon: "🎫",
      color: "text-yellow-600",
    },
    {
      label: "Resolvidos (7 dias)",
      value: stats?.resolvedThisWeek || 0,
      icon: "✅",
      color: "text-green-600",
    },
    {
      label: "Tempo Médio",
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

