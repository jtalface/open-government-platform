import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { getUserChannels } from "@/lib/services/channel-service";
import { handleApiError } from "@/lib/api/error-handler";

/**
 * GET /api/my-channels
 * Get channels where the current user has posting permissions
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only managers and admins can post to channels
    if (session.user.role === "CITIZEN") {
      return NextResponse.json({
        data: [],
      });
    }

    const channels = await getUserChannels(session.user.id);

    return NextResponse.json({
      data: channels,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

