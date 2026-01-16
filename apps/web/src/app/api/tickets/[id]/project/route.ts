import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { createProjectFromTicket } from "@/lib/services/project-service";
import { handleApiError } from "@/lib/api/error-handler";
import { prisma } from "@ogp/database";

/**
 * POST /api/tickets/:ticketId/project
 * Create a project from a ticket (Admin only)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.title || !body.description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    const project = await createProjectFromTicket(
      {
        ticketId: params.id,
        title: body.title,
        description: body.description,
        categoryId: body.categoryId,
        budgetAmount: body.budgetAmount,
        budgetCurrency: body.budgetCurrency,
        fundingSource: body.fundingSource,
        biddingReference: body.biddingReference,
      },
      session.user.id
    );

    // Log audit
    await prisma.auditLog.create({
      data: {
        municipalityId: session.user.municipalityId,
        actorUserId: session.user.id,
        entityType: "Project",
        entityId: project.id,
        action: "PROJECT_CREATED",
        metadata: {
          title: project.title,
          ticketId: params.id,
        },
      },
    });

    return NextResponse.json(
      {
        data: project,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

