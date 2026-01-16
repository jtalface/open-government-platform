/**
 * User roles in the system
 */
export enum UserRole {
  CITIZEN = "CITIZEN",
  MANAGER = "MANAGER",
  ADMIN = "ADMIN",
}

/**
 * Incident/Event status lifecycle
 */
export enum IncidentStatus {
  OPEN = "OPEN",
  TRIAGED = "TRIAGED",
  TICKETED = "TICKETED",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
}

/**
 * Ticket status for manager workflow
 */
export enum TicketStatus {
  NEW = "NEW",
  IN_PROGRESS = "IN_PROGRESS",
  BLOCKED = "BLOCKED",
  DONE = "DONE",
  CLOSED = "CLOSED",
}

/**
 * Ticket priority levels
 */
export enum TicketPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

/**
 * Visibility for ticket updates
 */
export enum UpdateVisibility {
  PUBLIC = "PUBLIC",
  INTERNAL = "INTERNAL",
}

/**
 * Vote values
 */
export enum VoteValue {
  UP = 1,
  DOWN = -1,
}

/**
 * Media types for uploads
 */
export enum MediaType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  DOCUMENT = "DOCUMENT",
}

/**
 * Audit log action types
 */
export enum AuditAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  ROLE_CHANGE = "ROLE_CHANGE",
  STATUS_CHANGE = "STATUS_CHANGE",
  VISIBILITY_CHANGE = "VISIBILITY_CHANGE",
}

