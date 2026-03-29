import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireAuth } from "@/lib/auth/rbac";
import { successResponse, handleApiError, errorResponse } from "@/lib/api/error-handler";
import { prisma } from "@ogp/database";
import { UserRole } from "@ogp/types";
import { z } from "zod";

const CreateCommentSchema = z.object({
  message: z.string().min(1).max(2000),
});

/**
 * GET /api/incidents/:id/comments
 * Get all comments for an incident
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
    });

    if (!incident) {
      return errorResponse("NOT_FOUND", "Incident not found", 404);
    }

    const comments = await prisma.incidentComment.findMany({
      where: {
        incidentId: params.id,
        municipalityId: session!.user.municipalityId,
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
      orderBy: {
        createdAt: "asc",
      },
    });

    return successResponse(comments);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/incidents/:id/comments
 * Add a comment to an incident
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    const incident = await prisma.incidentEvent.findFirst({
      where: {
        id: params.id,
        municipalityId: session!.user.municipalityId,
        deletedAt: null,
      },
    });

    if (!incident) {
      return errorResponse("NOT_FOUND", "Incident not found", 404);
    }

    const body = await request.json();
    const { message } = CreateCommentSchema.parse(body);

    const comment = await prisma.incidentComment.create({
      data: {
        incidentId: params.id,
        authorUserId: session!.user.id,
        municipalityId: session!.user.municipalityId,
        message,
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
    });

    return successResponse(comment, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
