"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Button, Input, LoadingSpinner } from "@ogp/ui";
import { formatDistanceToNow } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useTranslation } from "@/lib/i18n/TranslationContext";

interface IncidentCommentsProps {
  incidentId: string;
  /** When false, existing comments still load but the compose form is hidden (e.g. soft-deleted incident). */
  allowNewComments?: boolean;
}

export function IncidentComments({
  incidentId,
  allowNewComments = true,
}: IncidentCommentsProps) {
  const { t, locale } = useTranslation();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const dateFnsLocale = locale === "pt" ? ptBR : enUS;

  const { data: comments, isLoading } = useQuery({
    queryKey: ["incident-comments", incidentId],
    queryFn: async () => {
      const res = await fetch(`/api/incidents/${incidentId}/comments`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      const data = await res.json();
      return data.data;
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch(`/api/incidents/${incidentId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || "Failed to create comment");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident-comments", incidentId] });
      setCommentText("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    createCommentMutation.mutate(commentText.trim());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">
        {t("incidents.comments")} ({comments?.length || 0})
      </h2>

      {/* Comment Form */}
      {session && allowNewComments && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={t("incidents.addCommentPlaceholder")}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={createCommentMutation.isPending}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={!commentText.trim() || createCommentMutation.isPending}
              isLoading={createCommentMutation.isPending}
            >
              {t("incidents.postComment")}
            </Button>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments && comments.length > 0 ? (
          comments.map((comment: any) => (
            <div key={comment.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {comment.author.image ? (
                    <img
                      src={comment.author.image}
                      alt={comment.author.name}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                      {comment.author.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-900">{comment.author.name}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                    locale: dateFnsLocale,
                  })}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-gray-700">{comment.message}</p>
            </div>
          ))
        ) : (
          <p className="py-8 text-center text-sm text-gray-500">
            {t("incidents.noComments")}
          </p>
        )}
      </div>
    </div>
  );
}
