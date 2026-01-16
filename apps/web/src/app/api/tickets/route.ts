import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireManager } from "@/lib/auth/rbac";
import { CreateTicketSchema } from "@ogp/types";
import { createTicket } from "@/lib/services/ticket-service";
import { successResponse, handleApiError } from "@/lib/api/error-handler";
import { prisma } from "@ogp/database";

/**
 * GET /api/tickets
 * List tickets with filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireManager(session);

    const searchParams = request.nextUrl.searchParams;
    const municipalityId = session!.user.municipalityId;

    // Parse query parameters
    const categoryId = searchParams.get("categoryId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assignedToUserId = searchParams.get("assignedToUserId");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const where: any = {
      municipalityId,
    };

    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedToUserId) where.assignedToUserId = assignedToUserId;

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          category: true,
          incident: {
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
              image: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          updates: {
            take: 1,
            orderBy: {
              createdAt: "desc",
            },
          },
        },
        orderBy: [
          { priority: "desc" },
          { createdAt: "desc" },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.ticket.count({ where }),
    ]);

    return successResponse({
      items: tickets,
      total,
      page,
      pageSize,
      hasMore: total > page * pageSize,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/tickets
 * Create a new ticket
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireManager(session);

    const body = await request.json();
    const input = CreateTicketSchema.parse(body);

    const ticket = await createTicket(
      session!.user.id,
      session!.user.municipalityId,
      input
    );

    return successResponse(ticket, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

