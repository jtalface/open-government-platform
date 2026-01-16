import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireManager } from "@/lib/auth/rbac";
import { UpdateTicketSchema } from "@ogp/types";
import { updateTicket } from "@/lib/services/ticket-service";
import { successResponse, handleApiError } from "@/lib/api/error-handler";
import { prisma } from "@ogp/database";

/**
 * GET /api/tickets/:id
 * Get ticket details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    requireManager(session);

    const ticket = await prisma.ticket.findUnique({
      where: {
        id: params.id,
        municipalityId: session!.user.municipalityId,
      },
      include: {
        category: true,
        incident: {
          include: {
            category: true,
            neighborhood: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        updates: {
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
    });

    if (!ticket) {
      return handleApiError(new Error("Ticket not found"));
    }

    return successResponse(ticket);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/tickets/:id
 * Update ticket
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    requireManager(session);

    const body = await request.json();
    const updates = UpdateTicketSchema.parse(body);

    const ticket = await updateTicket(
      params.id,
      session!.user.id,
      session!.user.municipalityId,
      updates
    );

    return successResponse(ticket);
  } catch (error) {
    return handleApiError(error);
  }
}

