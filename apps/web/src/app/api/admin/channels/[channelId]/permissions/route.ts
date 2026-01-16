import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { requireAdmin } from "@/lib/auth/rbac";
import {
  grantChannelPermission,
  revokeChannelPermission,
  getChannelPermissions,
  getChannelById,
} from "@/lib/services/channel-service";
import { handleApiError } from "@/lib/api/error-handler";
import { prisma } from "@ogp/database";

/**
 * GET /api/admin/channels/:channelId/permissions
 * Get all permissions for a channel (Admin only)
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

    requireAdmin(session);

    const { channelId } = params;

    // Verify channel belongs to admin's municipality
    const channel = await getChannelById(channelId);
    if (!channel || channel.municipalityId !== session.user.municipalityId) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const permissions = await getChannelPermissions(channelId);

    return NextResponse.json({
      data: permissions,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/admin/channels/:channelId/permissions
 * Grant posting permission to a user (Admin only)
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

    requireAdmin(session);

    const { channelId } = params;
    const body = await req.json();

    if (!body.userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Verify channel belongs to admin's municipality
    const channel = await getChannelById(channelId);
    if (!channel || channel.municipalityId !== session.user.municipalityId) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // Verify user belongs to same municipality
    const user = await prisma.user.findUnique({
      where: { id: body.userId },
      select: { municipalityId: true, name: true, email: true },
    });

    if (!user || user.municipalityId !== session.user.municipalityId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Grant permission
    const permission = await grantChannelPermission(
      channelId,
      body.userId,
      session.user.id
    );

    // Log audit
    await prisma.auditLog.create({
      data: {
        municipalityId: session.user.municipalityId,
        actorUserId: session.user.id,
        entityType: "ChannelPermission",
        entityId: permission.id,
        action: "CHANNEL_PERMISSION_GRANTED",
        metadata: {
          channelId,
          userId: body.userId,
          userName: user.name,
          userEmail: user.email,
        },
      },
    });

    return NextResponse.json(
      {
        data: permission,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/admin/channels/:channelId/permissions/:userId
 * Revoke posting permission from a user (Admin only)
 */
export async function DELETE(
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
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Verify channel belongs to admin's municipality
    const channel = await getChannelById(channelId);
    if (!channel || channel.municipalityId !== session.user.municipalityId) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // Revoke permission
    await revokeChannelPermission(channelId, userId);

    // Log audit
    await prisma.auditLog.create({
      data: {
        municipalityId: session.user.municipalityId,
        actorUserId: session.user.id,
        entityType: "ChannelPermission",
        entityId: `${channelId}-${userId}`,
        action: "CHANNEL_PERMISSION_REVOKED",
        metadata: {
          channelId,
          userId,
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

