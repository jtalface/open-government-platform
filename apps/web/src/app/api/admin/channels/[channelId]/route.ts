import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { requireAdmin } from "@/lib/auth/rbac";
import { updateChannel, getChannelById } from "@/lib/services/channel-service";
import { handleApiError } from "@/lib/api/error-handler";
import { prisma } from "@ogp/database";

/**
 * PATCH /api/admin/channels/:channelId
 * Update a channel (Admin only)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    requireAdmin(session);

    const { channelId } = params;
    const body = await req.json();

    // Verify channel belongs to admin's municipality
    const channel = await getChannelById(channelId);
    if (!channel || channel.municipalityId !== session.user.municipalityId) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // Update the channel
    const updatedChannel = await updateChannel(channelId, {
      name: body.name,
      title: body.title,
      avatarUrl: body.avatarUrl,
      bio: body.bio,
      isActive: body.isActive,
    });

    // Log audit
    const action = body.isActive === false ? "CHANNEL_DEACTIVATED" : "CHANNEL_UPDATED";
    await prisma.auditLog.create({
      data: {
        municipalityId: session.user.municipalityId,
        actorUserId: session.user.id,
        entityType: "OfficialChannel",
        entityId: channelId,
        action,
        metadata: {
          name: updatedChannel.name,
          title: updatedChannel.title,
          isActive: updatedChannel.isActive,
        },
      },
    });

    return NextResponse.json({
      data: updatedChannel,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

