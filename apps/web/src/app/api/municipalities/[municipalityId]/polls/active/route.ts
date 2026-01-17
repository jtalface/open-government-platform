import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { successResponse, handleApiError } from "@/lib/api/error-handler";
import { getActivePoll, getUserPollVote } from "@/lib/services/poll-service";

/**
 * GET /api/municipalities/:municipalityId/polls/active
 * Get the currently active poll for a municipality
 * Returns the poll and the user's vote (if any)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { municipalityId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return handleApiError(new Error("Authentication required"));
    }

    // Verify user is in the requested municipality
    if (session.user.municipalityId !== params.municipalityId) {
      return handleApiError(new Error("You can only view polls in your municipality"));
    }

    const poll = await getActivePoll(params.municipalityId);

    if (!poll) {
      return successResponse(null);
    }

    // Get user's vote if they've voted
    const userVote = await getUserPollVote(poll.id, session.user.id);

    return successResponse({
      poll,
      userVote: userVote ? { choice: userVote.choice } : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

