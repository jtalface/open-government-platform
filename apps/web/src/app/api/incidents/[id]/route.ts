import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireAuth } from "@/lib/auth/rbac";
import { successResponse, handleApiError, errorResponse } from "@/lib/api/error-handler";
import { prisma } from "@ogp/database";
import { UpdateIncidentSchema, UserRole } from "@ogp/types";

/**
 * GET /api/incidents/[id]
 * Get incident details (soft-deleted only visible to admins)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    const allowDeleted = session!.user.role === UserRole.ADMIN;

    const incident = await prisma.incidentEvent.findFirst({
      where: {
        id: params.id,
        municipalityId: session!.user.municipalityId,
        ...(!allowDeleted ? { deletedAt: null } : {}),
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
      return errorResponse("NOT_FOUND", "Incident not found", 404);
    }

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
 * Update incident (creator or admin; only admin can edit soft-deleted)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    const isAdmin = session!.user.role === UserRole.ADMIN;

    const incident = await prisma.incidentEvent.findFirst({
      where: {
        id: params.id,
        municipalityId: session!.user.municipalityId,
      },
      select: {
        createdByUserId: true,
        deletedAt: true,
      },
    });

    if (!incident) {
      return errorResponse("NOT_FOUND", "Incident not found", 404);
    }

    if (incident.deletedAt) {
      if (!isAdmin) {
        return errorResponse("NOT_FOUND", "Incident not found", 404);
      }
    } else if (incident.createdByUserId !== session!.user.id && !isAdmin) {
      return errorResponse(
        "FORBIDDEN",
        "Apenas o criador da ocorrência pode editá-la",
        403
      );
    }

    const body = await request.json();
    const input = UpdateIncidentSchema.parse(body);

    const updatedIncident = await prisma.incidentEvent.update({
      where: {
        id: params.id,
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

/**
 * DELETE /api/incidents/[id]
 * Soft-delete incident (admin only)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    if (session!.user.role !== UserRole.ADMIN) {
      return errorResponse(
        "FORBIDDEN",
        "Apenas administradores podem eliminar ocorrências",
        403
      );
    }

    const incident = await prisma.incidentEvent.findFirst({
      where: {
        id: params.id,
        municipalityId: session!.user.municipalityId,
      },
      select: { id: true, deletedAt: true },
    });

    if (!incident) {
      return errorResponse("NOT_FOUND", "Incident not found", 404);
    }

    if (incident.deletedAt) {
      return successResponse({ success: true, alreadyDeleted: true });
    }

    await prisma.incidentEvent.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return successResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
