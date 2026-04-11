import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import {
  canManageProjects,
  createProjectUpdate,
  getProjectById,
} from "@/lib/services/project-service";
import { handleApiError } from "@/lib/api/error-handler";
import { prisma } from "@ogp/database";
import { AuditAction } from "@prisma/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

const imageEntry = z.union([z.string().min(1), z.object({ url: z.string().min(1) })]);

const CreateUpdateBodySchema = z.object({
  message: z.string().min(1).max(8000),
  attachments: z.array(imageEntry).max(3).optional(),
  visibility: z.enum(["PUBLIC", "INTERNAL"]).optional(),
});

/**
 * POST /api/projects/:projectId/updates
 * Append a project update (manager or admin).
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

    const project = await getProjectById(params.projectId);
    if (!project || project.municipalityId !== session.user.municipalityId) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const allowed = await canManageProjects(session.user.id, session.user.municipalityId);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = CreateUpdateBodySchema.parse(body);

    const update = await createProjectUpdate(
      params.projectId,
      parsed.message,
      session.user.id,
      parsed.visibility ?? "PUBLIC",
      parsed.attachments ?? []
    );

    await prisma.auditLog.create({
      data: {
        municipalityId: session.user.municipalityId,
        actorUserId: session.user.id,
        entityType: "ProjectUpdate",
        entityId: update.id,
        action: AuditAction.PROJECT_UPDATE_CREATED,
        metadata: {
          projectId: project.id,
          projectTitle: project.title,
          visibility: parsed.visibility ?? "PUBLIC",
        },
      },
    });

    return NextResponse.json({ data: update }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
