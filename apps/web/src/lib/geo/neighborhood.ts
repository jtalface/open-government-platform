import { prisma } from "@ogp/database";
import { Coordinates } from "@ogp/types";

/**
 * Find neighborhood containing a point using PostGIS
 */
export async function findNeighborhoodByPoint(
  municipalityId: string,
  coords: Coordinates
): Promise<string | null> {
  try {
    // Use PostGIS ST_Contains - NOTE: Use quoted camelCase column names!
    const result = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM neighborhoods
      WHERE "municipalityId" = ${municipalityId}::uuid
        AND active = true
        AND ST_Contains(geometry, ST_SetSRID(ST_MakePoint(${coords.lng}, ${coords.lat}), 4326))
      LIMIT 1
    `;

    return result.length > 0 ? result[0].id : null;
  } catch (error) {
    console.error("Error finding neighborhood by point:", error);
    return null;
  }
}

/**
 * Find nearest neighborhood to a point (fallback if not contained in any)
 */
export async function findNearestNeighborhood(
  municipalityId: string,
  coords: Coordinates
): Promise<string | null> {
  try {
    // Use PostGIS ST_Distance - NOTE: Use quoted camelCase column names!
    const result = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM neighborhoods
      WHERE "municipalityId" = ${municipalityId}::uuid
        AND active = true
      ORDER BY ST_Distance(
        geometry,
        ST_SetSRID(ST_MakePoint(${coords.lng}, ${coords.lat}), 4326)
      )
      LIMIT 1
    `;

    return result.length > 0 ? result[0].id : null;
  } catch (error) {
    console.error("Error finding nearest neighborhood:", error);
    return null;
  }
}

/**
 * Get neighborhood for coordinates (tries containment first, then nearest)
 */
export async function getNeighborhoodForCoordinates(
  municipalityId: string,
  coords: Coordinates
): Promise<string | null> {
  // Try to find containing neighborhood first
  let neighborhoodId = await findNeighborhoodByPoint(municipalityId, coords);

  // If not found, find nearest
  if (!neighborhoodId) {
    neighborhoodId = await findNearestNeighborhood(municipalityId, coords);
  }

  return neighborhoodId;
}
