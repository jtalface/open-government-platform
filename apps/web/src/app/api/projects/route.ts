import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { getProjectsByMunicipality, createProject } from "@/lib/services/project-service";
import { handleApiError } from "@/lib/api/error-handler";
import { z } from "zod";

// Uses getServerSession (headers/cookies) so it must always run dynamically.
export const dynamic = "force-dynamic";

const CreateProjectSchema = z.object({
  ticketId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(5000),
  categoryId: z.string().uuid(),
  budgetAmount: z.number().positive().optional(),
  budgetCurrency: z.string().optional(),
  fundingSource: z.string().optional(),
  biddingReference: z.string().optional(),
});

/**
 * GET /api/projects
 * List projects for the user's municipality
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status") as any;
    const archived = searchParams.get("archived") === "true";
    const categoryId = searchParams.get("categoryId") || undefined;
    const cursor = searchParams.get("cursor") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20");

    const result = await getProjectsByMunicipality(session.user.municipalityId, {
      status,
      archived,
      categoryId,
      cursor,
      limit,
    });

    return NextResponse.json({
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/projects
 * Create a new project (Admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const input = CreateProjectSchema.parse(body);

    const project = await createProject(
      input,
      session.user.id,
      session.user.municipalityId
    );

    return NextResponse.json({
      success: true,
      data: project,
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
