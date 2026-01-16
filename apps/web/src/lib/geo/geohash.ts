import geohash from "ngeohash";
import { Coordinates } from "@ogp/types";

/**
 * Encode coordinates to geohash
 */
export function encodeGeohash(coords: Coordinates, precision = 7): string {
  return geohash.encode(coords.lat, coords.lng, precision);
}

/**
 * Decode geohash to coordinates
 */
export function decodeGeohash(hash: string): Coordinates {
  const { latitude, longitude } = geohash.decode(hash);
  return { lat: latitude, lng: longitude };
}

/**
 * Get geohash neighbors (for nearby queries)
 */
export function getGeohashNeighbors(hash: string): string[] {
  return geohash.neighbors(hash);
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in meters
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (coord1.lat * Math.PI) / 180;
  const φ2 = (coord2.lat * Math.PI) / 180;
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Check if a point is within a radius of another point
 */
export function isWithinRadius(
  center: Coordinates,
  point: Coordinates,
  radiusMeters: number
): boolean {
  return calculateDistance(center, point) <= radiusMeters;
}

/**
 * Calculate bounding box for a center point and radius
 */
export function getBoundingBox(
  center: Coordinates,
  radiusMeters: number
): {
  north: number;
  south: number;
  east: number;
  west: number;
} {
  const latDelta = (radiusMeters / 111320); // 1 degree latitude ≈ 111.32 km
  const lngDelta = radiusMeters / (111320 * Math.cos((center.lat * Math.PI) / 180));

  return {
    north: center.lat + latDelta,
    south: center.lat - latDelta,
    east: center.lng + lngDelta,
    west: center.lng - lngDelta,
  };
}

