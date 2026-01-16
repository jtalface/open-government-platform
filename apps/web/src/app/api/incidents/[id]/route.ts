import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireAuth } from "@/lib/auth/rbac";
import { successResponse, handleApiError } from "@/lib/api/error-handler";
import { prisma } from "@ogp/database";

/**
 * GET /api/incidents/[id]
 * Get incident details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    const incident = await prisma.incidentEvent.findUnique({
      where: {
        id: params.id,
        municipalityId: session!.user.municipalityId,
      },
      include: {
        category: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        neighborhood: true,
        ticket: {
          include: {
            updates: {
              where: {
                visibility: "PUBLIC",
              },
              orderBy: {
                createdAt: "desc",
              },
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
        votes: {
          where: {
            userId: session!.user.id,
          },
          select: {
            value: true,
          },
        },
      },
    });

    if (!incident) {
      return handleApiError(new Error("Incident not found"));
    }

    // Add user's vote to response
    const userVote = incident.votes.length > 0 ? incident.votes[0].value : null;
    const response = {
      ...incident,
      userVote,
      votes: undefined,
    };

    return successResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
}

