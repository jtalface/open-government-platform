"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, Badge, LoadingSpinner } from "@ogp/ui";
import { formatDistanceToNow } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/TranslationContext";

/**
 * Ticket List Component
 * Displays all tickets with filtering and status updates
 */
export function TicketList() {
  const { t, locale } = useTranslation();
  const { data, isLoading, error } = useQuery({
    queryKey: ["tickets"],
    queryFn: async () => {
      const response = await fetch("/api/tickets");
      if (!response.ok) {
        throw new Error("Failed to fetch tickets");
      }
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

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-center">
        <p className="text-red-600">{t("common.error")}</p>
      </div>
    );
  }

  const tickets = data?.data?.items || [];

  if (tickets.length === 0) {
    return (
      <div className="rounded-xl bg-gray-100 p-8 text-center">
        <p className="text-gray-600">{t("tickets.noTickets")}</p>
      </div>
    );
  }

  const dateLocale = locale === "en" ? enUS : ptBR;

  return (
    <div className="space-y-4">
      {tickets.map((ticket: any) => (
        <Card key={ticket.id} hover className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <Badge variant={getPriorityVariant(ticket.priority)}>
                  {getPriorityLabel(ticket.priority, t)}
                </Badge>
                <Badge variant={getStatusVariant(ticket.status)}>
                  {getStatusLabel(ticket.status, t)}
                </Badge>
              </div>

              <h3 className="mb-2 text-lg font-semibold text-gray-900">{ticket.title}</h3>

              <p className="mb-3 text-sm text-gray-600 line-clamp-2">
                {ticket.description}
              </p>

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>📂 {ticket.category?.name || t("common.notAvailable")}</span>
                {ticket.assignedTo && <span>👤 {ticket.assignedTo.name}</span>}
                {ticket.incident && (
                  <span>🔗 {t("tickets.linkedIncident")} #{ticket.incident.id.slice(0, 8)}</span>
                )}
                <span>
                  🕒{" "}
                  {formatDistanceToNow(new Date(ticket.createdAt), {
                    addSuffix: true,
                    locale: dateLocale,
                  })}
                </span>
              </div>

              {ticket.updates && ticket.updates.length > 0 && (
                <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm">
                  <p className="font-medium text-gray-700">Última atualização:</p>
                  <p className="text-gray-600">{ticket.updates[0].message}</p>
                </div>
              )}
            </div>

            <div className="ml-4">
              <Link
                href={`/dashboard/tickets/${ticket.id}`}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Ver detalhes →
              </Link>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    LOW: "Baixa",
    MEDIUM: "Média",
    HIGH: "Alta",
    URGENT: "Urgente",
  };
  return labels[priority] || priority;
}

function getPriorityVariant(priority: string): "success" | "warning" | "error" | "info" {
  const variants: Record<string, "success" | "warning" | "error" | "info"> = {
    LOW: "success",
    MEDIUM: "info",
    HIGH: "warning",
    URGENT: "error",
  };
  return variants[priority] || "info";
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    NEW: "Novo",
    IN_PROGRESS: "Em Progresso",
    BLOCKED: "Bloqueado",
    DONE: "Concluído",
    CLOSED: "Fechado",
  };
  return labels[status] || status;
}

function getStatusVariant(status: string): "success" | "warning" | "error" | "info" {
  const variants: Record<string, "success" | "warning" | "error" | "info"> = {
    NEW: "info",
    IN_PROGRESS: "warning",
    BLOCKED: "error",
    DONE: "success",
    CLOSED: "success",
  };
  return variants[status] || "info";
}

