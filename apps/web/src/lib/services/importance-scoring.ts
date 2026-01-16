import { VoteStats } from "@ogp/types";

/**
 * Importance scoring algorithm
 *
 * Calculates a score for incidents based on:
 * 1. Neighborhood-weighted votes (votes from same neighborhood count more)
 * 2. Global votes (all votes)
 * 3. Time decay (older incidents score lower)
 *
 * Formula:
 * score = (neighborhoodScore * neighborhoodWeight) + (globalScore * globalWeight) * timeDecayFactor
 */

export interface ScoreWeights {
  neighborhoodVoteWeight: number;
  globalVoteWeight: number;
  recencyDecayDays: number;
}

export const DEFAULT_WEIGHTS: ScoreWeights = {
  neighborhoodVoteWeight: 2.0,
  globalVoteWeight: 1.0,
  recencyDecayDays: 30,
};

/**
 * Calculate importance score for an incident
 */
export function calculateImportanceScore(
  voteStats: VoteStats,
  neighborhoodId: string | null,
  createdAt: Date,
  weights: ScoreWeights = DEFAULT_WEIGHTS
): number {
  // Calculate neighborhood score
  let neighborhoodScore = 0;
  if (neighborhoodId && voteStats.byNeighborhood[neighborhoodId]) {
    const nbVotes = voteStats.byNeighborhood[neighborhoodId];
    neighborhoodScore = nbVotes.upvotes - nbVotes.downvotes;
  }

  // Calculate global score
  const globalScore = voteStats.upvotes - voteStats.downvotes;

  // Calculate time decay factor
  const ageInDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const decayFactor = Math.exp(-ageInDays / weights.recencyDecayDays);

  // Weighted score with time decay
  const score =
    (neighborhoodScore * weights.neighborhoodVoteWeight +
      globalScore * weights.globalVoteWeight) *
    decayFactor;

  return Math.max(0, score); // Ensure non-negative
}

/**
 * Update vote statistics after a vote change
 */
export function updateVoteStats(
  currentStats: VoteStats,
  neighborhoodId: string | null,
  voteChange: 1 | -1 | 0 // 1 = upvote, -1 = downvote, 0 = remove vote
): VoteStats {
  const newStats = { ...currentStats };

  // Initialize neighborhood stats if needed
  if (neighborhoodId && !newStats.byNeighborhood[neighborhoodId]) {
    newStats.byNeighborhood[neighborhoodId] = { upvotes: 0, downvotes: 0 };
  }

  // Update based on vote change
  if (voteChange === 1) {
    newStats.upvotes++;
    newStats.total++;
    if (neighborhoodId) {
      newStats.byNeighborhood[neighborhoodId].upvotes++;
    }
  } else if (voteChange === -1) {
    newStats.downvotes++;
    newStats.total++;
    if (neighborhoodId) {
      newStats.byNeighborhood[neighborhoodId].downvotes++;
    }
  } else if (voteChange === 0) {
    // Remove vote - need to know what the previous vote was
    // This is simplified; in practice, you'd query the old vote value
    newStats.total--;
  }

  return newStats;
}

/**
 * Recalculate vote statistics from scratch (for periodic recalculation)
 */
export interface VoteData {
  value: number;
  neighborhoodId: string | null;
}

export function recalculateVoteStats(votes: VoteData[]): VoteStats {
  const stats: VoteStats = {
    total: votes.length,
    upvotes: 0,
    downvotes: 0,
    byNeighborhood: {},
  };

  for (const vote of votes) {
    if (vote.value > 0) {
      stats.upvotes++;
      if (vote.neighborhoodId) {
        if (!stats.byNeighborhood[vote.neighborhoodId]) {
          stats.byNeighborhood[vote.neighborhoodId] = { upvotes: 0, downvotes: 0 };
        }
        stats.byNeighborhood[vote.neighborhoodId].upvotes++;
      }
    } else if (vote.value < 0) {
      stats.downvotes++;
      if (vote.neighborhoodId) {
        if (!stats.byNeighborhood[vote.neighborhoodId]) {
          stats.byNeighborhood[vote.neighborhoodId] = { upvotes: 0, downvotes: 0 };
        }
        stats.byNeighborhood[vote.neighborhoodId].downvotes++;
      }
    }
  }

  return stats;
}

