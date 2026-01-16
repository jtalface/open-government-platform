import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { getProjectById, updateProject, canManageProjects } from "@/lib/services/project-service";
import { handleApiError } from "@/lib/api/error-handler";
import { prisma } from "@ogp/database";

/**
 * GET /api/projects/:projectId
 * Get project details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await getProjectById(params.projectId);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify project belongs to user's municipality
    if (project.municipalityId !== session.user.municipalityId) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Filter updates based on user role
    if (session.user.role === "CITIZEN") {
      project.updates = project.updates.filter((u) => u.visibility === "PUBLIC");
    }

    return NextResponse.json({
      data: project,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/projects/:projectId
 * Update project (Admin only)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const project = await updateProject(params.projectId, body, session.user.id);

    // Log audit
    await prisma.auditLog.create({
      data: {
        municipalityId: session.user.municipalityId,
        actorUserId: session.user.id,
        entityType: "Project",
        entityId: project.id,
        action: "PROJECT_UPDATED",
        metadata: {
          title: project.title,
          changes: body,
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

