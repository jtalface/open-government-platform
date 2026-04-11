import { NextRequest } from "next/server";
import { prisma } from "@ogp/database";
import { getSecurityQuestionLabel, type SecurityQuestionLocale } from "@/lib/auth/security-questions";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/forgot-password/questions
 * Body: { phone, locale?: "pt" | "en" }
 * Returns the three question labels for this account (any role with phone + security setup).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const locale: SecurityQuestionLocale = body.locale === "en" ? "en" : "pt";

    if (!phone || phone.length < 9) {
      return Response.json(
        { error: { message: "Introduza um número de telefone válido." } },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { phone },
      select: {
        id: true,
        securityQuestion1Id: true,
        securityQuestion2Id: true,
        securityQuestion3Id: true,
        securityAnswer1: true,
        securityAnswer2: true,
        securityAnswer3: true,
      },
    });

    if (!user) {
      return Response.json(
        { error: { message: "Não encontrámos uma conta com este telefone." } },
        { status: 404 }
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

    const q1 = getSecurityQuestionLabel(user.securityQuestion1Id, locale);
    const q2 = getSecurityQuestionLabel(user.securityQuestion2Id, locale);
    const q3 = getSecurityQuestionLabel(user.securityQuestion3Id, locale);

    return Response.json({
      questions: [{ label: q1 }, { label: q2 }, { label: q3 }],
    });
  } catch {
    return Response.json(
      { error: { message: "Erro ao processar o pedido." } },
      { status: 500 }
    );
  }
}
