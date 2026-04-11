/**
 * Project Service
 * Business logic for municipal projects
 */

import { prisma } from "@ogp/database";
import type { Prisma, ProjectStatus } from "@prisma/client";
import {
  MAX_PROJECT_IMAGES,
  type ProjectImageRef,
  parseStoredImageUrls,
} from "@/lib/projects/media";

export type { ProjectImageRef } from "@/lib/projects/media";
export { MAX_PROJECT_IMAGES } from "@/lib/projects/media";

export interface CreateProjectInput {
  ticketId?: string; // Optional - can create project without ticket
  title: string;
  description: string;
  /** Main description images (max 3) */
  descriptionMedia?: ProjectImageRef[] | unknown;
  categoryId: string;
  budgetAmount?: number;
  budgetCurrency?: string;
  fundingSource?: string;
  biddingReference?: string;
}

export interface UpdateProjectInput {
  title?: string;
  description?: string;
  descriptionMedia?: ProjectImageRef[] | unknown;
  categoryId?: string;
  budgetAmount?: number;
  budgetCurrency?: string;
  fundingSource?: string;
  biddingReference?: string;
  assignedToName?: string;
  assignedToId?: string;
}

/**
 * Normalise and validate image list for projects / project updates.
 */
export function normalizeProjectImageList(raw: unknown): ProjectImageRef[] {
  if (raw == null) return [];
  if (!Array.isArray(raw)) {
    throw new Error("Invalid image list");
  }
  if (raw.length > MAX_PROJECT_IMAGES) {
    throw new Error(`At most ${MAX_PROJECT_IMAGES} images allowed`);
  }
  const out: ProjectImageRef[] = [];
  for (const item of raw) {
    if (typeof item === "string" && item.trim().length > 0) {
      out.push({ url: item.trim() });
      continue;
    }
    if (item && typeof item === "object" && typeof (item as { url?: string }).url === "string") {
      const url = (item as { url: string }).url.trim();
      if (url.length > 0) out.push({ url });
      continue;
    }
    throw new Error("Invalid image entry");
  }
  return out;
}

/**
 * Check if user can create/edit projects (managers and admins in the municipality)
 */
export async function canManageProjects(userId: string, municipalityId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, municipalityId: true },
  });

  if (!user || user.municipalityId !== municipalityId) {
    return false;
  }

  return user.role === "ADMIN" || user.role === "MANAGER";
}

/**
 * Get projects by municipality with filters
 */
export async function getProjectsByMunicipality(
  municipalityId: string,
  options: {
    status?: ProjectStatus;
    archived?: boolean;
    categoryId?: string;
    cursor?: string;
    limit?: number;
    /** Used to decide whether "has updates" counts only public updates (citizens). */
    viewerRole?: string;
  } = {}
) {
  const limit = Math.min(options.limit || 20, 50);
  const isCitizen = options.viewerRole === "CITIZEN";
  const where: any = {
    municipalityId,
  };

  if (options.status) {
    where.status = options.status;
  }

  if (options.archived !== undefined) {
    if (options.archived) {
      where.archivedAt = { not: null };
    } else {
      where.archivedAt = null;
    }
  }

  if (options.categoryId) {
    where.categoryId = options.categoryId;
  }

  const projects = await prisma.project.findMany({
    where,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          icon: true,
          color: true,
        },
      },
      ticket: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
      updates: {
        ...(isCitizen ? { where: { visibility: "PUBLIC" as const } } : {}),
        take: 1,
        select: { id: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit + 1,
    ...(options.cursor && {
      cursor: {
        id: options.cursor,
      },
      skip: 1,
    }),
  });

  const hasMore = projects.length > limit;
  const rawItems = hasMore ? projects.slice(0, -1) : projects;
  const items = rawItems.map((p) => {
    const { updates, descriptionMedia, ...rest } = p;
    return {
      ...rest,
      hasImages: parseStoredImageUrls(descriptionMedia).length > 0,
      hasUpdates: updates.length > 0,
    };
  });
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return {
    items,
    nextCursor,
    hasMore,
  };
}

