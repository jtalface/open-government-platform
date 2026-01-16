import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import {
  updateChannelPost,
  deleteChannelPost,
  canManagePost,
} from "@/lib/services/channel-service";
import { handleApiError } from "@/lib/api/error-handler";
import { prisma } from "@ogp/database";

/**
 * PATCH /api/channel-posts/:postId
 * Update a channel post (Author or Admin only)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = params;
    const body = await req.json();

    // Check if user can manage this post
    const hasPermission = await canManagePost(session.user.id, postId);

    if (!hasPermission) {
      return NextResponse.json(
        { error: "You don't have permission to edit this post" },
        { status: 403 }
      );
    }

    // Update the post
    const post = await updateChannelPost(postId, {
      title: body.title,
      body: body.body,
      attachments: body.attachments,
      visibility: body.visibility,
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        municipalityId: session.user.municipalityId,
        actorUserId: session.user.id,
        entityType: "ChannelPost",
        entityId: postId,
        action: "CHANNEL_POST_UPDATED",
        metadata: {
          channelId: post.channelId,
          title: post.title,
        },
      },
    });

    return NextResponse.json({
      data: post,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/channel-posts/:postId
 * Delete a channel post (Author or Admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = params;

    // Check if user can manage this post
    const hasPermission = await canManagePost(session.user.id, postId);

    if (!hasPermission) {
      return NextResponse.json(
        { error: "You don't have permission to delete this post" },
        { status: 403 }
      );
    }

    // Get post info before deleting for audit
    const post = await prisma.channelPost.findUnique({
      where: { id: postId },
      select: { channelId: true, title: true },
    });

    // Soft delete the post
    await deleteChannelPost(postId);

    // Log audit
    await prisma.auditLog.create({
      data: {
        municipalityId: session.user.municipalityId,
        actorUserId: session.user.id,
        entityType: "ChannelPost",
        entityId: postId,
        action: "CHANNEL_POST_DELETED",
        metadata: {
          channelId: post?.channelId,
          title: post?.title,
        },
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

