import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireAdmin } from "@/lib/auth/rbac";
import { successResponse, handleApiError } from "@/lib/api/error-handler";
import { prisma } from "@ogp/database";
import { z } from "zod";

const UpdateUserSchema = z.object({
  role: z.enum(["CITIZEN", "MANAGER", "ADMIN"]).optional(),
  active: z.boolean().optional(),
  name: z.string().min(1).optional(),
  neighborhoodId: z.string().uuid().optional().nullable(),
});

/**
 * PATCH /api/admin/users/:id
 * Update user details
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    requireAdmin(session);

    const body = await request.json();
    const input = UpdateUserSchema.parse(body);

    // Don't allow users to modify themselves
    if (params.id === session!.user.id && input.role) {
      return Response.json(
        { error: { message: "Não pode alterar a sua própria role" } },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: {
        id: params.id,
        municipalityId: session!.user.municipalityId,
      },
      data: input,
      include: {
        neighborhood: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        municipalityId: session!.user.municipalityId,
        actorUserId: session!.user.id,
        entityType: "User",
        entityId: user.id,
        action: input.role ? "ROLE_CHANGE" : "UPDATE",
        metadata: input,
      },
    });

    return successResponse(user);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/admin/users/:id
 * Delete a user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    requireAdmin(session);

    // Don't allow users to delete themselves
    if (params.id === session!.user.id) {
      return Response.json(
        { error: { message: "Não pode eliminar a sua própria conta" } },
        { status: 400 }
      );
    }

    const user = await prisma.user.delete({
      where: {
        id: params.id,
        municipalityId: session!.user.municipalityId,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        municipalityId: session!.user.municipalityId,
        actorUserId: session!.user.id,
        entityType: "User",
        entityId: user.id,
        action: "DELETE",
        metadata: {
          userName: user.name,
          userEmail: user.email,
        },
      },
    });

    return successResponse({ message: "User deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}

