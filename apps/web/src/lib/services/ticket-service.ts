import { prisma } from "@ogp/database";
import { CreateTicketInput } from "@ogp/types";

/**
 * Service for ticket management
 */

export async function createTicket(
  userId: string,
  municipalityId: string,
  input: CreateTicketInput
): Promise<any> {
  // Create ticket
  const ticket = await prisma.ticket.create({
    data: {
      municipalityId,
      incidentId: input.incidentId || null,
      categoryId: input.categoryId,
      title: input.title,
      description: input.description,
      status: "NEW",
      priority: input.priority,
      createdByUserId: userId,
      assignedToUserId: input.assignedToUserId || null,
      publicVisibility: input.publicVisibility || "INTERNAL",
      sla: input.sla || null,
    },
    include: {
      incident: true,
      category: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // If ticket is linked to an incident, update incident status
  if (input.incidentId) {
    await prisma.incidentEvent.update({
      where: { id: input.incidentId },
      data: {
        status: "TICKETED",
        ticketId: ticket.id,
      },
    });
  }

  // Create initial audit log entry
  await prisma.auditLog.create({
    data: {
      municipalityId,
      actorUserId: userId,
      entityType: "Ticket",
      entityId: ticket.id,
      action: "CREATE",
      metadata: {
        ticketTitle: ticket.title,
        priority: ticket.priority,
        incidentId: input.incidentId,
      },
    },
  });

  return ticket;
}

export async function updateTicket(
  ticketId: string,
  userId: string,
  municipalityId: string,
  updates: {
    status?: string;
    priority?: string;
    assignedToUserId?: string;
    title?: string;
    description?: string;
  }
): Promise<any> {
  // Update ticket
  const ticket = await prisma.ticket.update({
    where: {
      id: ticketId,
      municipalityId,
    },
    data: updates,
    include: {
      incident: true,
      category: true,
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Create audit log entry
  await prisma.auditLog.create({
    data: {
      municipalityId,
      actorUserId: userId,
      entityType: "Ticket",
      entityId: ticketId,
      action: "UPDATE",
      metadata: updates,
    },
  });

  return ticket;
}

export async function addTicketUpdate(
  ticketId: string,
  userId: string,
  municipalityId: string,
  message: string,
  visibility: "PUBLIC" | "INTERNAL",
  attachments?: any[]
): Promise<any> {
  // Verify ticket exists and belongs to municipality
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId, municipalityId },
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  // Create update
  const update = await prisma.ticketUpdate.create({
    data: {
      ticketId,
      authorUserId: userId,
      visibility,
      message,
      attachments: attachments || [],
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      municipalityId,
      actorUserId: userId,
      entityType: "TicketUpdate",
      entityId: update.id,
      action: "CREATE",
      metadata: {
        ticketId,
        visibility,
      },
    },
  });

  return update;
}

