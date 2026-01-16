/**
 * Geographic coordinates (WGS84)
 */
export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Location with derived information
 */
export interface Location extends Coordinates {
  geohash?: string;
  address?: string;
  neighborhoodId?: string;
}

/**
 * GeoJSON Point geometry
 */
export interface GeoJSONPoint {
  type: "Point";
  coordinates: [number, number]; // [lng, lat]
}

/**
 * GeoJSON Polygon geometry
 */
export interface GeoJSONPolygon {
  type: "Polygon";
  coordinates: number[][][]; // Array of linear rings
}

/**
 * GeoJSON MultiPolygon geometry
 */
export interface GeoJSONMultiPolygon {
  type: "MultiPolygon";
  coordinates: number[][][][];
}

/**
 * Supported GeoJSON geometry types
 */
export type GeoJSONGeometry = GeoJSONPoint | GeoJSONPolygon | GeoJSONMultiPolygon;

/**
 * Bounding box for map queries
 */
export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Distance in meters
 */
export type Distance = number;

