import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireManager } from "@/lib/auth/rbac";
import { successResponse, handleApiError } from "@/lib/api/error-handler";
import { getPollById, getPollResults, canViewPollResults } from "@/lib/services/poll-service";

/**
 * GET /api/polls/:pollId/results
 * Get poll results (manager/admin only, with RBAC)
 * Only poll creator or admin can view results
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { pollId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    requireManager(session);

    const poll = await getPollById(params.pollId);

    if (!poll) {
      return handleApiError(new Error("Poll not found"));
    }

    // Check RBAC: only creator or admin can view results
    if (!canViewPollResults(session!.user, poll)) {
      return handleApiError(new Error("Unauthorized: You can only view results for your own polls"));
    }

    const results = await getPollResults(params.pollId);

    return successResponse(results);
  } catch (error) {
    return handleApiError(error);
  }
}

