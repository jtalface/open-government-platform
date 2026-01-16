import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireManager } from "@/lib/auth/rbac";
import { CreateTicketUpdateSchema } from "@ogp/types";
import { addTicketUpdate } from "@/lib/services/ticket-service";
import { successResponse, handleApiError } from "@/lib/api/error-handler";

/**
 * POST /api/tickets/:id/updates
 * Add update to ticket
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    requireManager(session);

    const body = await request.json();
    const { message, visibility, attachments } = CreateTicketUpdateSchema.parse(body);

    const update = await addTicketUpdate(
      params.id,
      session!.user.id,
      session!.user.municipalityId,
      message,
      visibility,
      attachments
    );

    return successResponse(update, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

