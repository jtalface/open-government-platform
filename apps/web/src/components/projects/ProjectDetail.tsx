"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, Badge, LoadingSpinner, Button } from "@ogp/ui";
import { useTranslation } from "@/lib/i18n/TranslationContext";
import { EditProjectModal } from "./EditProjectModal";
import { ChangeStatusModal } from "./ChangeStatusModal";

interface ProjectDetailProps {
  projectId: string;
}

const STATUS_COLORS: Record<string, "default" | "info" | "success" | "warning" | "danger"> = {
  OPEN: "info",
  PLANNING: "info",
  FUNDED: "success",
  BIDDING: "warning",
  ASSIGNED: "warning",
  WORK_STARTED: "info",
  COMPLETED: "success",
};

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const { data: project, isLoading, error } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch project");
      const data = await res.json();
      return data.data;
    },
  });

  const isAdmin = session?.user?.role === "ADMIN";

  const handleArchive = async () => {
    if (!confirm(t("projects.archiveProject") + "?")) return;

    setIsArchiving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/archive`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to archive project");

      await queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    } catch (error) {
      console.error("Error archiving project:", error);
      alert(t("projects.errorUpdating"));
    } finally {
      setIsArchiving(false);
    }
  };

  const handleUnarchive = async () => {
    setIsArchiving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/archive`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to unarchive project");

      await queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    } catch (error) {
      console.error("Error unarchiving project:", error);
      alert(t("projects.errorUpdating"));
    } finally {
      setIsArchiving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">{t("common.loading")}</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-center">
        <p className="text-red-600">{t("projects.projectNotFound")}</p>
        <Link href="/projects" className="mt-4 inline-block text-blue-600 hover:underline">
          ← {t("common.back")}
        </Link>
      </div>
    );
  }

  const formatBudget = () => {
    if (!project.budgetAmount) return t("common.notAvailable");
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: project.budgetCurrency || "EUR",
    }).format(Number(project.budgetAmount));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t("common.notAvailable");
    return new Date(dateString).toLocaleDateString("pt-PT", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusLabel = () => {
    const statusKey = `projects.status_${project.status.toLowerCase()}`;
    return t(statusKey);
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/projects"
        className="inline-flex items-center text-sm text-blue-600 hover:underline"
      >
        ← {t("common.back")}
      </Link>

      {/* Header Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Category */}
            <div className="mb-3 flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-base"
                style={{
                  backgroundColor: `${project.category.color}20`,
                  color: project.category.color,
                }}
              >
                {project.category.icon}
              </span>
              <span className="font-medium text-gray-700">{project.category.name}</span>
            </div>

            {/* Title */}
            <h1 className="mb-2 text-3xl font-bold text-gray-900">{project.title}</h1>

            {/* Status */}
            <div className="mb-4">
              <Badge variant={STATUS_COLORS[project.status] || "default"} size="lg">
                {getStatusLabel()}
              </Badge>
              {project.archivedAt && (
                <Badge variant="default" size="lg" className="ml-2">
                  📦 {t("projects.archived")}
                </Badge>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-700 leading-relaxed">{project.description}</p>
          </div>

          {/* Admin Actions */}
          {isAdmin && (
            <div className="ml-6 flex flex-col gap-2">
              {!project.archivedAt && (
                <>
                  <Button onClick={() => setIsEditModalOpen(true)} variant="secondary" size="sm">
                    ✏️ {t("common.edit")}
                  </Button>
                  <Button
                    onClick={() => setIsStatusModalOpen(true)}
                    variant="secondary"
                    size="sm"
                  >
                    🔄 {t("projects.changeStatus")}
                  </Button>
                  <Button
                    onClick={handleArchive}
                    variant="secondary"
                    size="sm"
                    disabled={isArchiving}
                  >
                    📦 {t("projects.archiveProject")}
                  </Button>
                </>
              )}
              {project.archivedAt && (
                <Button
                  onClick={handleUnarchive}
                  variant="secondary"
                  size="sm"
                  disabled={isArchiving}
                >
                  📂 {t("projects.unarchiveProject")}
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Details Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Project Information */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            {t("projects.projectTitle")}
          </h2>
          <div className="space-y-3">
            <InfoRow label={t("projects.budget")} value={formatBudget()} />
            <InfoRow
              label={t("projects.fundingSource")}
              value={project.fundingSource || t("common.notAvailable")}
            />
            <InfoRow
              label={t("projects.biddingReference")}
              value={project.biddingReference || t("common.notAvailable")}
            />
            <InfoRow
              label={t("projects.assignedTo")}
              value={project.assignedToName || t("common.notAvailable")}
            />
          </div>
        </Card>

        {/* Timeline */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{t("projects.timeline")}</h2>
          <div className="space-y-3">
            <InfoRow label={t("projects.createdAt")} value={formatDate(project.createdAt)} />
            <InfoRow label={t("projects.updatedAt")} value={formatDate(project.updatedAt)} />
            <InfoRow
              label={t("projects.workStartedAt")}
              value={formatDate(project.workStartedAt)}
            />
            <InfoRow label={t("projects.completedAt")} value={formatDate(project.completedAt)} />
          </div>
        </Card>
      </div>

      {/* Linked Ticket */}
      {project.ticket && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            {t("projects.linkedTicket")}
          </h2>
          <Link
            href={`/dashboard/tickets/${project.ticket.id}`}
            className="block rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{project.ticket.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{project.ticket.description}</p>
              </div>
              <span className="text-blue-600">→</span>
            </div>
          </Link>
        </Card>
      )}

      {/* Project Updates */}
      {project.updates && project.updates.length > 0 && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{t("projects.updates")}</h2>
          <div className="space-y-4">
            {project.updates.map((update: any) => (
              <div key={update.id} className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-gray-700">{update.message}</p>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                      <span>{update.author.name}</span>
                      <span>•</span>
                      <span>{formatDate(update.createdAt)}</span>
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
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modals */}
      {isEditModalOpen && (
        <EditProjectModal
          project={project}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            setIsEditModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ["project", projectId] });
            queryClient.invalidateQueries({ queryKey: ["projects"] });
          }}
        />
      )}

      {isStatusModalOpen && (
        <ChangeStatusModal
          project={project}
          onClose={() => setIsStatusModalOpen(false)}
          onSuccess={() => {
            setIsStatusModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ["project", projectId] });
            queryClient.invalidateQueries({ queryKey: ["projects"] });
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

