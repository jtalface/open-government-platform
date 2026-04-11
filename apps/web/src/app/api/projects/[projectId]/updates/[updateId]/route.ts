import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import {
  canManageProjects,
  deleteProjectUpdate,
  getProjectById,
  updateProjectUpdate,
} from "@/lib/services/project-service";
import { handleApiError } from "@/lib/api/error-handler";
import { prisma } from "@ogp/database";
import { AuditAction } from "@prisma/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

const imageEntry = z.union([z.string().min(1), z.object({ url: z.string().min(1) })]);

const PatchUpdateBodySchema = z.object({
  message: z.string().min(1).max(8000),
  attachments: z.array(imageEntry).max(3).optional(),
  visibility: z.enum(["PUBLIC", "INTERNAL"]),
});

/**
 * PATCH /api/projects/:projectId/updates/:updateId
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string; updateId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await getProjectById(params.projectId);
    if (!project || project.municipalityId !== session.user.municipalityId) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const allowed = await canManageProjects(session.user.id, session.user.municipalityId);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = PatchUpdateBodySchema.parse(body);

    const update = await updateProjectUpdate(
      params.projectId,
      params.updateId,
      session.user.id,
      {
        message: parsed.message,
        visibility: parsed.visibility,
        attachments: parsed.attachments ?? [],
      }
    );

    await prisma.auditLog.create({
      data: {
        municipalityId: session.user.municipalityId,
        actorUserId: session.user.id,
        entityType: "ProjectUpdate",
        entityId: update.id,
        action: AuditAction.PROJECT_UPDATE_UPDATED,
        metadata: {
          projectId: project.id,
          projectTitle: project.title,
        },
      },
    });

    return NextResponse.json({ data: update });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/projects/:projectId/updates/:updateId
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { projectId: string; updateId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await getProjectById(params.projectId);
    if (!project || project.municipalityId !== session.user.municipalityId) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const allowed = await canManageProjects(session.user.id, session.user.municipalityId);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await deleteProjectUpdate(params.projectId, params.updateId, session.user.id);

    await prisma.auditLog.create({
      data: {
        municipalityId: session.user.municipalityId,
        actorUserId: session.user.id,
        entityType: "ProjectUpdate",
        entityId: params.updateId,
        action: AuditAction.PROJECT_UPDATE_DELETED,
        metadata: {
          projectId: project.id,
          projectTitle: project.title,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
