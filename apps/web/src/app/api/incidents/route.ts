import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireAuth } from "@/lib/auth/rbac";
import { CreateIncidentSchema } from "@ogp/types";
import { createIncident, getIncidentsNearby } from "@/lib/services/incident-service";
import { successResponse, handleApiError } from "@/lib/api/error-handler";
import { prisma } from "@ogp/database";

/**
 * GET /api/incidents
 * List incidents with filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    const searchParams = request.nextUrl.searchParams;
    const municipalityId = session!.user.municipalityId;

    // Parse query parameters
    const categoryId = searchParams.get("categoryId");
    const status = searchParams.get("status");
    const neighborhoodId = searchParams.get("neighborhoodId");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radius = searchParams.get("radius");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    // Nearby query
    if (lat && lng) {
      const incidents = await getIncidentsNearby(
        municipalityId,
        parseFloat(lat),
        parseFloat(lng),
        radius ? parseInt(radius) : 5000
      );

      return successResponse({
        items: incidents,
        total: incidents.length,
        page: 1,
        pageSize: incidents.length,
        hasMore: false,
      });
    }

    // Standard query
    const where: any = {
      municipalityId,
    };

    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;
    if (neighborhoodId) where.neighborhoodId = neighborhoodId;

    const [incidents, total] = await Promise.all([
      prisma.incidentEvent.findMany({
        where,
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
        orderBy: [{ importanceScore: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.incidentEvent.count({ where }),
    ]);

    return successResponse({
      items: incidents,
      total,
      page,
      pageSize,
      hasMore: total > page * pageSize,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/incidents
 * Create a new incident
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    const body = await request.json();
    const input = CreateIncidentSchema.parse(body);

    const incident = await createIncident(
      session!.user.id,
      session!.user.municipalityId,
      input
    );

    return successResponse(incident, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

