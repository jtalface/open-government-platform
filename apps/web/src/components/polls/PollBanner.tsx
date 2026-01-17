"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, Button, LoadingSpinner } from "@ogp/ui";
import { useTranslation } from "@/lib/i18n/TranslationContext";

interface PollBannerProps {
  municipalityId: string;
}

export function PollBanner({ municipalityId }: PollBannerProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch active poll
  const { data, isLoading, error } = useQuery({
    queryKey: ["activePoll", municipalityId],
    queryFn: async () => {
      const res = await fetch(`/api/municipalities/${municipalityId}/polls/active`);
      if (!res.ok) throw new Error("Failed to fetch poll");
      const result = await res.json();
      return result.data;
    },
    enabled: !!session && !!municipalityId,
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ pollId, choice }: { pollId: string; choice: "A" | "B" }) => {
      const res = await fetch(`/api/polls/${pollId}/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choice }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || "Failed to vote");
      }

      return res.json();
    },
    onSuccess: () => {
      // Refetch the poll to get updated vote status
      queryClient.invalidateQueries({ queryKey: ["activePoll", municipalityId] });
    },
  });

  const handleVote = async (choice: "A" | "B") => {
    if (!data?.poll || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await voteMutation.mutateAsync({ pollId: data.poll.id, choice });
    } catch (error: any) {
      alert(error.message || t("polls.errorVoting"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't show anything if loading or no session
  if (isLoading || !session) {
    return null;
  }

  // Don't show if there's no active poll
  if (!data || !data.poll) {
    return null;
  }

  const { poll, userVote } = data;
  const hasVoted = !!userVote;

  return (
    <Card className="mb-6 border-2 border-blue-500 bg-blue-50 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <h3 className="text-lg font-semibold text-gray-900">{t("polls.activePoll")}</h3>
          </div>

          <p className="mb-4 text-gray-800">{poll.title}</p>

          {!hasVoted ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={() => handleVote("A")}
                disabled={isSubmitting}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? <LoadingSpinner size="sm" /> : `✓ ${poll.optionA}`}
              </Button>
              <Button
                onClick={() => handleVote("B")}
                disabled={isSubmitting}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {isSubmitting ? <LoadingSpinner size="sm" /> : `✗ ${poll.optionB}`}
              </Button>
            </div>
          ) : (
            <div className="rounded-lg bg-white p-4">
              <p className="mb-2 font-medium text-green-700">
                ✓ {t("polls.thanksForVoting")}
              </p>
              <p className="text-sm text-gray-600">
                {t("polls.yourChoice")}: <strong>{userVote.choice === "A" ? poll.optionA : poll.optionB}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Optional: Close/dismiss button */}
        {/* <button
          onClick={() => {}}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Dismiss"
        >
          ✕
        </button> */}
      </div>

      {!session && (
        <div className="mt-4 rounded-lg bg-yellow-50 p-3 text-center">
          <p className="text-sm text-yellow-800">
            {t("polls.signInToVote")}{" "}
            <Link href="/auth/signin" className="font-medium underline">
              {t("nav.signIn")}
            </Link>
          </p>
        </div>
      )}
    </Card>
  );
}

