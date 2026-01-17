import { prisma } from "@ogp/database";
import { AuditAction } from "@ogp/database";

interface CreateAuditLogParams {
  action: AuditAction;
  userId: string;
  municipalityId: string;
  resourceType: string;
  resourceId: string;
  details?: Record<string, any>;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog({
  action,
  userId,
  municipalityId,
  resourceType,
  resourceId,
  details = {},
}: CreateAuditLogParams) {
  return await prisma.auditLog.create({
    data: {
      municipalityId,
      actorUserId: userId,
      entityType: resourceType,
      entityId: resourceId,
      action,
      metadata: details,
    },
  });
}

