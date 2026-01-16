import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { requireAdmin } from "@/lib/auth/rbac";
import { createChannel, getChannelsByMunicipality } from "@/lib/services/channel-service";
import { handleApiError } from "@/lib/api/error-handler";
import { prisma } from "@ogp/database";

/**
 * GET /api/admin/channels
 * Get all channels for the municipality (Admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    requireAdmin(session);

    const channels = await prisma.officialChannel.findMany({
      where: {
        municipalityId: session.user.municipalityId,
      },
      include: {
        _count: {
          select: {
            posts: {
              where: {
                deletedAt: null,
              },
            },
            permissions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      data: channels,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/admin/channels
 * Create a new official channel (Admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    requireAdmin(session);

    const body = await req.json();

    // Validate input
    if (!body.name || !body.title) {
      return NextResponse.json(
        { error: "Name and title are required" },
        { status: 400 }
      );
    }

    // Create the channel
    const channel = await createChannel({
      municipalityId: session.user.municipalityId,
      name: body.name,
      title: body.title,
      avatarUrl: body.avatarUrl,
      bio: body.bio,
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        municipalityId: session.user.municipalityId,
        actorUserId: session.user.id,
        entityType: "OfficialChannel",
        entityId: channel.id,
        action: "CHANNEL_CREATED",
        metadata: {
          name: channel.name,
          title: channel.title,
        },
      },
    });

    return NextResponse.json(
      {
        data: channel,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

