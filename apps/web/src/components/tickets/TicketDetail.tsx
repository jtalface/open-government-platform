"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, Badge, LoadingSpinner, Button } from "@ogp/ui";
import { useTranslation } from "@/lib/i18n/TranslationContext";
import { CreateProjectModal } from "../projects/CreateProjectModal";

interface TicketDetailProps {
  ticketId: string;
}

export function TicketDetail({ ticketId }: TicketDetailProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: async () => {
      const res = await fetch(`/api/tickets/${ticketId}`);
      if (!res.ok) throw new Error("Failed to fetch ticket");
      const result = await res.json();
      return result.data;
    },
  });

  const isAdmin = session?.user?.role === "ADMIN";

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">{t("common.loading")}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-center">
        <p className="text-red-600">{t("common.error")}</p>
        <Link href="/dashboard/tickets" className="mt-4 inline-block text-blue-600 hover:underline">
          ← {t("common.back")}
        </Link>
      </div>
    );
  }

  const ticket = data;
  const hasProject = !!ticket.project;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/dashboard/tickets"
        className="inline-flex items-center text-sm text-blue-600 hover:underline"
      >
        ← {t("common.back")}
      </Link>

      {/* Ticket Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-2">
              <Badge variant="info">{t(`tickets.priority_${ticket.priority.toLowerCase()}`)}</Badge>
              <Badge variant="success">{t(`tickets.status_${ticket.status.toLowerCase()}`)}</Badge>
            </div>

            <h1 className="mb-2 text-3xl font-bold text-gray-900">{ticket.title}</h1>
            <p className="text-gray-700">{ticket.description}</p>
          </div>

          {/* Admin Actions */}
          {isAdmin && !hasProject && (
            <Button onClick={() => setIsCreateProjectModalOpen(true)} className="ml-6">
              🏗️ {t("projects.createFromTicket")}
            </Button>
          )}

          {hasProject && (
            <Link
              href={`/projects/${ticket.project.id}`}
              className="ml-6 rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100"
            >
              📋 {t("projects.viewProject")} →
            </Link>
          )}
        </div>
      </Card>

      {/* Ticket Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{t("tickets.title")}</h2>
          <div className="space-y-3">
            <InfoRow label={t("tickets.priority")} value={t(`tickets.priority_${ticket.priority.toLowerCase()}`)} />
            <InfoRow label={t("tickets.status")} value={t(`tickets.status_${ticket.status.toLowerCase()}`)} />
            {ticket.category && (
              <InfoRow label={t("incidents.category")} value={ticket.category.name} />
            )}
            {ticket.assignedTo && (
              <InfoRow label={t("tickets.assignTo")} value={ticket.assignedTo.name} />
            )}
            {ticket.createdBy && (
              <InfoRow label={t("projects.createdBy")} value={ticket.createdBy.name} />
            )}
          </div>
        </Card>

        {ticket.incident && (
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {t("tickets.linkedIncident")}
            </h2>
            <Link
              href={`/incidents/${ticket.incident.id}`}
              className="block rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{ticket.incident.description}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {ticket.incident.address || t("incidents.locationUnidentified")}
                  </p>
                </div>
                <span className="text-blue-600">→</span>
              </div>
            </Link>
          </Card>
        )}
      </div>

      {/* Ticket Updates */}
      {ticket.updates && ticket.updates.length > 0 && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{t("tickets.updates")}</h2>
          <div className="space-y-4">
            {ticket.updates.map((update: any) => (
              <div key={update.id} className="border-l-4 border-blue-500 pl-4">
                <p className="text-gray-700">{update.message}</p>
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                  <span>{update.author.name}</span>
                  <span>•</span>
                  <span>{new Date(update.createdAt).toLocaleString("pt-PT")}</span>
                  {update.visibility === "INTERNAL" && (
                    <>
                      <span>•</span>
                      <Badge variant="warning" size="sm">
                        {t("projects.internalUpdate")}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Create Project Modal */}
      {isCreateProjectModalOpen && (
        <CreateProjectModal
          ticket={ticket}
          onClose={() => setIsCreateProjectModalOpen(false)}
          onSuccess={() => {
            setIsCreateProjectModalOpen(false);
            window.location.href = "/projects";
          }}
        />
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-gray-100 pb-2">
      <span className="font-medium text-gray-600">{label}:</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}

