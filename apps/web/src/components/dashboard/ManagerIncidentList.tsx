"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Card, Badge, LoadingSpinner } from "@ogp/ui";
import { formatDistanceToNow } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useState } from "react";
import { CreateTicketModal } from "./CreateTicketModal";
import { useTranslation } from "@/lib/i18n/TranslationContext";

export function ManagerIncidentList() {
  const { t, locale } = useTranslation();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [selectedIncident, setSelectedIncident] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["manager-incidents", searchParams.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/incidents?${searchParams.toString()}`);
      const data = await res.json();
      return data.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/incidents/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager-incidents"] });
    },
  });

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const incidents = data?.items || [];

  if (incidents.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-gray-500">{t("incidents.noIncidentsFound")}</p>
      </Card>
    );
  }

  const dateFnsLocale = locale === "pt" ? ptBR : enUS;

  return (
    <>
      <div className="space-y-4">
        {incidents.map((incident: any) => (
          <Card key={incident.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="info">{translateCategory(incident.category.name, t)}</Badge>
                  <Badge variant={getStatusVariant(incident.status)}>
                    {getStatusLabel(incident.status, t)}
                  </Badge>
                  {incident.ticketId && <Badge variant="success">{t("incidents.withTicket")}</Badge>}
                </div>

                <h3 className="mb-2 text-lg font-semibold text-gray-900">{incident.title}</h3>

                <p className="mb-3 line-clamp-2 text-gray-600">{incident.description}</p>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span>📍 {incident.neighborhood?.name || t("common.unknown")}</span>
                  <span>
                    🕐{" "}
                    {formatDistanceToNow(new Date(incident.createdAt), {
                      addSuffix: true,
                      locale: dateFnsLocale,
                    })}
                  </span>
                  <span>👤 {incident.createdBy.name}</span>
                  <span>
                    👍 {incident.voteStats?.upvotes || 0} / 👎 {incident.voteStats?.downvotes || 0}
                  </span>
                  <span>⭐ {t("incidents.score")}: {incident.importanceScore.toFixed(1)}</span>
                </div>
              </div>

              <div className="ml-4 flex flex-col gap-2">
                {/* Status Change */}
                <select
                  value={incident.status}
                  onChange={(e) =>
                    updateStatusMutation.mutate({
                      id: incident.id,
                      status: e.target.value,
                    })
                  }
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={updateStatusMutation.isPending}
                >
                  <option value="OPEN">{t("incidents.status_open")}</option>
                  <option value="TRIAGED">{t("incidents.status_triaged")}</option>
                  <option value="TICKETED">{t("incidents.status_ticketed")}</option>
                  <option value="RESOLVED">{t("incidents.status_resolved")}</option>
                  <option value="CLOSED">{t("incidents.status_closed")}</option>
                </select>

                {/* Create Ticket Button */}
                {!incident.ticketId && (
                  <button
                    onClick={() => setSelectedIncident(incident)}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    {t("tickets.create")}
                  </button>
                )}

                {/* View Details */}
                <a
                  href={`/incidents/${incident.id}`}
                  target="_blank"
                  className="rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {t("common.viewDetails")}
                </a>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Ticket Modal */}
      {selectedIncident && (
        <CreateTicketModal incident={selectedIncident} onClose={() => setSelectedIncident(null)} />
      )}
    </>
  );
}

function getStatusVariant(status: string): "default" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "OPEN":
      return "warning";
    case "TRIAGED":
      return "info";
    case "TICKETED":
      return "info";
    case "RESOLVED":
      return "success";
    case "CLOSED":
      return "default";
    default:
      return "default";
  }
}

function getStatusLabel(status: string, t: (key: string) => string): string {
  switch (status) {
    case "OPEN":
      return t("incidents.status_open");
    case "TRIAGED":
      return t("incidents.status_triaged");
    case "TICKETED":
      return t("incidents.status_ticketed");
    case "RESOLVED":
      return t("incidents.status_resolved");
    case "CLOSED":
      return t("incidents.status_closed");
    default:
      return status;
  }
}

function translateCategory(categoryName: string, t: (key: string) => string): string {
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
}
