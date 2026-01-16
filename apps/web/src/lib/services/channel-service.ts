/**
 * Channel Service
 * Business logic for official channels and posts
 */

import { prisma } from "@ogp/database";
import type { User } from "next-auth";

export interface CreatePostInput {
  channelId: string;
  authorUserId: string;
  title: string;
  body: string;
  attachments?: Array<{ url: string; type: string; uploadedAt: Date }>;
  visibility?: "PUBLIC" | "DRAFT";
}

export interface UpdatePostInput {
  title?: string;
  body?: string;
  attachments?: Array<{ url: string; type: string; uploadedAt: Date }>;
  visibility?: "PUBLIC" | "DRAFT";
}

/**
 * Check if a user can post to a specific channel
 */
export async function canPostToChannel(
  userId: string,
  channelId: string,
  municipalityId: string
): Promise<boolean> {
  // Check if user is an admin for the municipality
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, municipalityId: true },
  });

  if (!user || user.municipalityId !== municipalityId) {
    return false;
  }

  // Admins can post to any channel in their municipality
  if (user.role === "ADMIN") {
    return true;
  }

  // Check if user has explicit permission
  const permission = await prisma.channelPermission.findUnique({
    where: {
      channelId_userId: {
        channelId,
        userId,
      },
    },
  });

  return !!permission;
}

/**
 * Get all channels for a municipality
 */
export async function getChannelsByMunicipality(municipalityId: string) {
  return prisma.officialChannel.findMany({
    where: {
      municipalityId,
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Get a single channel by ID
 */
export async function getChannelById(channelId: string) {
  return prisma.officialChannel.findUnique({
    where: { id: channelId },
  });
}

/**
 * Get posts for a channel with pagination
 */
export async function getChannelPosts(
  channelId: string,
  options: {
    cursor?: string;
    limit?: number;
  } = {}
) {
  const limit = Math.min(options.limit || 20, 50);

  const posts = await prisma.channelPost.findMany({
    where: {
      channelId,
      visibility: "PUBLIC",
      deletedAt: null,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      channel: {
        select: {
          id: true,
          name: true,
          title: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      publishedAt: "desc",
    },
    take: limit + 1,
    ...(options.cursor && {
      cursor: {
        id: options.cursor,
      },
      skip: 1,
    }),
  });

  const hasMore = posts.length > limit;
  const items = hasMore ? posts.slice(0, -1) : posts;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return {
    items,
    nextCursor,
    hasMore,
  };
}

/**
 * Create a new channel post
 */
export async function createChannelPost(input: CreatePostInput) {
  return prisma.channelPost.create({
    data: {
      channelId: input.channelId,
      authorUserId: input.authorUserId,
      municipalityId: (await getChannelById(input.channelId))!.municipalityId,
      title: input.title,
      body: input.body,
      attachments: input.attachments || [],
      visibility: input.visibility || "PUBLIC",
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      channel: {
        select: {
          id: true,
          name: true,
          title: true,
        },
      },
    },
  });
}

/**
 * Update a channel post
 */
export async function updateChannelPost(postId: string, input: UpdatePostInput) {
  return prisma.channelPost.update({
    where: { id: postId },
    data: input,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      channel: {
        select: {
          id: true,
          name: true,
          title: true,
        },
      },
    },
  });
}

/**
 * Soft delete a channel post
 */
export async function deleteChannelPost(postId: string) {
  return prisma.channelPost.update({
    where: { id: postId },
    data: {
      deletedAt: new Date(),
    },
  });
}

/**
 * Check if a user can edit/delete a post
 * Only the author or admin can edit/delete
 */
export async function canManagePost(
  userId: string,
  postId: string
): Promise<boolean> {
  const post = await prisma.channelPost.findUnique({
    where: { id: postId },
    include: {
      author: {
        select: {
          id: true,
          role: true,
        },
      },
    },
  });

  if (!post) {
    return false;
  }

  // Author can manage their own post
  if (post.authorUserId === userId) {
    return true;
  }

  // Admin can manage any post in their municipality
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, municipalityId: true },
  });

  return (
    user?.role === "ADMIN" && user.municipalityId === post.municipalityId
  );
}

/**
 * Get channels where a user has posting permissions
 */
export async function getUserChannels(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, municipalityId: true },
  });

  if (!user) {
    return [];
  }

  // If admin, return all active channels in their municipality
  if (user.role === "ADMIN") {
    return prisma.officialChannel.findMany({
      where: {
        municipalityId: user.municipalityId,
        isActive: true,
      },
    });
  }

  // Otherwise, return channels they have explicit permission for
  const permissions = await prisma.channelPermission.findMany({
    where: { userId },
    include: {
      channel: true,
    },
  });

  return permissions
    .filter((p) => p.channel.isActive)
    .map((p) => p.channel);
}

/**
 * Admin: Create a new official channel
 */
export async function createChannel(data: {
  municipalityId: string;
  name: string;
  title: string;
  avatarUrl?: string;
  bio?: string;
}) {
  return prisma.officialChannel.create({
    data,
  });
}

/**
 * Admin: Update a channel
 */
export async function updateChannel(
  channelId: string,
  data: {
    name?: string;
    title?: string;
    avatarUrl?: string;
    bio?: string;
    isActive?: boolean;
  }
) {
  return prisma.officialChannel.update({
    where: { id: channelId },
    data,
  });
}

/**
 * Admin: Grant posting permission to a user
 */
export async function grantChannelPermission(
  channelId: string,
  userId: string,
  grantedByUserId: string
) {
  const channel = await getChannelById(channelId);
  if (!channel) {
    throw new Error("Channel not found");
  }

  return prisma.channelPermission.create({
    data: {
      channelId,
      userId,
      municipalityId: channel.municipalityId,
      roleGrantedByUserId: grantedByUserId,
    },
  });
}

/**
 * Admin: Revoke posting permission from a user
 */
export async function revokeChannelPermission(channelId: string, userId: string) {
  return prisma.channelPermission.delete({
    where: {
      channelId_userId: {
        channelId,
        userId,
      },
    },
  });
}

/**
 * Get channel permissions for a specific channel
 */
export async function getChannelPermissions(channelId: string) {
  return prisma.channelPermission.findMany({
    where: { channelId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

