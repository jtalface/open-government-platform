import {
  UserRole,
  IncidentStatus,
  TicketStatus,
  TicketPriority,
  UpdateVisibility,
  VoteValue,
  MediaType,
  AuditAction,
} from "./enums";
import { Coordinates, GeoJSONGeometry } from "./geo";

/**
 * Base entity with common fields
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Municipality (tenant)
 */
export interface Municipality extends BaseEntity {
  name: string;
  slug: string;
  settings: MunicipalitySettings;
  active: boolean;
}

/**
 * Municipality configuration
 */
export interface MunicipalitySettings {
  mapCenter: Coordinates;
  mapZoom: number;
  votingRadius?: number; // meters, if not using polygon neighborhoods
  scoreWeights: {
    neighborhoodVoteWeight: number;
    globalVoteWeight: number;
    recencyDecayDays: number;
  };
  publicTicketsEnabled: boolean;
  guestReportingEnabled: boolean;
}

/**
 * User account
 */
export interface User extends BaseEntity {
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  municipalityId: string;
  neighborhoodId?: string;
  location?: Coordinates; // Last known location for neighborhood derivation
  emailVerified?: Date;
  image?: string;
  active: boolean;
}

/**
 * Incident category
 */
export interface Category extends BaseEntity {
  municipalityId: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  active: boolean;
  sortOrder: number;
}

/**
 * Neighborhood/Area within municipality
 */
export interface Neighborhood extends BaseEntity {
  municipalityId: string;
  name: string;
  slug: string;
  geometry: GeoJSONGeometry; // Polygon or MultiPolygon
  metadata?: {
    population?: number;
    area?: number; // square meters
    [key: string]: any;
  };
  active: boolean;
}

/**
 * Media attachment
 */
export interface Media {
  url: string;
  type: MediaType;
  uploadedAt: Date;
  thumbnailUrl?: string;
  metadata?: {
    width?: number;
    height?: number;
    size?: number;
    [key: string]: any;
  };
}

/**
 * Vote statistics aggregated by neighborhood
 */
export interface VoteStats {
  total: number;
  upvotes: number;
  downvotes: number;
  byNeighborhood: Record<
    string,
    {
      upvotes: number;
      downvotes: number;
    }
  >;
}

/**
 * Incident/Event reported by citizens
 */
export interface IncidentEvent extends BaseEntity {
  municipalityId: string;
  categoryId: string;
  title: string;
  description: string;
  location: Coordinates;
  geohash: string;
  neighborhoodId?: string;
  address?: string;
  status: IncidentStatus;
  createdByUserId: string;
  media: Media[];
  voteStats: VoteStats;
  importanceScore: number; // Calculated score for sorting
  ticketId?: string; // Linked ticket if created
  // Relations (populated separately)
  category?: Category;
  createdBy?: User;
  neighborhood?: Neighborhood;
  ticket?: Ticket;
}

/**
 * Vote on an incident
 */
export interface Vote extends BaseEntity {
  incidentId: string;
  userId: string;
  municipalityId: string;
  neighborhoodId?: string;
  value: VoteValue;
}

/**
 * Ticket created by managers
 */
export interface Ticket extends BaseEntity {
  municipalityId: string;
  incidentId?: string; // Optional, can be created directly
  categoryId: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdByUserId: string;
  assignedToUserId?: string;
  publicVisibility: UpdateVisibility;
  sla?: {
    dueDate?: Date;
    estimatedHours?: number;
  };
  metadata?: Record<string, any>;
  // Relations
  incident?: IncidentEvent;
  category?: Category;
  createdBy?: User;
  assignedTo?: User;
  updates?: TicketUpdate[];
}

/**
 * Progress update on a ticket
 */
export interface TicketUpdate extends BaseEntity {
  ticketId: string;
  authorUserId: string;
  visibility: UpdateVisibility;
  message: string;
  attachments: Media[];
  // Relations
  author?: User;
}

/**
 * Audit log entry
 */
export interface AuditLog extends BaseEntity {
  municipalityId: string;
  actorUserId: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  metadata: Record<string, any>;
  // Relations
  actor?: User;
}

