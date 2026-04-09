import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireAuth } from "@/lib/auth/rbac";
import { prisma } from "@ogp/database";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { successResponse, handleApiError, errorResponse } from "@/lib/api/error-handler";

export const dynamic = "force-dynamic";

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Introduza a palavra-passe atual."),
  newPassword: z.string().min(6, "A nova palavra-passe deve ter pelo menos 6 caracteres."),
});

/**
 * POST /api/auth/change-password
 * Authenticated user updates password after verifying current password.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    const body = await request.json();
    const parsed = ChangePasswordSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Dados inválidos.";
      return errorResponse("VALIDATION_ERROR", msg, 400);
    }
    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: session!.user.id },
      select: {
        id: true,
        password: true,
        active: true,
        municipalityId: true,
      },
    });

    if (!user?.active) {
      return errorResponse("NOT_FOUND", "Conta não encontrada.", 404);
    }

    const currentOk = await bcrypt.compare(currentPassword, user.password);
    if (!currentOk) {
      return errorResponse(
        "INVALID_PASSWORD",
        "A palavra-passe atual não está correta.",
        401
      );
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    await prisma.auditLog.create({
      data: {
        municipalityId: user.municipalityId,
        actorUserId: user.id,
        entityType: "User",
        entityId: user.id,
        action: "UPDATE",
        metadata: { reason: "password_change_self_service" },
      },
    });

    return successResponse({ message: "Palavra-passe atualizada com sucesso." });
  } catch (error) {
    return handleApiError(error);
  }
}
