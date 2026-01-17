import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireManager } from "@/lib/auth/rbac";
import { successResponse, handleApiError } from "@/lib/api/error-handler";
import { getPollById, updatePoll } from "@/lib/services/poll-service";

/**
 * GET /api/polls/:pollId
 * Get poll details (manager/admin only)
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

    // Verify user is in the same municipality
    if (session!.user.municipalityId !== poll.municipalityId) {
      return handleApiError(new Error("Unauthorized"));
    }

    return successResponse(poll);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/polls/:pollId
 * Update poll (manager/admin only, DRAFT polls or admin override)
 * Body: { title?, optionA?, optionB?, startsAt?, endsAt? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { pollId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    requireManager(session);

    const body = await request.json();
    const { title, optionA, optionB, startsAt, endsAt } = body;

    const updatedPoll = await updatePoll(session!.user, params.pollId, {
      title,
      optionA,
      optionB,
      startsAt: startsAt && startsAt !== "" ? new Date(startsAt) : undefined,
      endsAt: endsAt && endsAt !== "" ? new Date(endsAt) : undefined,
    });

    return successResponse(updatedPoll);
  } catch (error) {
    return handleApiError(error);
  }
}

