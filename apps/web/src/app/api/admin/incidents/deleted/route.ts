import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireAdmin } from "@/lib/auth/rbac";
import { successResponse, handleApiError } from "@/lib/api/error-handler";
import { prisma } from "@ogp/database";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/incidents/deleted
 * List soft-deleted incidents for the admin's municipality
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAdmin(session);

    const municipalityId = session!.user.municipalityId;
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1", 10);
    const pageSize = Math.min(
      parseInt(request.nextUrl.searchParams.get("pageSize") || "50", 10),
      100
    );

    const where = {
      municipalityId,
      deletedAt: { not: null },
    };

    const [items, total] = await Promise.all([
      prisma.incidentEvent.findMany({
        where,
        orderBy: { deletedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          category: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          neighborhood: true,
        },
      }),
      prisma.incidentEvent.count({ where }),
    ]);

    return successResponse({
      items,
      total,
      page,
      pageSize,
      hasMore: total > page * pageSize,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
