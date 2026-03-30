import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@ogp/database";
import { normalizeSecurityAnswer } from "@/lib/auth/security-questions";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/forgot-password/reset
 * Body: { phone, answer1, answer2, answer3, newPassword }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const answer1 = typeof body.answer1 === "string" ? body.answer1 : "";
    const answer2 = typeof body.answer2 === "string" ? body.answer2 : "";
    const answer3 = typeof body.answer3 === "string" ? body.answer3 : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (!phone || phone.length < 9) {
      return Response.json(
        { error: { message: "Introduza um número de telefone válido." } },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return Response.json(
        { error: { message: "A nova palavra-passe deve ter pelo menos 6 caracteres." } },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { phone },
      select: {
        id: true,
        role: true,
        municipalityId: true,
        securityAnswer1: true,
        securityAnswer2: true,
        securityAnswer3: true,
        securityQuestion1Id: true,
      },
    });

    const genericError = Response.json(
      {
        error: {
          message:
            "Não foi possível repor a palavra-passe. Verifique o telefone e as três respostas.",
        },
      },
      { status: 400 }
    );

    if (!user || user.role !== "CITIZEN") {
      return genericError;
    }

    if (
      user.securityQuestion1Id == null ||
      !user.securityAnswer1 ||
      !user.securityAnswer2 ||
      !user.securityAnswer3
    ) {
      return Response.json(
        {
          error: {
            message:
              "Esta conta não tem perguntas de segurança configuradas. Contacte o apoio municipal.",
          },
        },
        { status: 400 }
      );
    }

    const n1 = normalizeSecurityAnswer(answer1);
    const n2 = normalizeSecurityAnswer(answer2);
    const n3 = normalizeSecurityAnswer(answer3);

    if (n1.length < 1 || n2.length < 1 || n3.length < 1) {
      return genericError;
    }

    const [ok1, ok2, ok3] = await Promise.all([
      bcrypt.compare(n1, user.securityAnswer1),
      bcrypt.compare(n2, user.securityAnswer2),
      bcrypt.compare(n3, user.securityAnswer3),
    ]);

    if (!ok1 || !ok2 || !ok3) {
      return genericError;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await prisma.auditLog.create({
      data: {
        municipalityId: user.municipalityId,
        actorUserId: user.id,
        entityType: "User",
        entityId: user.id,
        action: "UPDATE",
        metadata: {
          reason: "password_reset_via_security_questions",
        },
      },
    });

    return Response.json({
      success: true,
      message: "Palavra-passe atualizada. Já pode entrar com a nova palavra-passe.",
    });
  } catch {
    return Response.json(
      { error: { message: "Erro ao repor a palavra-passe. Tente novamente." } },
      { status: 500 }
    );
  }
}
