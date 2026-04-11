"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, Badge, LoadingSpinner, Button } from "@ogp/ui";
import { useTranslation } from "@/lib/i18n/TranslationContext";
import { EditProjectModal } from "./EditProjectModal";
import { ChangeStatusModal } from "./ChangeStatusModal";
import { AddProjectUpdateModal } from "./AddProjectUpdateModal";
import { EditProjectUpdateModal, type ProjectUpdateEditShape } from "./EditProjectUpdateModal";
import { parseStoredImageUrls } from "@/lib/projects/media";

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
  const [isAddUpdateModalOpen, setIsAddUpdateModalOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<ProjectUpdateEditShape | null>(null);
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

  const isManager =
    session?.user?.role === "MANAGER" || session?.user?.role === "ADMIN";

  const handleDeleteUpdate = async (updateId: string) => {
    if (!confirm(t("projects.confirmDeleteUpdate"))) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/updates/${updateId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg =
          (typeof err.error === "object" && err.error?.message) ||
          (typeof err.error === "string" && err.error) ||
          err.message;
        throw new Error(msg || "Failed");
      }
      await queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : t("projects.errorDeletingUpdate"));
    }
  };

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

  const mainImages = parseStoredImageUrls(project.descriptionMedia);
  const updates = project.updates ?? [];
  const showUpdatesSection = isManager || updates.length > 0;

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
      <Link
        href="/projects"
        className="inline-flex items-center text-sm text-blue-600 hover:underline"
      >
        ← {t("common.back")}
      </Link>

      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1 pr-4">
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

            <h1 className="mb-2 text-3xl font-bold text-gray-900">{project.title}</h1>

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

            <p className="text-gray-700 leading-relaxed">{project.description}</p>

            {mainImages.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {mainImages.map((url, idx) => (
                  <a
                    key={`main-${idx}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block h-40 w-40 overflow-hidden rounded-lg border border-gray-200 shadow-sm"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover hover:opacity-95" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {isManager && (
            <div className="flex shrink-0 flex-col gap-2">
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
                    onClick={() => setIsAddUpdateModalOpen(true)}
                    variant="secondary"
                    size="sm"
                  >
                    ➕ {t("projects.addUpdate")}
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{t("projects.projectTitle")}</h2>
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

      {project.ticket &&
        ((isManager && (
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">{t("projects.linkedTicket")}</h2>
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
        )) ||
          (!isManager &&
            project.ticket.incidentId && (
              <Card className="p-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  {t("projects.linkedIncident")}
                </h2>
                <Link
                  href={`/incidents/${project.ticket.incidentId}`}
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
            )))}

      {showUpdatesSection && (
        <Card className="p-6 md:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{t("projects.updatesSectionTitle")}</h2>
            {isManager && !project.archivedAt && (
              <Button onClick={() => setIsAddUpdateModalOpen(true)} variant="secondary" size="sm">
                ➕ {t("projects.addUpdate")}
              </Button>
            )}
          </div>

          {updates.length === 0 && (
            <p className="text-gray-600">{t("projects.noUpdatesYet")}</p>
          )}

          {updates.length > 0 && (
            <div className="space-y-8">
              {updates.map((update: { id: string; message: string; attachments: unknown; author: { name: string }; createdAt: string; visibility: string }) => {
                const attUrls = parseStoredImageUrls(update.attachments);
                return (
                  <article key={update.id} className="border-b border-gray-100 pb-8 last:border-0 last:pb-0">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="whitespace-pre-wrap text-gray-800">{update.message}</p>
                        {attUrls.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-3">
                            {attUrls.map((url, idx) => (
                              <a
                                key={`${update.id}-${idx}`}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block h-36 w-36 overflow-hidden rounded-lg border border-gray-200"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt="" className="h-full w-full object-cover" />
                              </a>
                            ))}
                          </div>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-500">
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
                      {isManager && !project.archivedAt && (
                        <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              setEditingUpdate({
                                id: update.id,
                                message: update.message,
                                visibility: update.visibility,
                                attachments: update.attachments,
                              })
                            }
                          >
                            ✏️ {t("common.edit")}
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => void handleDeleteUpdate(update.id)}
                          >
                            🗑 {t("common.delete")}
                          </Button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </Card>
      )}

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

      {isAddUpdateModalOpen && (
        <AddProjectUpdateModal
          projectId={projectId}
          onClose={() => setIsAddUpdateModalOpen(false)}
          onSuccess={() => {
            setIsAddUpdateModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ["project", projectId] });
            queryClient.invalidateQueries({ queryKey: ["projects"] });
          }}
        />
      )}

      {editingUpdate && (
        <EditProjectUpdateModal
          projectId={projectId}
          update={editingUpdate}
          onClose={() => setEditingUpdate(null)}
          onSuccess={() => {
            setEditingUpdate(null);
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
