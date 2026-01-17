"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, Badge, Button, LoadingSpinner } from "@ogp/ui";
import { useTranslation } from "@/lib/i18n/TranslationContext";
import { CreatePollModal } from "./CreatePollModal";

interface PollsListProps {
  municipalityId: string;
}

export function PollsList({ municipalityId }: PollsListProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch polls
  const { data: polls, isLoading } = useQuery({
    queryKey: ["polls", municipalityId, statusFilter],
    queryFn: async () => {
      const url = new URL(`/api/municipalities/${municipalityId}/polls`, window.location.origin);
      if (statusFilter !== "all") {
        url.searchParams.set("status", statusFilter);
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch polls");
      const result = await res.json();
      return result.data;
    },
    enabled: !!municipalityId,
  });

  // Activate poll mutation
  const activateMutation = useMutation({
    mutationFn: async (pollId: string) => {
      const res = await fetch(`/api/polls/${pollId}/activate`, {
        method: "POST",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || "Failed to activate poll");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["polls", municipalityId] });
      alert(t("polls.pollActivated"));
    },
  });

  // Close poll mutation
  const closeMutation = useMutation({
    mutationFn: async (pollId: string) => {
      const res = await fetch(`/api/polls/${pollId}/close`, {
        method: "POST",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || "Failed to close poll");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["polls", municipalityId] });
      alert(t("polls.pollClosed"));
    },
  });

  const getStatusBadgeVariant = (status: string): "info" | "success" | "warning" | "default" => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "DRAFT":
        return "warning";
      case "CLOSED":
        return "info";
      case "ARCHIVED":
        return "default";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t("common.notSet");
    return new Date(dateString).toLocaleString("pt-PT", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              statusFilter === "all" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
            }`}
          >
            {t("common.all")}
          </button>
          <button
            onClick={() => setStatusFilter("ACTIVE")}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              statusFilter === "ACTIVE" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
            }`}
          >
            {t("polls.statusActive")}
          </button>
          <button
            onClick={() => setStatusFilter("DRAFT")}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              statusFilter === "DRAFT" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
            }`}
          >
            {t("polls.statusDraft")}
          </button>
          <button
            onClick={() => setStatusFilter("CLOSED")}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              statusFilter === "CLOSED" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
            }`}
          >
            {t("polls.statusClosed")}
          </button>
        </div>

        <Button onClick={() => setIsCreateModalOpen(true)}>
          ➕ {t("polls.createPoll")}
        </Button>
      </div>

      {/* Polls List */}
      {!polls || polls.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mb-4 text-6xl">📊</div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">{t("polls.noPolls")}</h3>
          <p className="mb-6 text-gray-600">{t("polls.noPollsDescription")}</p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            {t("polls.createFirstPoll")}
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {polls.map((poll: any) => (
            <Card key={poll.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(poll.status)}>
                      {t(`polls.status${poll.status.charAt(0)}${poll.status.slice(1).toLowerCase()}`)}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {poll._count.votes} {t("polls.votes")}
                    </span>
                  </div>

                  <h3 className="mb-2 text-lg font-semibold text-gray-900">{poll.title}</h3>

                  <div className="mb-3 flex gap-4 text-sm text-gray-600">
                    <div>
                      <strong>{t("polls.optionA")}:</strong> {poll.optionA}
                    </div>
                    <div>
                      <strong>{t("polls.optionB")}:</strong> {poll.optionB}
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    {t("polls.createdBy")}: {poll.createdBy.name} • {t("polls.createdAt")}: {formatDate(poll.createdAt)}
                  </div>
                </div>

                {/* Actions */}
                <div className="ml-4 flex flex-col gap-2">
                  <Link
                    href={`/dashboard/polls/${poll.id}`}
                    className="rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200"
                  >
                    {t("polls.viewResults")}
                  </Link>

                  {poll.status === "DRAFT" && (
                    <Button
                      onClick={() => activateMutation.mutate(poll.id)}
                      disabled={activateMutation.isPending}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {t("polls.activate")}
                    </Button>
                  )}

                  {poll.status === "ACTIVE" && (
                    <Button
                      onClick={() => {
                        if (confirm(t("polls.confirmClose"))) {
                          closeMutation.mutate(poll.id);
                        }
                      }}
                      disabled={closeMutation.isPending}
                      size="sm"
                      variant="secondary"
                    >
                      {t("polls.close")}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Poll Modal */}
      {isCreateModalOpen && (
        <CreatePollModal
          municipalityId={municipalityId}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ["polls", municipalityId] });
          }}
        />
      )}
    </div>
  );
}

