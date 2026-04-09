import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireAuth } from "@/lib/auth/rbac";
import { prisma } from "@ogp/database";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { successResponse, handleApiError, errorResponse } from "@/lib/api/error-handler";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  currentPassword: z.string().min(1, "Introduza a palavra-passe atual."),
});

/**
 * POST /api/auth/security-questions/verify
 * Confirms password; ensures account has security Q&A configured. Returns { verified: true }.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Dados inválidos.";
      return errorResponse("VALIDATION_ERROR", msg, 400);
    }
    const { currentPassword } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: session!.user.id },
      select: {
        password: true,
        active: true,
        securityQuestion1Id: true,
        securityQuestion2Id: true,
        securityQuestion3Id: true,
        securityAnswer1: true,
        securityAnswer2: true,
        securityAnswer3: true,
      },
    });

    if (!user?.active) {
      return errorResponse("NOT_FOUND", "Conta não encontrada.", 404);
    }

    const passwordOk = await bcrypt.compare(currentPassword, user.password);
    if (!passwordOk) {
      return errorResponse(
        "INVALID_PASSWORD",
        "A palavra-passe atual não está correta.",
        401
      );
    }

    if (
      user.securityQuestion1Id == null ||
      user.securityQuestion2Id == null ||
      user.securityQuestion3Id == null ||
      !user.securityAnswer1 ||
      !user.securityAnswer2 ||
      !user.securityAnswer3
    ) {
      return errorResponse(
        "BAD_REQUEST",
        "Esta conta não tem perguntas de segurança configuradas. Contacte o apoio municipal.",
        400
      );
    }

    return successResponse({ verified: true });
  } catch (error) {
    return handleApiError(error);
  }
}
