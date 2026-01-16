/**
 * Project Service
 * Business logic for municipal projects
 */

import { prisma } from "@ogp/database";
import type { ProjectStatus } from "@prisma/client";

export interface CreateProjectInput {
  ticketId: string;
  title: string;
  description: string;
  categoryId?: string;
  budgetAmount?: number;
  budgetCurrency?: string;
  fundingSource?: string;
  biddingReference?: string;
}

export interface UpdateProjectInput {
  title?: string;
  description?: string;
  categoryId?: string;
  budgetAmount?: number;
  budgetCurrency?: string;
  fundingSource?: string;
  biddingReference?: string;
  assignedToName?: string;
  assignedToId?: string;
}

/**
 * Check if user can create/edit projects (Admin only)
 */
export async function canManageProjects(userId: string, municipalityId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, municipalityId: true },
  });

  if (!user || user.municipalityId !== municipalityId) {
    return false;
  }

  return user.role === "ADMIN";
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
  } = {}
) {
  const limit = Math.min(options.limit || 20, 50);
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
  const items = hasMore ? projects.slice(0, -1) : projects;
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
 * Create a project from a ticket (Admin only)
 */
export async function createProjectFromTicket(
  input: CreateProjectInput,
  adminUserId: string
) {
  // Check if ticket exists and get its details
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

  // Check if project already exists for this ticket
  const existingProject = await prisma.project.findUnique({
    where: { ticketId: input.ticketId },
  });

  if (existingProject) {
    throw new Error("Project already exists for this ticket");
  }

  // Verify admin can manage projects in this municipality
  const canManage = await canManageProjects(adminUserId, ticket.municipalityId);
  if (!canManage) {
    throw new Error("Only admins can create projects");
  }

  // Create the project
  return prisma.project.create({
    data: {
      municipalityId: ticket.municipalityId,
      ticketId: input.ticketId,
      categoryId: input.categoryId || ticket.categoryId,
      title: input.title || ticket.title,
      description: input.description,
      budgetAmount: input.budgetAmount,
      budgetCurrency: input.budgetCurrency,
      fundingSource: input.fundingSource,
      biddingReference: input.biddingReference,
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
    throw new Error("Only admins can update projects");
  }

  return prisma.project.update({
    where: { id: projectId },
    data: input,
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
    throw new Error("Only admins can change project status");
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
    throw new Error("Only admins can archive projects");
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
    throw new Error("Only admins can unarchive projects");
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
 * Create a project update
 */
export async function createProjectUpdate(
  projectId: string,
  message: string,
  authorUserId: string,
  visibility: "PUBLIC" | "INTERNAL" = "PUBLIC"
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { municipalityId: true },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  return prisma.projectUpdate.create({
    data: {
      projectId,
      municipalityId: project.municipalityId,
      authorUserId,
      message,
      visibility,
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

