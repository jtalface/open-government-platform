import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireAuth } from "@/lib/auth/rbac";
import { prisma } from "@ogp/database";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { successResponse, handleApiError, errorResponse } from "@/lib/api/error-handler";
import {
  isValidSecurityQuestionId,
  normalizeSecurityAnswer,
} from "@/lib/auth/security-questions";

export const dynamic = "force-dynamic";

const UpdateSchema = z
  .object({
    currentPassword: z.string().min(1, "Introduza a palavra-passe atual."),
    securityQuestion1Id: z.coerce.number().int(),
    securityQuestion2Id: z.coerce.number().int(),
    securityQuestion3Id: z.coerce.number().int(),
    securityAnswer1: z.string().min(2, "Resposta 1 demasiado curta").max(200),
    securityAnswer2: z.string().min(2, "Resposta 2 demasiado curta").max(200),
    securityAnswer3: z.string().min(2, "Resposta 3 demasiado curta").max(200),
  })
  .refine(
    (d) =>
      new Set([
        d.securityQuestion1Id,
        d.securityQuestion2Id,
        d.securityQuestion3Id,
      ]).size === 3,
    { message: "Escolha três perguntas diferentes.", path: ["securityQuestion3Id"] }
  )
  .refine(
    (d) =>
      [d.securityQuestion1Id, d.securityQuestion2Id, d.securityQuestion3Id].every(
        (id) => isValidSecurityQuestionId(id)
      ),
    { message: "Pergunta de segurança inválida.", path: ["securityQuestion1Id"] }
  );

/**
 * POST /api/auth/security-questions/update
 * Re-verifies password and replaces security questions + answers.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    const body = await request.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Dados inválidos.";
      return errorResponse("VALIDATION_ERROR", msg, 400);
    }
    const {
      currentPassword,
      securityQuestion1Id,
      securityQuestion2Id,
      securityQuestion3Id,
      securityAnswer1,
      securityAnswer2,
      securityAnswer3,
    } = parsed.data;

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

    const passwordOk = await bcrypt.compare(currentPassword, user.password);
    if (!passwordOk) {
      return errorResponse(
        "INVALID_PASSWORD",
        "A palavra-passe atual não está correta.",
        401
      );
    }

    const [hashA1, hashA2, hashA3] = await Promise.all([
      bcrypt.hash(normalizeSecurityAnswer(securityAnswer1), 10),
      bcrypt.hash(normalizeSecurityAnswer(securityAnswer2), 10),
      bcrypt.hash(normalizeSecurityAnswer(securityAnswer3), 10),
    ]);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        securityQuestion1Id,
        securityQuestion2Id,
        securityQuestion3Id,
        securityAnswer1: hashA1,
        securityAnswer2: hashA2,
        securityAnswer3: hashA3,
      },
    });

    await prisma.auditLog.create({
      data: {
        municipalityId: user.municipalityId,
        actorUserId: user.id,
        entityType: "User",
        entityId: user.id,
        action: "UPDATE",
        metadata: { reason: "security_questions_change_self_service" },
      },
    });

    return successResponse({
      message: "Perguntas e respostas de segurança atualizadas com sucesso.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
