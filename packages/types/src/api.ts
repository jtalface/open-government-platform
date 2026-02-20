import { z } from "zod";
import {
  UserRole,
  IncidentStatus,
  TicketStatus,
  TicketPriority,
  UpdateVisibility,
  VoteValue,
} from "./enums";
import { Coordinates } from "./geo";

/**
 * API Response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Common query parameters
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ===========================================
// INCIDENT API
// ===========================================

export const CreateIncidentSchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  media: z
    .array(
      z.object({
        url: z.string().url(),
        type: z.enum(["IMAGE", "VIDEO", "DOCUMENT"]),
      })
    )
    .optional(),
});

export type CreateIncidentInput = z.infer<typeof CreateIncidentSchema>;

export const UpdateIncidentSchema = z.object({
  categoryId: z.string().uuid().optional(),
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(10).max(2000).optional(),
  media: z
    .array(
      z.object({
        url: z.string().url(),
        type: z.enum(["IMAGE", "VIDEO", "DOCUMENT"]),
      })
    )
    .optional(),
});

export type UpdateIncidentInput = z.infer<typeof UpdateIncidentSchema>;

export interface ListIncidentsParams extends PaginationParams, SortParams {
  categoryId?: string;
  status?: IncidentStatus;
  neighborhoodId?: string;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  near?: {
    lat: number;
    lng: number;
    radius?: number; // meters
  };
  search?: string;
}

export const VoteIncidentSchema = z.object({
  value: z.nativeEnum(VoteValue),
});

export type VoteIncidentInput = z.infer<typeof VoteIncidentSchema>;

// ===========================================
// TICKET API
// ===========================================

export const CreateTicketSchema = z.object({
  incidentId: z.string().uuid().optional(),
  categoryId: z.string().uuid(),
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  priority: z.nativeEnum(TicketPriority),
  assignedToUserId: z.string().uuid().optional(),
  publicVisibility: z.nativeEnum(UpdateVisibility).default(UpdateVisibility.INTERNAL),
  sla: z
    .object({
      dueDate: z.string().datetime().optional(),
      estimatedHours: z.number().positive().optional(),
    })
    .optional(),
});

export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;

export const UpdateTicketSchema = z.object({
  status: z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  assignedToUserId: z.string().uuid().optional(),
  publicVisibility: z.nativeEnum(UpdateVisibility).optional(),
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
});

export type UpdateTicketInput = z.infer<typeof UpdateTicketSchema>;

export const CreateTicketUpdateSchema = z.object({
  message: z.string().min(10).max(2000),
  visibility: z.nativeEnum(UpdateVisibility),
  attachments: z
    .array(
      z.object({
        url: z.string().url(),
        type: z.enum(["IMAGE", "VIDEO", "DOCUMENT"]),
      })
    )
    .optional(),
});

export type CreateTicketUpdateInput = z.infer<typeof CreateTicketUpdateSchema>;

export interface ListTicketsParams extends PaginationParams, SortParams {
  categoryId?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedToUserId?: string;
  search?: string;
}

// ===========================================
// USER/AUTH API
// ===========================================

export const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(100),
  municipalityId: z.string().uuid(),
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
});

export type SignUpInput = z.infer<typeof SignUpSchema>;

export const UpdateUserRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleSchema>;

// ===========================================
// CATEGORY API (Admin)
// ===========================================

export const CreateCategorySchema = z.object({
  name: z.string().min(2).max(100),
  icon: z.string(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;

export const UpdateCategorySchema = CreateCategorySchema.partial();

export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;

// ===========================================
// NEIGHBORHOOD API (Admin)
// ===========================================

export const CreateNeighborhoodSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  geometry: z.object({
    type: z.enum(["Polygon", "MultiPolygon"]),
    coordinates: z.any(), // Complex validation for GeoJSON
  }),
  metadata: z.record(z.any()).optional(),
});

export type CreateNeighborhoodInput = z.infer<typeof CreateNeighborhoodSchema>;

