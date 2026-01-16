import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { getProjectsByMunicipality } from "@/lib/services/project-service";
import { handleApiError } from "@/lib/api/error-handler";

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

