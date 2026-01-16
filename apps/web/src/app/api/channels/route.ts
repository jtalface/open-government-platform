import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { getChannelsByMunicipality } from "@/lib/services/channel-service";
import { handleApiError } from "@/lib/api/error-handler";

/**
 * GET /api/channels
 * Get all official channels for the user's municipality
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const channels = await getChannelsByMunicipality(session.user.municipalityId);

    return NextResponse.json({
      data: channels,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

