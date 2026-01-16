"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, LoadingSpinner } from "@ogp/ui";

export function AdminStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
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
      title: "Total de Utilizadores",
      value: stats?.data?.totalUsers || 0,
      icon: "👥",
      color: "blue",
    },
    {
      title: "Ocorrências Abertas",
      value: stats?.data?.openIncidents || 0,
      icon: "📍",
      color: "yellow",
    },
    {
      title: "Tickets Ativos",
      value: stats?.data?.activeTickets || 0,
      icon: "🎫",
      color: "green",
    },
    {
      title: "Categorias",
      value: stats?.data?.totalCategories || 0,
      icon: "📂",
      color: "purple",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className="text-4xl">{stat.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Atividade Recente</h2>
        
        {stats?.data?.recentActivity && stats.data.recentActivity.length > 0 ? (
          <div className="space-y-3">
            {stats.data.recentActivity.map((activity: any, index: number) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded-lg border border-gray-200 p-3"
              >
                <span className="text-2xl">{getActivityIcon(activity.action)}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.actorName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {getActivityDescription(activity)}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(activity.createdAt).toLocaleString("pt-PT")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Nenhuma atividade recente</p>
        )}
      </Card>

      {/* System Info */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Informação do Sistema</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Município:</span>
              <span className="font-medium text-gray-900">
                {stats?.data?.municipalityName || "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bairros:</span>
              <span className="font-medium text-gray-900">
                {stats?.data?.totalNeighborhoods || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Managers:</span>
              <span className="font-medium text-gray-900">
                {stats?.data?.totalManagers || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cidadãos:</span>
              <span className="font-medium text-gray-900">
                {stats?.data?.totalCitizens || 0}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Status do Sistema</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <span className="text-gray-900">Base de Dados</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <span className="text-gray-900">API</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <span className="text-gray-900">Autenticação</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function getActivityIcon(action: string): string {
  const icons: Record<string, string> = {
    CREATE: "➕",
    UPDATE: "✏️",
    DELETE: "🗑️",
    ROLE_CHANGE: "🔄",
    STATUS_CHANGE: "📝",
  };
  return icons[action] || "📌";
}

function getActivityDescription(activity: any): string {
  const { action, entityType } = activity;
  const descriptions: Record<string, string> = {
    CREATE: `criou ${entityType}`,
    UPDATE: `atualizou ${entityType}`,
    DELETE: `eliminou ${entityType}`,
    ROLE_CHANGE: `alterou role de utilizador`,
    STATUS_CHANGE: `alterou status`,
  };
  return descriptions[action] || action;
}

