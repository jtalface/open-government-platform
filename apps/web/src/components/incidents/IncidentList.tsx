"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, Badge, LoadingSpinner } from "@ogp/ui";
import { formatDistanceToNow } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useTranslation } from "@/lib/i18n/TranslationContext";

export function IncidentList() {
  const { t, locale } = useTranslation();
  const searchParams = useSearchParams();

  const { data, isLoading } = useQuery({
    queryKey: ["incidents", searchParams.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/incidents?${searchParams.toString()}`);
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

  const incidents = data?.items || [];

  if (incidents.length === 0) {
    return (
      <div className="rounded-xl bg-white p-12 text-center shadow-sm">
        <p className="text-gray-500">{t("incidents.noIncidentsFound")}</p>
      </div>
    );
  }

  const dateFnsLocale = locale === "pt" ? ptBR : enUS;

  return (
    <div className="space-y-4">
      {incidents.map((incident: any) => {
        // Parse media if it's a JSON string
        let mediaArray: any[] = [];
        if (incident.media) {
          if (typeof incident.media === "string") {
            try {
              mediaArray = JSON.parse(incident.media);
            } catch {
              mediaArray = [];
            }
          } else if (Array.isArray(incident.media)) {
            mediaArray = incident.media;
          }
        }
        const firstImage = mediaArray.find((m: any) => m.type === "IMAGE");

        return (
          <Link key={incident.id} href={`/incidents/${incident.id}`}>
            <Card hover className="p-6 transition-all">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="info">{translateCategory(incident.category.name, t)}</Badge>
                    <Badge variant={getStatusVariant(incident.status)}>
                      {getStatusLabel(incident.status, t)}
                    </Badge>
                  </div>

                  <h3 className="mb-2 text-lg font-semibold text-gray-900">{incident.title}</h3>

                  <p className="mb-3 line-clamp-2 text-gray-600">{incident.description}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      📍 {incident.neighborhood?.name || t("incidents.locationUnidentified")}
                    </span>
                    <span>
                      🕐{" "}
                      {formatDistanceToNow(new Date(incident.createdAt), {
                        addSuffix: true,
                        locale: dateFnsLocale,
                      })}
                    </span>
                  </div>
                </div>

                {/* Right side: Image and votes */}
                <div className="flex flex-col items-end gap-3 flex-shrink-0">
                  {/* Image preview */}
                  {firstImage ? (
                    <div className="w-32 h-32 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0">
                      <img
                        src={firstImage.url}
                        alt={incident.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-lg border border-gray-200 bg-gray-50 flex-shrink-0 flex items-center justify-center">
                      <svg
                        className="w-12 h-12 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Votes */}
                  <div className="flex items-center gap-1 text-sm">
                    <span className="font-semibold">
                      {(incident.voteStats?.upvotes || 0) - (incident.voteStats?.downvotes || 0)}
                    </span>
                    <span className="text-gray-500">{t("common.votes")}</span>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
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
