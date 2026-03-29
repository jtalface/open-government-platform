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

    // Build base where clause (exclude soft-deleted incidents)
    const baseWhere: any = {
      municipalityId,
      deletedAt: null,
    };

    // Add category filter if provided
    if (categoryId) {
      baseWhere.categoryId = categoryId;
    }

    // Calculate date for "this week" (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Get counts and incidents for time calculations
    const [
      openIncidents,
      activeTickets,
      resolvedThisWeek,
      triagedIncidents,
      ticketedIncidents,
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
                deletedAt: null,
              },
            }
          : {
              municipalityId,
              status: { in: ["NEW", "IN_PROGRESS"] },
              OR: [{ incidentId: null }, { incident: { deletedAt: null } }],
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
      // Get incidents currently in TRIAGED status to calculate average triage time
      // Note: This calculates time from creation to when they reached TRIAGED status
      // For incidents that progressed beyond TRIAGED, we don't have the exact timestamp
      // when they were triaged, so we only count incidents currently in TRIAGED status
      prisma.incidentEvent.findMany({
        where: {
          ...baseWhere,
          status: "TRIAGED",
        },
        select: {
          createdAt: true,
          updatedAt: true,
        },
      }),
      // Get incidents currently in TICKETED status to calculate average response time
      // Note: This calculates time from creation to when they reached TICKETED status
      // For incidents that progressed beyond TICKETED, we don't have the exact timestamp
      // when they were ticketed, so we only count incidents currently in TICKETED status
      prisma.incidentEvent.findMany({
        where: {
          ...baseWhere,
          status: "TICKETED",
        },
        select: {
          createdAt: true,
          updatedAt: true,
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

    // Helper function to format time duration
    const formatTimeDuration = (totalMs: number, count: number): string => {
      if (count === 0) return "-";
      
      const avgMs = totalMs / count;
      const avgDays = avgMs / (1000 * 60 * 60 * 24);
      const avgHours = avgMs / (1000 * 60 * 60);
      const avgMinutes = avgMs / (1000 * 60);

      if (avgDays >= 1) {
        return `${avgDays.toFixed(1)} dias`;
      } else if (avgHours >= 1) {
        return `${avgHours.toFixed(1)} horas`;
      } else {
        return `${avgMinutes.toFixed(0)} minutos`;
      }
    };

    // Calculate average triage time (time to reach TRIAGED status)
    let avgTriageTime = "-";
    if (triagedIncidents.length > 0) {
      const totalMs = triagedIncidents.reduce((sum, incident) => {
        const diffMs = incident.updatedAt.getTime() - incident.createdAt.getTime();
        return sum + diffMs;
      }, 0);
      avgTriageTime = formatTimeDuration(totalMs, triagedIncidents.length);
    }

    // Calculate average response time (time to reach TICKETED status)
    let avgResponseTime = "-";
    if (ticketedIncidents.length > 0) {
      const totalMs = ticketedIncidents.reduce((sum, incident) => {
        const diffMs = incident.updatedAt.getTime() - incident.createdAt.getTime();
        return sum + diffMs;
      }, 0);
      avgResponseTime = formatTimeDuration(totalMs, ticketedIncidents.length);
    }

    // Calculate average resolution time (time to reach RESOLVED/CLOSED status)
    let avgResolutionTime = "-";
    if (resolvedIncidents.length > 0) {
      const totalMs = resolvedIncidents.reduce((sum, incident) => {
        const diffMs = incident.updatedAt.getTime() - incident.createdAt.getTime();
        return sum + diffMs;
      }, 0);
      avgResolutionTime = formatTimeDuration(totalMs, resolvedIncidents.length);
    }

    const stats = {
      openIncidents,
      activeTickets,
      resolvedThisWeek,
      avgResolutionTime: {
        triagem: avgTriageTime,
        resposta: avgResponseTime,
        resolucao: avgResolutionTime,
      },
    };

    return successResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
