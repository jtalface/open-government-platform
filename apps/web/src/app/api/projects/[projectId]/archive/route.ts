import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { archiveProject, unarchiveProject } from "@/lib/services/project-service";
import { handleApiError } from "@/lib/api/error-handler";
import { prisma } from "@ogp/database";

/**
 * POST /api/projects/:projectId/archive
 * Archive a project (Admin only)
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

    const project = await archiveProject(params.projectId, session.user.id);

    // Log audit
    await prisma.auditLog.create({
      data: {
        municipalityId: session.user.municipalityId,
        actorUserId: session.user.id,
        entityType: "Project",
        entityId: project.id,
        action: "PROJECT_ARCHIVED",
        metadata: {
          title: project.title,
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

/**
 * DELETE /api/projects/:projectId/archive
 * Unarchive a project (Admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await unarchiveProject(params.projectId, session.user.id);

    // Log audit
    await prisma.auditLog.create({
      data: {
        municipalityId: session.user.municipalityId,
        actorUserId: session.user.id,
        entityType: "Project",
        entityId: project.id,
        action: "PROJECT_UNARCHIVED",
        metadata: {
          title: project.title,
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