/**
 * Get a single project by ID
 */
export async function getProjectById(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          icon: true,
          color: true,
        },
      },
      ticket: {
        select: {
          id: true,
          title: true,
          status: true,
          description: true,
          incidentId: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
      updates: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}

/**
 * Create a project (Admin only)
 * Can be created from a ticket or standalone
 */
export async function createProject(
  input: CreateProjectInput,
  adminUserId: string,
  municipalityId: string
) {
  // Verify admin can manage projects in this municipality
  const canManage = await canManageProjects(adminUserId, municipalityId);
  if (!canManage) {
    throw new Error("Only managers and admins can create projects");
  }

  // If ticketId is provided, validate ticket and check for existing project
  if (input.ticketId) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: input.ticketId },
      select: {
        id: true,
        municipalityId: true,
        categoryId: true,
        title: true,
      },
    });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    if (ticket.municipalityId !== municipalityId) {
      throw new Error("Ticket does not belong to this municipality");
    }

    // Check if project already exists for this ticket
    const existingProject = await prisma.project.findUnique({
      where: { ticketId: input.ticketId },
    });

    if (existingProject) {
      throw new Error("Project already exists for this ticket");
    }
  }

  const descriptionMedia = normalizeProjectImageList(input.descriptionMedia) as unknown as Prisma.InputJsonValue;

  // Create the project
  return prisma.project.create({
    data: {
      municipalityId,
      ticketId: input.ticketId || null,
      categoryId: input.categoryId,
      title: input.title,
      description: input.description,
      descriptionMedia,
      budgetAmount: input.budgetAmount || null,
      budgetCurrency: input.budgetCurrency || "MZN",
      fundingSource: input.fundingSource || null,
      biddingReference: input.biddingReference || null,
      createdByUserId: adminUserId,
    },
    include: {
      category: true,
      ticket: true,
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Create a project from a ticket (Admin only)
 * @deprecated Use createProject instead
 */
export async function createProjectFromTicket(
  input: CreateProjectInput,
  adminUserId: string
) {
  if (!input.ticketId) {
    throw new Error("ticketId is required for createProjectFromTicket");
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: input.ticketId },
    select: {
      municipalityId: true,
    },
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  return createProject(input, adminUserId, ticket.municipalityId);
}

/**
 * Update a project (Admin only)
 */
export async function updateProject(
  projectId: string,
  input: UpdateProjectInput,
  adminUserId: string
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { municipalityId: true },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const canManage = await canManageProjects(adminUserId, project.municipalityId);
  if (!canManage) {
    throw new Error("Only managers and admins can update projects");
  }

  const { descriptionMedia, ...rest } = input;
  const data: Prisma.ProjectUpdateInput = { ...rest };
  if (descriptionMedia !== undefined) {
    data.descriptionMedia = normalizeProjectImageList(descriptionMedia) as unknown as Prisma.InputJsonValue;
  }

  return prisma.project.update({
    where: { id: projectId },
    data,
    include: {
      category: true,
      ticket: true,
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Transition project status with validation
 */
export async function transitionProjectStatus(
  projectId: string,
  newStatus: ProjectStatus,
  adminUserId: string
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const canManage = await canManageProjects(adminUserId, project.municipalityId);
  if (!canManage) {
    throw new Error("Only managers and admins can change project status");
  }

  // Validate status transitions
  if (newStatus === "FUNDED" && !project.fundingSource) {
    throw new Error("Funding source is required for FUNDED status");
  }

  if (newStatus === "ASSIGNED" && !project.assignedToName) {
    throw new Error("Assigned vendor/contractor is required for ASSIGNED status");
  }

  // Set timestamps based on status
  const updates: any = { status: newStatus };

  if (newStatus === "WORK_STARTED" && !project.workStartedAt) {
    updates.workStartedAt = new Date();
  }

  if (newStatus === "COMPLETED" && !project.completedAt) {
    updates.completedAt = new Date();
  }

  if (newStatus === "ASSIGNED" && !project.assignedAt) {
    updates.assignedAt = new Date();
  }

  return prisma.project.update({
    where: { id: projectId },
    data: updates,
    include: {
      category: true,
      ticket: true,
    },
  });
}

/**
 * Archive a project (Admin only)
 */
export async function archiveProject(projectId: string, adminUserId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { municipalityId: true, archivedAt: true },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  if (project.archivedAt) {
    throw new Error("Project is already archived");
  }

  const canManage = await canManageProjects(adminUserId, project.municipalityId);
  if (!canManage) {
    throw new Error("Only managers and admins can archive projects");
  }

  return prisma.project.update({
    where: { id: projectId },
    data: {
      archivedAt: new Date(),
      archivedByUserId: adminUserId,
    },
  });
}

/**
 * Unarchive a project (Admin only)
 */
export async function unarchiveProject(projectId: string, adminUserId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { municipalityId: true, archivedAt: true },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  if (!project.archivedAt) {
    throw new Error("Project is not archived");
  }

  const canManage = await canManageProjects(adminUserId, project.municipalityId);
  if (!canManage) {
    throw new Error("Only managers and admins can unarchive projects");
  }

  return prisma.project.update({
    where: { id: projectId },
    data: {
      archivedAt: null,
      archivedByUserId: null,
    },
  });
}

/**
 * Create a project update (append-only timeline entry)
 */
export async function createProjectUpdate(
  projectId: string,
  message: string,
  authorUserId: string,
  visibility: "PUBLIC" | "INTERNAL" = "PUBLIC",
  attachments?: unknown
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { municipalityId: true },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const attachmentJson = normalizeProjectImageList(attachments) as unknown as Prisma.InputJsonValue;

  return prisma.projectUpdate.create({
    data: {
      projectId,
      municipalityId: project.municipalityId,
      authorUserId,
      message,
      visibility,
      attachments: attachmentJson,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export interface UpdateProjectUpdateInput {
  message: string;
  attachments?: unknown;
  visibility: "PUBLIC" | "INTERNAL";
}

/**
 * Edit an existing project update (manager/admin, same municipality).
 */
export async function updateProjectUpdate(
  projectId: string,
  updateId: string,
  userId: string,
  input: UpdateProjectUpdateInput
) {
  const row = await prisma.projectUpdate.findFirst({
    where: { id: updateId, projectId },
    include: {
      project: { select: { municipalityId: true } },
    },
  });

  if (!row) {
    throw new Error("Update not found");
  }

  const canManage = await canManageProjects(userId, row.project.municipalityId);
  if (!canManage) {
    throw new Error("Only managers and admins can edit project updates");
  }

  const attachmentJson = normalizeProjectImageList(
    input.attachments ?? []
  ) as unknown as Prisma.InputJsonValue;

  return prisma.projectUpdate.update({
    where: { id: updateId },
    data: {
      message: input.message,
      visibility: input.visibility,
      attachments: attachmentJson,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Delete a project update (manager/admin, same municipality).
 */
export async function deleteProjectUpdate(projectId: string, updateId: string, userId: string) {
  const row = await prisma.projectUpdate.findFirst({
    where: { id: updateId, projectId },
    include: {
      project: { select: { municipalityId: true } },
    },
  });

  if (!row) {
    throw new Error("Update not found");
  }

  const canManage = await canManageProjects(userId, row.project.municipalityId);
  if (!canManage) {
    throw new Error("Only managers and admins can delete project updates");
  }

  await prisma.projectUpdate.delete({
    where: { id: updateId },
  });

  return { id: updateId, projectId };
}

