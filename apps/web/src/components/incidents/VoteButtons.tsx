"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface VoteButtonsProps {
  incidentId: string;
  initialVote: number | null;
  upvotes: number;
  downvotes: number;
}

export function VoteButtons({ incidentId, initialVote, upvotes, downvotes }: VoteButtonsProps) {
  const [currentVote, setCurrentVote] = useState<number | null>(initialVote);
  const queryClient = useQueryClient();

  const voteMutation = useMutation({
    mutationFn: async (value: 1 | -1) => {
      const res = await fetch(`/api/incidents/${incidentId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error("Failed to vote");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident", incidentId] });
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
    },
  });

  const removeVoteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/incidents/${incidentId}/vote`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove vote");
      return res.json();
    },
    onSuccess: () => {
      setCurrentVote(null);
      queryClient.invalidateQueries({ queryKey: ["incident", incidentId] });
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
    },
  });

  const handleVote = (value: 1 | -1) => {
    if (currentVote === value) {
      // Remove vote
      removeVoteMutation.mutate();
    } else {
      // Cast or change vote
      setCurrentVote(value);
      voteMutation.mutate(value);
    }
  };

  const isLoading = voteMutation.isPending || removeVoteMutation.isPending;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleVote(1)}
        disabled={isLoading}
        className={`flex items-center gap-1 rounded-lg px-4 py-2 font-medium transition-all ${
          currentVote === 1
            ? "bg-green-600 text-white"
            : "bg-white text-gray-700 hover:bg-gray-100"
        } ${isLoading ? "opacity-50" : ""}`}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 15l7-7 7 7"
          />
        </svg>
        <span>{upvotes}</span>
      </button>

      <button
        onClick={() => handleVote(-1)}
        disabled={isLoading}
        className={`flex items-center gap-1 rounded-lg px-4 py-2 font-medium transition-all ${
          currentVote === -1
            ? "bg-red-600 text-white"
            : "bg-white text-gray-700 hover:bg-gray-100"
        } ${isLoading ? "opacity-50" : ""}`}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
        <span>{downvotes}</span>
      </button>
    </div>
  );
}

