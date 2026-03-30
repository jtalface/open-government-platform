import { NextRequest } from "next/server";
import { SECURITY_QUESTIONS, type SecurityQuestionLocale } from "@/lib/auth/security-questions";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/security-questions?locale=pt|en
 * Public list for signup dropdowns.
 */
export async function GET(request: NextRequest) {
  const localeParam = request.nextUrl.searchParams.get("locale");
  const locale: SecurityQuestionLocale =
    localeParam === "en" ? "en" : "pt";

  const questions = SECURITY_QUESTIONS.map((q) => ({
    id: q.id,
    label: locale === "en" ? q.en : q.pt,
  }));

  return Response.json({ questions });
}
