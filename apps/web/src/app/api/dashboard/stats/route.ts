import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireManager } from "@/lib/auth/rbac";
import { successResponse, handleApiError } from "@/lib/api/error-handler";
import { prisma } from "@ogp/database";

// This route uses getServerSession (which relies on headers/cookies),
// so mark it as fully dynamic to avoid static optimization errors.
export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/stats
 * Get manager dashboard statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireManager(session);

    const municipalityId = session!.user.municipalityId;
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get("categoryId");

    // Build base where clause
    const baseWhere: any = {
      municipalityId,
    };

    // Add category filter if provided
    if (categoryId) {
      baseWhere.categoryId = categoryId;
    }

    // Calculate date for "this week" (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Get counts
    const [
      openIncidents,
      activeTickets,
      resolvedThisWeek,
      resolvedIncidents,
    ] = await Promise.all([
      // Open incidents (OPEN, TRIAGED, TICKETED)
      prisma.incidentEvent.count({
        where: {
          ...baseWhere,
          status: { in: ["OPEN", "TRIAGED", "TICKETED"] },
        },
      }),
      // Active tickets (NEW, IN_PROGRESS)
      // Note: Tickets don't have categoryId directly, so we filter by incident category if categoryId is provided
      prisma.ticket.count({
        where: categoryId
          ? {
              municipalityId,
              status: { in: ["NEW", "IN_PROGRESS"] },
              incident: {
                categoryId,
              },
            }
          : {
              municipalityId,
              status: { in: ["NEW", "IN_PROGRESS"] },
            },
      }),
      // Resolved incidents this week (RESOLVED or CLOSED in last 7 days)
      prisma.incidentEvent.count({
        where: {
          ...baseWhere,
          status: { in: ["RESOLVED", "CLOSED"] },
          updatedAt: {
            gte: oneWeekAgo,
          },
        },
      }),
      // Get all resolved incidents to calculate average resolution time
      prisma.incidentEvent.findMany({
        where: {
          ...baseWhere,
          status: { in: ["RESOLVED", "CLOSED"] },
        },
        select: {
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    // Calculate average resolution time
    let avgResolutionTime = "-";
    if (resolvedIncidents.length > 0) {
      const totalDays = resolvedIncidents.reduce((sum, incident) => {
        if (!incident.updatedAt) return sum;
        const diffMs = incident.updatedAt.getTime() - incident.createdAt.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        return sum + diffDays;
      }, 0);
      const avgDays = totalDays / resolvedIncidents.length;
      avgResolutionTime = `${avgDays.toFixed(1)} dias`;
    }

    const stats = {
      openIncidents,
      activeTickets,
      resolvedThisWeek,
      avgResolutionTime,
    };

    return successResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
