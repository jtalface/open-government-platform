import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireManager } from "@/lib/auth/rbac";
import { successResponse, handleApiError } from "@/lib/api/error-handler";
import { prisma } from "@ogp/database";
import { z } from "zod";

const UpdateStatusSchema = z.object({
  status: z.enum(["OPEN", "TRIAGED", "TICKETED", "RESOLVED", "CLOSED"]),
});

/**
 * PATCH /api/incidents/:id/status
 * Update incident status (Manager only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    requireManager(session);

    const body = await request.json();
    const { status } = UpdateStatusSchema.parse(body);

    // Update incident status
    const incident = await prisma.incidentEvent.update({
      where: {
        id: params.id,
        municipalityId: session!.user.municipalityId,
      },
      data: {
        status,
      },
    });

    // TODO: Create audit log entry
    // await prisma.auditLog.create({ ... });

    return successResponse(incident);
  } catch (error) {
    return handleApiError(error);
  }
}

