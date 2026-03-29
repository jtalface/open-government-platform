import { NextRequest, NextResponse } from "next/server";
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

    // Standard query (never list soft-deleted)
    const where: any = {
      municipalityId,
      deletedAt: null,
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
        // Order newest incidents first
        orderBy: { createdAt: "desc" },
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

// Beira City Bounding Box
const BEIRA_BOUNDS = {
  minLat: -19.88,  // South
  maxLat: -19.66,  // North
  minLng: 34.78,   // West
  maxLng: 34.91,   // East
};

function isWithinBeiraBounds(lat: number, lng: number): boolean {
  return (
    lat >= BEIRA_BOUNDS.minLat &&
    lat <= BEIRA_BOUNDS.maxLat &&
    lng >= BEIRA_BOUNDS.minLng &&
    lng <= BEIRA_BOUNDS.maxLng
  );
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

    // Validate geofencing - must be within Beira bounds
    if (!isWithinBeiraBounds(input.location.lat, input.location.lng)) {
      return NextResponse.json(
        {
          error: {
            message: "Não é possível criar ocorrências fora dos limites da cidade de Beira. Por favor, certifique-se de que está dentro da área da cidade.",
            code: "LOCATION_OUT_OF_BOUNDS",
          },
        },
        { status: 400 }
      );
    }

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

