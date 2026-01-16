import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import {
  getChannelPosts,
  createChannelPost,
  canPostToChannel,
  getChannelById,
} from "@/lib/services/channel-service";
import { handleApiError } from "@/lib/api/error-handler";
import { prisma } from "@ogp/database";

/**
 * GET /api/channels/:channelId/posts
 * Get paginated posts for a channel
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { channelId } = params;
    const searchParams = req.nextUrl.searchParams;
    const cursor = searchParams.get("cursor") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20");

    // Verify channel belongs to user's municipality
    const channel = await getChannelById(channelId);
    if (!channel || channel.municipalityId !== session.user.municipalityId) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const result = await getChannelPosts(channelId, { cursor, limit });

    return NextResponse.json({
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/channels/:channelId/posts
 * Create a new post on a channel (Manager/Admin only)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { channelId } = params;
    const body = await req.json();

    // Verify channel exists and belongs to user's municipality
    const channel = await getChannelById(channelId);
    if (!channel || channel.municipalityId !== session.user.municipalityId) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // Check if user has permission to post
    const hasPermission = await canPostToChannel(
      session.user.id,
      channelId,
      session.user.municipalityId
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: "You don't have permission to post to this channel" },
        { status: 403 }
      );
    }

    // Validate input
    if (!body.title || !body.body) {
      return NextResponse.json(
        { error: "Title and body are required" },
        { status: 400 }
      );
    }

    // Create the post
    const post = await createChannelPost({
      channelId,
      authorUserId: session.user.id,
      title: body.title,
      body: body.body,
      attachments: body.attachments || [],
      visibility: body.visibility || "PUBLIC",
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        municipalityId: session.user.municipalityId,
        actorUserId: session.user.id,
        entityType: "ChannelPost",
        entityId: post.id,
        action: "CHANNEL_POST_CREATED",
        metadata: {
          channelId,
          title: post.title,
        },
      },
    });

    return NextResponse.json(
      {
        data: post,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

