"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, Badge, LoadingSpinner } from "@ogp/ui";
import { useTranslation } from "@/lib/i18n/TranslationContext";

interface PollResultsProps {
  pollId: string;
}

export function PollResults({ pollId }: PollResultsProps) {
  const { t } = useTranslation();

  // Fetch poll details
  const { data: poll, isLoading: isPollLoading } = useQuery({
    queryKey: ["poll", pollId],
    queryFn: async () => {
      const res = await fetch(`/api/polls/${pollId}`);
      if (!res.ok) throw new Error("Failed to fetch poll");
      const result = await res.json();
      return result.data;
    },
  });

  // Fetch poll results
  const { data: results, isLoading: isResultsLoading } = useQuery({
    queryKey: ["pollResults", pollId],
    queryFn: async () => {
      const res = await fetch(`/api/polls/${pollId}/results`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || "Failed to fetch results");
      }
      const result = await res.json();
      return result.data;
    },
  });

  const isLoading = isPollLoading || isResultsLoading;

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">{t("common.loading")}</p>
      </div>
    );
  }

  if (!poll || !results) {
    return (
      <Card className="p-6 text-center">
        <p className="text-red-600">{t("polls.errorLoadingResults")}</p>
        <Link href="/dashboard/polls" className="mt-4 inline-block text-blue-600 hover:underline">
          ← {t("common.back")}
        </Link>
      </Card>
    );
  }

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

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/dashboard/polls"
        className="inline-flex items-center text-sm text-blue-600 hover:underline"
      >
        ← {t("common.back")}
      </Link>

      {/* Poll Header */}
      <Card className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <Badge variant={getStatusBadgeVariant(poll.status)}>
              {t(`polls.status${poll.status.charAt(0)}${poll.status.slice(1).toLowerCase()}`)}
            </Badge>
          </div>
          <div className="text-right text-sm text-gray-500">
            <div>{t("polls.createdBy")}: {poll.createdBy.name}</div>
            <div>{t("polls.createdAt")}: {new Date(poll.createdAt).toLocaleString("pt-PT")}</div>
          </div>
        </div>

        <h1 className="mb-4 text-2xl font-bold text-gray-900">{poll.title}</h1>

        {poll.closedAt && (
          <div className="text-sm text-gray-600">
            {t("polls.closedAt")}: {new Date(poll.closedAt).toLocaleString("pt-PT")} by {poll.closedBy?.name}
          </div>
        )}
      </Card>

      {/* Results */}
      <Card className="p-6">
        <h2 className="mb-6 text-xl font-semibold text-gray-900">{t("polls.results")}</h2>

        <div className="mb-8 text-center">
          <div className="mb-2 text-4xl font-bold text-gray-900">{results.totalVotes}</div>
          <div className="text-sm text-gray-600">{t("polls.totalVotes")}</div>
        </div>

        <div className="space-y-6">
          {/* Option A */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium text-gray-900">{results.optionA.label}</span>
              <span className="text-sm font-semibold text-gray-700">
                {results.optionA.count} {t("polls.votes")} ({results.optionA.percent}%)
              </span>
            </div>
            <div className="h-8 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${results.optionA.percent}%` }}
              />
            </div>
          </div>

          {/* Option B */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium text-gray-900">{results.optionB.label}</span>
              <span className="text-sm font-semibold text-gray-700">
                {results.optionB.count} {t("polls.votes")} ({results.optionB.percent}%)
              </span>
            </div>
            <div className="h-8 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-red-500 transition-all duration-500"
                style={{ width: `${results.optionB.percent}%` }}
              />
            </div>
          </div>
        </div>

        {results.totalVotes === 0 && (
          <div className="mt-8 rounded-lg bg-yellow-50 p-4 text-center">
            <p className="text-sm text-yellow-800">{t("polls.noVotesYet")}</p>
          </div>
        )}
      </Card>
    </div>
  );
}

