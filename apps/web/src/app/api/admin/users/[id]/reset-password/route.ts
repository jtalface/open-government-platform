import { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authOptions } from "@/lib/auth/auth-options";
import { requireAdmin } from "@/lib/auth/rbac";
import { successResponse, handleApiError, errorResponse } from "@/lib/api/error-handler";
import { prisma } from "@ogp/database";

const BodySchema = z.object({
  newPassword: z.string().max(128).optional(),
});

function generateTemporaryPassword(): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const buf = randomBytes(16);
  let s = "";
  for (let i = 0; i < 14; i++) {
    s += chars[buf[i]! % chars.length];
  }
  return `${s}!9`;
}

/**
 * POST /api/admin/users/:id/reset-password
 * Sets a new bcrypt password; returns plaintext once for out-of-band delivery (Design A).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    requireAdmin(session);

    if (params.id === session!.user.id) {
      return errorResponse(
        "BAD_REQUEST",
        "Para alterar a sua própria palavra-passe, use a página de perfil ou definições da conta.",
        400
      );
    }

    const body = await request.json().catch(() => ({}));
    const { newPassword } = BodySchema.parse(body);
    const trimmed = newPassword?.trim();

    let plain: string;
    if (trimmed) {
      if (trimmed.length < 6) {
        return errorResponse(
          "BAD_REQUEST",
          "A palavra-passe deve ter pelo menos 6 caracteres.",
          400
        );
      }
      plain = trimmed;
    } else {
      plain = generateTemporaryPassword();
    }

    const target = await prisma.user.findFirst({
      where: { id: params.id, municipalityId: session!.user.municipalityId },
      select: { id: true, email: true, name: true },
    });

    if (!target) {
      return errorResponse("NOT_FOUND", "Utilizador não encontrado.", 404);
    }

    const hashed = await bcrypt.hash(plain, 10);

    await prisma.user.update({
      where: { id: params.id },
      data: { password: hashed },
    });

    await prisma.auditLog.create({
      data: {
        municipalityId: session!.user.municipalityId,
        actorUserId: session!.user.id,
        entityType: "User",
        entityId: target.id,
        action: "UPDATE",
        metadata: {
          passwordResetByAdmin: true,
          targetUserEmail: target.email,
          targetUserName: target.name,
        },
      },
    });

    return successResponse({ temporaryPassword: plain });
  } catch (error) {
    return handleApiError(error);
  }
}
