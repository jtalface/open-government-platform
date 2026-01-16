import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireAuth } from "@/lib/auth/rbac";
import { successResponse, handleApiError } from "@/lib/api/error-handler";
import { prisma } from "@ogp/database";

/**
 * GET /api/categories
 * List categories for the user's municipality
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    const categories = await prisma.category.findMany({
      where: {
        municipalityId: session!.user.municipalityId,
        active: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
    });

    return successResponse(categories);
  } catch (error) {
    return handleApiError(error);
  }
}

