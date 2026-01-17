import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireManager } from "@/lib/auth/rbac";
import { successResponse, handleApiError } from "@/lib/api/error-handler";
import { closePoll } from "@/lib/services/poll-service";

/**
 * POST /api/polls/:pollId/close
 * Close a poll (manager/admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { pollId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    requireManager(session);

    const closedPoll = await closePoll(session!.user, params.pollId);

    return successResponse(closedPoll);
  } catch (error) {
    return handleApiError(error);
  }
}

