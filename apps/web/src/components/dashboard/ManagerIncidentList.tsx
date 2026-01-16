"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Card, Badge, LoadingSpinner } from "@ogp/ui";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { CreateTicketModal } from "./CreateTicketModal";

export function ManagerIncidentList() {
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
        <p className="text-gray-500">Nenhuma ocorrência encontrada</p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {incidents.map((incident: any) => (
          <Card key={incident.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="info">{incident.category.name}</Badge>
                  <Badge variant={getStatusVariant(incident.status)}>
                    {getStatusLabel(incident.status)}
                  </Badge>
                  {incident.ticketId && <Badge variant="success">Com Ticket</Badge>}
                </div>

                <h3 className="mb-2 text-lg font-semibold text-gray-900">{incident.title}</h3>

                <p className="mb-3 line-clamp-2 text-gray-600">{incident.description}</p>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span>📍 {incident.neighborhood?.name || "Desconhecido"}</span>
                  <span>
                    🕐{" "}
                    {formatDistanceToNow(new Date(incident.createdAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                  <span>👤 {incident.createdBy.name}</span>
                  <span>
                    👍 {incident.voteStats?.upvotes || 0} / 👎 {incident.voteStats?.downvotes || 0}
                  </span>
                  <span>⭐ Score: {incident.importanceScore.toFixed(1)}</span>
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
                  <option value="OPEN">Aberto</option>
                  <option value="TRIAGED">Triagem</option>
                  <option value="TICKETED">Em Atendimento</option>
                  <option value="RESOLVED">Resolvido</option>
                  <option value="CLOSED">Fechado</option>
                </select>

                {/* Create Ticket Button */}
                {!incident.ticketId && (
                  <button
                    onClick={() => setSelectedIncident(incident)}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Criar Ticket
                  </button>
                )}

                {/* View Details */}
                <a
                  href={`/incidents/${incident.id}`}
                  target="_blank"
                  className="rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Ver Detalhes
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

function getStatusLabel(status: string): string {
  switch (status) {
    case "OPEN":
      return "Aberto";
    case "TRIAGED":
      return "Triagem";
    case "TICKETED":
      return "Em Atendimento";
    case "RESOLVED":
      return "Resolvido";
    case "CLOSED":
      return "Fechado";
    default:
      return status;
  }
}

