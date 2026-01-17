import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { successResponse, handleApiError } from "@/lib/api/error-handler";
import { castVote } from "@/lib/services/poll-service";
import { PollChoice } from "@ogp/database";

/**
 * POST /api/polls/:pollId/votes
 * Cast a vote on a poll
 * Body: { choice: "A" | "B" }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { pollId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return handleApiError(new Error("Authentication required to vote"));
    }

    const body = await request.json();
    const { choice } = body;

    // Validate choice
    if (!choice || (choice !== "A" && choice !== "B")) {
      return handleApiError(new Error("Invalid choice. Must be 'A' or 'B'"));
    }

    const vote = await castVote(session.user, params.pollId, choice as PollChoice);

    return successResponse(vote);
  } catch (error) {
    return handleApiError(error);
  }
}

