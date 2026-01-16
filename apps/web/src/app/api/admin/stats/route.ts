import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireAdmin } from "@/lib/auth/rbac";
import { successResponse, handleApiError } from "@/lib/api/error-handler";
import { prisma } from "@ogp/database";

/**
 * GET /api/admin/stats
 * Get system-wide statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAdmin(session);

    const municipalityId = session!.user.municipalityId;

    // Get counts
    const [
      totalUsers,
      totalCitizens,
      totalManagers,
      openIncidents,
      activeTickets,
      totalCategories,
      totalNeighborhoods,
      municipality,
      recentActivity,
    ] = await Promise.all([
      prisma.user.count({ where: { municipalityId } }),
      prisma.user.count({ where: { municipalityId, role: "CITIZEN" } }),
      prisma.user.count({ where: { municipalityId, role: "MANAGER" } }),
      prisma.incidentEvent.count({
        where: {
          municipalityId,
          status: { in: ["OPEN", "TRIAGED", "TICKETED"] },
        },
      }),
      prisma.ticket.count({
        where: {
          municipalityId,
          status: { in: ["NEW", "IN_PROGRESS"] },
        },
      }),
      prisma.category.count({ where: { municipalityId, active: true } }),
      prisma.neighborhood.count({ where: { municipalityId, active: true } }),
      prisma.municipality.findUnique({ where: { id: municipalityId } }),
      prisma.auditLog.findMany({
        where: { municipalityId },
        include: {
          actor: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const stats = {
      totalUsers,
      totalCitizens,
      totalManagers,
      openIncidents,
      activeTickets,
      totalCategories,
      totalNeighborhoods,
      municipalityName: municipality?.name,
      recentActivity: recentActivity.map((log) => ({
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        actorName: log.actor.name,
        createdAt: log.createdAt,
        metadata: log.metadata,
      })),
    };

    return successResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
}

