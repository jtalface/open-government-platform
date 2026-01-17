import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireManager } from "@/lib/auth/rbac";
import { successResponse, handleApiError } from "@/lib/api/error-handler";
import { createPoll, getPolls } from "@/lib/services/poll-service";
import { PollStatus } from "@ogp/database";

/**
 * GET /api/municipalities/:municipalityId/polls
 * Get all polls for a municipality (manager/admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { municipalityId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    requireManager(session);

    // Verify user is in the requested municipality
    if (session!.user.municipalityId !== params.municipalityId) {
      return handleApiError(new Error("You can only view polls in your municipality"));
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as PollStatus | null;
    const createdByUserId = searchParams.get("createdByUserId") || undefined;

    const polls = await getPolls(params.municipalityId, {
      status: status || undefined,
      createdByUserId,
    });

    return successResponse(polls);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/municipalities/:municipalityId/polls
 * Create a new poll (manager/admin only)
 * Body: { title, optionA, optionB, status?, startsAt?, endsAt? }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { municipalityId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    requireManager(session);

    // Verify user is in the requested municipality
    if (session!.user.municipalityId !== params.municipalityId) {
      return handleApiError(new Error("You can only create polls in your municipality"));
    }

    const body = await request.json();
    const { title, optionA, optionB, status, startsAt, endsAt } = body;

    // Validation
    if (!title || !optionA || !optionB) {
      return handleApiError(new Error("Missing required fields: title, optionA, optionB"));
    }

    if (title.length < 10) {
      return handleApiError(new Error("Title must be at least 10 characters long"));
    }

    if (optionA.length < 2 || optionB.length < 2) {
      return handleApiError(new Error("Options must be at least 2 characters long"));
    }

    const poll = await createPoll(session!.user, {
      title,
      optionA,
      optionB,
      status: status as PollStatus | undefined,
      startsAt: startsAt && startsAt !== "" ? new Date(startsAt) : undefined,
      endsAt: endsAt && endsAt !== "" ? new Date(endsAt) : undefined,
    });

    return successResponse(poll);
  } catch (error) {
    return handleApiError(error);
  }
}

