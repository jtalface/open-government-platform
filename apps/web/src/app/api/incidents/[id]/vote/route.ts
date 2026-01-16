import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireAuth } from "@/lib/auth/rbac";
import { VoteIncidentSchema } from "@ogp/types";
import { voteOnIncident, removeVote } from "@/lib/services/incident-service";
import { successResponse, handleApiError, errorResponse } from "@/lib/api/error-handler";
import { prisma } from "@ogp/database";
import { isSameNeighborhood } from "@/lib/auth/rbac";

/**
 * POST /api/incidents/[id]/vote
 * Vote on an incident (neighborhood-scoped)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    // Get incident to check neighborhood
    const incident = await prisma.incidentEvent.findUnique({
      where: { id: params.id },
      select: { neighborhoodId: true, municipalityId: true },
    });

    if (!incident) {
      return errorResponse("NOT_FOUND", "Incident not found", 404);
    }

    if (incident.municipalityId !== session!.user.municipalityId) {
      return errorResponse("FORBIDDEN", "Cannot vote on incidents from other municipalities", 403);
    }

    // Check neighborhood constraint
    // TODO: In production, implement strict neighborhood verification
    // For now, allow voting but weight by neighborhood in scoring
    const userNeighborhoodId = session!.user.neighborhoodId;

    const body = await request.json();
    const { value } = VoteIncidentSchema.parse(body);

    await voteOnIncident(session!.user.id, params.id, value, userNeighborhoodId || null);

    return successResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/incidents/[id]/vote
 * Remove vote from incident
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    await removeVote(session!.user.id, params.id);

    return successResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

