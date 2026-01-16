import { prisma } from "@ogp/database";
import { IncidentEvent, CreateIncidentInput, VoteValue } from "@ogp/types";
import { encodeGeohash } from "../geo/geohash";
import { getNeighborhoodForCoordinates } from "../geo/neighborhood";
import { calculateImportanceScore, recalculateVoteStats } from "./importance-scoring";

/**
 * Service for incident management
 */

export async function createIncident(
  userId: string,
  municipalityId: string,
  input: CreateIncidentInput
): Promise<IncidentEvent> {
  // Generate geohash
  const geohash = encodeGeohash(input.location);

  // Determine neighborhood
  const neighborhoodId = await getNeighborhoodForCoordinates(municipalityId, input.location);

  // Create incident with PostGIS point - NOTE: Use quoted camelCase column names!
  const incident = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO incident_events (
      id, "municipalityId", "categoryId", title, description,
      location, lat, lng, geohash, "neighborhoodId",
      status, "createdByUserId", media, "voteStats", "importanceScore",
      "createdAt", "updatedAt"
    )
    VALUES (
      gen_random_uuid(),
      ${municipalityId}::uuid,
      ${input.categoryId}::uuid,
      ${input.title},
      ${input.description},
      ST_SetSRID(ST_MakePoint(${input.location.lng}, ${input.location.lat}), 4326),
      ${input.location.lat},
      ${input.location.lng},
      ${geohash},
      ${neighborhoodId ? neighborhoodId : null}::uuid,
      'OPEN'::"IncidentStatus",
      ${userId}::uuid,
      ${JSON.stringify(input.media || [])}::json,
      '{"total": 0, "upvotes": 0, "downvotes": 0, "byNeighborhood": {}}'::json,
      0.0,
      NOW(),
      NOW()
    )
    RETURNING id
  `;

  // Fetch and return the created incident
  const createdIncident = await prisma.incidentEvent.findUnique({
    where: { id: incident[0].id },
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
  });

  if (!createdIncident) {
    throw new Error("Failed to create incident");
  }

  return createdIncident as any;
}

/**
 * Vote on an incident
 */
export async function voteOnIncident(
  userId: string,
  incidentId: string,
  value: VoteValue,
  userNeighborhoodId: string | null
): Promise<void> {
  // Check if user already voted
  const existingVote = await prisma.vote.findUnique({
    where: {
      incidentId_userId: {
        incidentId,
        userId,
      },
    },
  });

  const incident = await prisma.incidentEvent.findUnique({
    where: { id: incidentId },
    include: {
      votes: true,
    },
  });

  if (!incident) {
    throw new Error("Incident not found");
  }

  // Update or create vote
  if (existingVote) {
    await prisma.vote.update({
      where: { id: existingVote.id },
      data: { value },
    });
  } else {
    await prisma.vote.create({
      data: {
        incidentId,
        userId,
        municipalityId: incident.municipalityId,
        neighborhoodId: userNeighborhoodId,
        value,
      },
    });
  }

  // Recalculate vote stats
  await recalculateIncidentScore(incidentId);
}

/**
 * Remove vote from incident
 */
export async function removeVote(userId: string, incidentId: string): Promise<void> {
  await prisma.vote.delete({
    where: {
      incidentId_userId: {
        incidentId,
        userId,
      },
    },
  });

  // Recalculate vote stats
  await recalculateIncidentScore(incidentId);
}

/**
 * Recalculate vote stats and importance score for an incident
 */
export async function recalculateIncidentScore(incidentId: string): Promise<void> {
  const incident = await prisma.incidentEvent.findUnique({
    where: { id: incidentId },
    include: {
      votes: true,
      municipality: true,
    },
  });

  if (!incident) {
    throw new Error("Incident not found");
  }

  // Recalculate vote stats
  const voteStats = recalculateVoteStats(
    incident.votes.map((v) => ({
      value: v.value,
      neighborhoodId: v.neighborhoodId,
    }))
  );

  // Calculate importance score
  const settings = incident.municipality.settings as any;
  const importanceScore = calculateImportanceScore(
    voteStats,
    incident.neighborhoodId,
    incident.createdAt,
    settings.scoreWeights
  );

  // Update incident
  await prisma.incidentEvent.update({
    where: { id: incidentId },
    data: {
      voteStats: voteStats as any,
      importanceScore,
    },
  });
}

/**
 * Get incidents near a location
 */
export async function getIncidentsNearby(
  municipalityId: string,
  lat: number,
  lng: number,
  radiusMeters: number = 5000,
  limit: number = 50
): Promise<any[]> {
  // NOTE: Use quoted camelCase column names!
  const incidents = await prisma.$queryRaw<any[]>`
    SELECT 
      ie.*,
      ST_Distance(
        ie.location,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
      ) as distance
    FROM incident_events ie
    WHERE ie."municipalityId" = ${municipalityId}::uuid
      AND ST_DWithin(
        ie.location::geography,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        ${radiusMeters}
      )
    ORDER BY ie."importanceScore" DESC, ie."createdAt" DESC
    LIMIT ${limit}
  `;

  return incidents;
}
