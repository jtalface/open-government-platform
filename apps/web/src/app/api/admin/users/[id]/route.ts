import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireAdmin } from "@/lib/auth/rbac";
import { successResponse, handleApiError, errorResponse } from "@/lib/api/error-handler";
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

    if (params.id === session!.user.id && input.role) {
      return errorResponse("BAD_REQUEST", "Não pode alterar a sua própria role", 400);
    }

    if (params.id === session!.user.id && input.active === false) {
      return errorResponse("BAD_REQUEST", "Não pode desativar a sua própria conta", 400);
    }

    const scoped = await prisma.user.findFirst({
      where: { id: params.id, municipalityId: session!.user.municipalityId },
    });
    if (!scoped) {
      return errorResponse("NOT_FOUND", "Utilizador não encontrado", 404);
    }

    const user = await prisma.user.update({
      where: { id: params.id },
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

    const auditAction =
      input.role != null
        ? "ROLE_CHANGE"
        : input.active === true && scoped.active === false
          ? "STATUS_CHANGE"
          : "UPDATE";

    await prisma.auditLog.create({
      data: {
        municipalityId: session!.user.municipalityId,
        actorUserId: session!.user.id,
        entityType: "User",
        entityId: user.id,
        action: auditAction,
        metadata: {
          ...input,
          ...(input.active === true && scoped.active === false ? { reactivated: true } : {}),
        },
      },
    });

    return successResponse(user);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/admin/users/:id
 * Soft-delete (deactivate): hard delete fails on FKs (incidents, tickets, audit, etc.).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    requireAdmin(session);

    if (params.id === session!.user.id) {
      return errorResponse("BAD_REQUEST", "Não pode eliminar a sua própria conta", 400);
    }

    const existing = await prisma.user.findFirst({
      where: {
        id: params.id,
        municipalityId: session!.user.municipalityId,
      },
    });

    if (!existing) {
      return errorResponse("NOT_FOUND", "Utilizador não encontrado", 404);
    }

    if (!existing.active) {
      return successResponse({ message: "Utilizador já estava inativo." });
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: { active: false },
    });

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
          softDelete: true,
        },
      },
    });

    return successResponse({ message: "Utilizador desativado com sucesso." });
  } catch (error) {
    return handleApiError(error);
  }
}

