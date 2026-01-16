import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { transitionProjectStatus } from "@/lib/services/project-service";
import { handleApiError } from "@/lib/api/error-handler";
import { prisma } from "@ogp/database";

/**
 * POST /api/projects/:projectId/status
 * Change project status (Admin only)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const project = await transitionProjectStatus(
      params.projectId,
      body.status,
      session.user.id
    );

    // Log audit
    await prisma.auditLog.create({
      data: {
        municipalityId: session.user.municipalityId,
        actorUserId: session.user.id,
        entityType: "Project",
        entityId: project.id,
        action: "PROJECT_STATUS_CHANGED",
        metadata: {
          title: project.title,
          newStatus: body.status,
        },
      },
    });

    return NextResponse.json({
      data: project,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

