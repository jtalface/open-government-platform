import { UserRole } from "@ogp/types";
import { Session } from "next-auth";

/**
 * Role hierarchy for permission checking
 */
const roleHierarchy: Record<UserRole, number> = {
  [UserRole.CITIZEN]: 1,
  [UserRole.MANAGER]: 2,
  [UserRole.ADMIN]: 3,
};

/**
 * Check if user has required role or higher
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Check if user is admin
 */
export function isAdmin(session: Session | null): boolean {
  return session?.user?.role === UserRole.ADMIN;
}

/**
 * Check if user is manager or admin
 */
export function isManager(session: Session | null): boolean {
  if (!session?.user) return false;
  return hasRole(session.user.role, UserRole.MANAGER);
}

/**
 * Check if user belongs to the same municipality
 */
export function isSameMunicipality(
  session: Session | null,
  municipalityId: string
): boolean {
  return session?.user?.municipalityId === municipalityId;
}

/**
 * Check if user belongs to the same neighborhood
 */
export function isSameNeighborhood(
  session: Session | null,
  neighborhoodId: string
): boolean {
  return session?.user?.neighborhoodId === neighborhoodId;
}

/**
 * Authorization errors
 */
export class UnauthorizedError extends Error {
  constructor(message = "Não autorizado") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Acesso negado") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Require authentication
 */
export function requireAuth(session: Session | null): Session {
  if (!session) {
    throw new UnauthorizedError("Autenticação necessária");
  }
  return session;
}

/**
 * Require specific role or higher
 */
export function requireRole(session: Session | null, role: UserRole): Session {
  const validSession = requireAuth(session);

  if (!hasRole(validSession.user.role, role)) {
    throw new ForbiddenError(`Requer permissão: ${role}`);
  }

  return validSession;
}

/**
 * Require admin role
 */
export function requireAdmin(session: Session | null): Session {
  return requireRole(session, UserRole.ADMIN);
}

/**
 * Require manager role or higher
 */
export function requireManager(session: Session | null): Session {
  return requireRole(session, UserRole.MANAGER);
}

