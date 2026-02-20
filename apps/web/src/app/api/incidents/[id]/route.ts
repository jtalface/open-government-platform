import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireAuth } from "@/lib/auth/rbac";
import { successResponse, handleApiError } from "@/lib/api/error-handler";
import { prisma } from "@ogp/database";
import { UpdateIncidentSchema } from "@ogp/types";

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

/**
 * PATCH /api/incidents/[id]
 * Update incident (only by creator)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    // Get the incident first to check ownership
    const incident = await prisma.incidentEvent.findUnique({
      where: {
        id: params.id,
        municipalityId: session!.user.municipalityId,
      },
      select: {
        createdByUserId: true,
      },
    });

    if (!incident) {
      return handleApiError(new Error("Incident not found"));
    }

    // Check if user is the creator
    if (incident.createdByUserId !== session!.user.id) {
      return handleApiError(
        new Error("Apenas o criador da ocorrência pode editá-la"),
        403
      );
    }

    // Validate input
    const body = await request.json();
    const input = UpdateIncidentSchema.parse(body);

    // Update incident (only allowed fields: title, description, categoryId, media)
    const updatedIncident = await prisma.incidentEvent.update({
      where: {
        id: params.id,
        municipalityId: session!.user.municipalityId,
      },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.description && { description: input.description }),
        ...(input.categoryId && { categoryId: input.categoryId }),
        ...(input.media !== undefined && { media: input.media as any }),
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
      },
    });

    return successResponse(updatedIncident);
  } catch (error) {
    return handleApiError(error);
  }
}
