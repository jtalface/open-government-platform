import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireManager } from "@/lib/auth/rbac";
import { successResponse, handleApiError } from "@/lib/api/error-handler";
import { activatePoll } from "@/lib/services/poll-service";

/**
 * POST /api/polls/:pollId/activate
 * Activate a poll (change from DRAFT to ACTIVE)
 * Automatically closes any existing active poll
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { pollId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    requireManager(session);

    const activatedPoll = await activatePoll(session!.user, params.pollId);

    return successResponse(activatedPoll);
  } catch (error) {
    return handleApiError(error);
  }
}

