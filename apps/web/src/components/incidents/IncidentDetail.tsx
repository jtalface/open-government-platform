"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, Badge, LoadingSpinner } from "@ogp/ui";
import { VoteButtons } from "./VoteButtons";
import { formatDistanceToNow } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useTranslation } from "@/lib/i18n/TranslationContext";

interface IncidentDetailProps {
  incidentId: string;
}

export function IncidentDetail({ incidentId }: IncidentDetailProps) {
  const { t, locale } = useTranslation();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["incident", incidentId],
    queryFn: async () => {
      const res = await fetch(`/api/incidents/${incidentId}`);
      if (!res.ok) throw new Error("Failed to fetch incident");
      const data = await res.json();
      return data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Card className="p-12 text-center">
          <p className="text-gray-500">{t("incidents.incidentNotFound")}</p>
        </Card>
      </div>
    );
  }

  const incident = data;
  const dateFnsLocale = locale === "pt" ? ptBR : enUS;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
      >
        <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        {t("common.back")}
      </button>

      <Card className="overflow-hidden">
        {/* Header */}
        <div className="border-b bg-white p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge variant="info">{translateCategory(incident.category.name, t)}</Badge>
            <Badge variant={getStatusVariant(incident.status)}>
              {getStatusLabel(incident.status, t)}
            </Badge>
          </div>

          <h1 className="mb-4 text-3xl font-bold text-gray-900">{incident.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span>📍 {incident.neighborhood?.name || t("incidents.locationUnidentified")}</span>
            <span>
              🕐{" "}
              {formatDistanceToNow(new Date(incident.createdAt), {
                addSuffix: true,
                locale: dateFnsLocale,
              })}
            </span>
            <span>👤 {incident.createdBy.name}</span>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white p-6">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            {t("incidents.description")}
          </h2>
          <p className="whitespace-pre-wrap text-gray-700">{incident.description}</p>

          {/* Location map would go here */}
          <div className="mt-6 rounded-lg bg-gray-100 p-4">
            <p className="text-sm text-gray-600">
              {t("incidents.coordinates")}: {incident.lat.toFixed(6)}, {incident.lng.toFixed(6)}
            </p>
          </div>
        </div>

        {/* Voting */}
        <div className="border-t bg-gray-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">
                {t("incidents.isImportantToYou")}
              </p>
              <p className="text-xs text-gray-500">
                {incident.voteStats.total || 0} {t("incidents.peopleVoted")}
              </p>
            </div>

            <VoteButtons
              incidentId={incident.id}
              initialVote={incident.userVote}
              upvotes={incident.voteStats.upvotes || 0}
              downvotes={incident.voteStats.downvotes || 0}
            />
          </div>
        </div>

        {/* Ticket info if exists */}
        {incident.ticket && (
          <div className="border-t bg-white p-6">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              {t("incidents.serviceStatus")}
            </h2>

            <div className="rounded-lg bg-blue-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-blue-900">
                  {incident.ticket.title}
                </span>
                <Badge variant="info">{getTicketStatusLabel(incident.ticket.status, t)}</Badge>
              </div>

              {incident.ticket.updates && incident.ticket.updates.length > 0 && (
                <div className="mt-4 space-y-3">
                  <h3 className="text-sm font-medium text-blue-900">
                    {t("tickets.updates")}:
                  </h3>
                  {incident.ticket.updates.map((update: any) => (
                    <div key={update.id} className="rounded bg-white p-3">
                      <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                        <span>{update.author.name}</span>
                        <span>
                          {formatDistanceToNow(new Date(update.createdAt), {
                            addSuffix: true,
                            locale: dateFnsLocale,
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{update.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
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

function getTicketStatusLabel(status: string, t: (key: string) => string): string {
  switch (status) {
    case "NEW":
      return t("tickets.status_new");
    case "IN_PROGRESS":
      return t("tickets.status_inProgress");
    case "BLOCKED":
      return t("tickets.status_blocked");
    case "DONE":
      return t("tickets.status_done");
    case "CLOSED":
      return t("tickets.status_closed");
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
