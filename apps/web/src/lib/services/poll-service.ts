import { prisma } from "@ogp/database";
import { PollStatus, PollChoice, UserRole, AuditAction } from "@ogp/database";
import { createAuditLog } from "./audit-service";
import type { User } from "next-auth";

// ====================
// RBAC HELPERS
// ====================

/**
 * Check if a user can manage polls (create/edit)
 */
export function canManagePolls(user: User): boolean {
  return user.role === UserRole.MANAGER || user.role === UserRole.ADMIN;
}

/**
 * Check if a user can manage a specific poll (edit/close)
 */
export function canManagePoll(user: User, poll: { createdByUserId: string; municipalityId: string }): boolean {
  // Admin can manage any poll in their municipality
  if (user.role === UserRole.ADMIN && user.municipalityId === poll.municipalityId) {
    return true;
  }

  // Manager can only manage polls they created
  if (user.role === UserRole.MANAGER && user.id === poll.createdByUserId) {
    return true;
  }

  return false;
}

/**
 * Check if a user can view poll results
 */
export function canViewPollResults(user: User, poll: { createdByUserId: string; municipalityId: string }): boolean {
  // Admin can view all results in their municipality
  if (user.role === UserRole.ADMIN && user.municipalityId === poll.municipalityId) {
    return true;
  }

  // Poll creator can view their own poll results
  if (user.id === poll.createdByUserId) {
    return true;
  }

  return false;
}

// ====================
// POLL QUERIES
// ====================

/**
 * Get the currently active poll for a municipality
 */
export async function getActivePoll(municipalityId: string) {
  const now = new Date();

  const poll = await prisma.poll.findFirst({
    where: {
      municipalityId,
      status: PollStatus.ACTIVE,
      OR: [
        // No end date set
        { endsAt: null },
        // End date is in the future
        { endsAt: { gte: now } },
      ],
      OR: [
        // No start date set
        { startsAt: null },
        // Start date is in the past
        { startsAt: { lte: now } },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return poll;
}

/**
 * Get user's vote for a poll (if any)
 */
export async function getUserPollVote(pollId: string, userId: string) {
  return await prisma.pollVote.findUnique({
    where: {
      pollId_userId: {
        pollId,
        userId,
      },
    },
  });
}

/**
 * Get all polls for a municipality (with optional filters)
 */
export async function getPolls(
  municipalityId: string,
  filters: {
    status?: PollStatus;
    createdByUserId?: string;
  } = {},
) {
  const where: any = {
    municipalityId,
  };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.createdByUserId) {
    where.createdByUserId = filters.createdByUserId;
  }

  return await prisma.poll.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          votes: true,
        },
      },
    },
  });
}

/**
 * Get poll by ID
 */
export async function getPollById(pollId: string) {
  return await prisma.poll.findUnique({
    where: {
      id: pollId,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
      closedBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Get poll results (aggregated vote counts)
 */
export async function getPollResults(pollId: string) {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
  });

  if (!poll) {
    throw new Error("Poll not found");
  }

  const votes = await prisma.pollVote.groupBy({
    by: ["choice"],
    where: {
      pollId,
    },
    _count: {
      choice: true,
    },
  });

  const totalVotes = votes.reduce((sum, v) => sum + v._count.choice, 0);

  const optionAVotes = votes.find((v) => v.choice === PollChoice.A)?._count.choice || 0;
  const optionBVotes = votes.find((v) => v.choice === PollChoice.B)?._count.choice || 0;

  return {
    pollId: poll.id,
    title: poll.title,
    optionA: {
      label: poll.optionA,
      count: optionAVotes,
      percent: totalVotes > 0 ? Math.round((optionAVotes / totalVotes) * 100) : 0,
    },
    optionB: {
      label: poll.optionB,
      count: optionBVotes,
      percent: totalVotes > 0 ? Math.round((optionBVotes / totalVotes) * 100) : 0,
    },
    totalVotes,
  };
}

// ====================
// POLL MUTATIONS
// ====================

/**
 * Create a new poll
 * Enforces single active poll rule: if creating an ACTIVE poll, closes any existing active poll
 */
export async function createPoll(
  user: User,
  data: {
    title: string;
    optionA: string;
    optionB: string;
    status?: PollStatus;
    startsAt?: Date;
    endsAt?: Date;
  },
) {
  if (!canManagePolls(user)) {
    throw new Error("Unauthorized: Only managers and admins can create polls");
  }

  // If creating an ACTIVE poll, close any existing active poll in the municipality
  if (data.status === PollStatus.ACTIVE) {
    const existingActivePoll = await getActivePoll(user.municipalityId);
    if (existingActivePoll) {
      await closePoll(user, existingActivePoll.id);
    }
  }

  const poll = await prisma.poll.create({
    data: {
      municipalityId: user.municipalityId,
      createdByUserId: user.id,
      title: data.title,
      optionA: data.optionA,
      optionB: data.optionB,
      status: data.status || PollStatus.DRAFT,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
    },
  });

  // Create audit log
  await createAuditLog({
    action: AuditAction.POLL_CREATED,
    userId: user.id,
    municipalityId: user.municipalityId,
    resourceType: "Poll",
    resourceId: poll.id,
    details: {
      title: poll.title,
      status: poll.status,
    },
  });

  return poll;
}

/**
 * Update a poll (only allowed in DRAFT status or by Admin)
 */
export async function updatePoll(
  user: User,
  pollId: string,
  data: {
    title?: string;
    optionA?: string;
    optionB?: string;
    startsAt?: Date;
    endsAt?: Date;
  },
) {
  const poll = await getPollById(pollId);

  if (!poll) {
    throw new Error("Poll not found");
  }

  if (!canManagePoll(user, poll)) {
    throw new Error("Unauthorized: You can only edit your own polls");
  }

  // Only allow editing DRAFT polls (or admin override)
  if (poll.status !== PollStatus.DRAFT && user.role !== UserRole.ADMIN) {
    throw new Error("Cannot edit poll that is not in DRAFT status");
  }

  const updatedPoll = await prisma.poll.update({
    where: { id: pollId },
    data,
  });

  // Create audit log
  await createAuditLog({
    action: AuditAction.POLL_UPDATED,
    userId: user.id,
    municipalityId: user.municipalityId,
    resourceType: "Poll",
    resourceId: pollId,
    details: data,
  });

  return updatedPoll;
}

/**
 * Activate a poll (change status from DRAFT to ACTIVE)
 * Enforces single active poll rule
 */
export async function activatePoll(user: User, pollId: string) {
  const poll = await getPollById(pollId);

  if (!poll) {
    throw new Error("Poll not found");
  }

  if (!canManagePoll(user, poll)) {
    throw new Error("Unauthorized: You can only activate your own polls");
  }

  // Close any existing active poll
  const existingActivePoll = await getActivePoll(user.municipalityId);
  if (existingActivePoll && existingActivePoll.id !== pollId) {
    await closePoll(user, existingActivePoll.id);
  }

  const activatedPoll = await prisma.poll.update({
    where: { id: pollId },
    data: {
      status: PollStatus.ACTIVE,
      startsAt: poll.startsAt || new Date(),
    },
  });

  // Create audit log
  await createAuditLog({
    action: AuditAction.POLL_ACTIVATED,
    userId: user.id,
    municipalityId: user.municipalityId,
    resourceType: "Poll",
    resourceId: pollId,
  });

  return activatedPoll;
}

/**
 * Close a poll
 */
export async function closePoll(user: User, pollId: string) {
  const poll = await getPollById(pollId);

  if (!poll) {
    throw new Error("Poll not found");
  }

  if (!canManagePoll(user, poll)) {
    throw new Error("Unauthorized: You can only close your own polls");
  }

  const closedPoll = await prisma.poll.update({
    where: { id: pollId },
    data: {
      status: PollStatus.CLOSED,
      closedAt: new Date(),
      closedByUserId: user.id,
    },
  });

  // Create audit log
  await createAuditLog({
    action: AuditAction.POLL_CLOSED,
    userId: user.id,
    municipalityId: user.municipalityId,
    resourceType: "Poll",
    resourceId: pollId,
  });

  return closedPoll;
}

/**
 * Archive a poll
 */
export async function archivePoll(user: User, pollId: string) {
  const poll = await getPollById(pollId);

  if (!poll) {
    throw new Error("Poll not found");
  }

  if (!canManagePoll(user, poll)) {
    throw new Error("Unauthorized: You can only archive your own polls");
  }

  const archivedPoll = await prisma.poll.update({
    where: { id: pollId },
    data: {
      status: PollStatus.ARCHIVED,
    },
  });

  // Create audit log
  await createAuditLog({
    action: AuditAction.POLL_ARCHIVED,
    userId: user.id,
    municipalityId: user.municipalityId,
    resourceType: "Poll",
    resourceId: pollId,
  });

  return archivedPoll;
}

/**
 * Cast a vote on a poll
 * Enforces one vote per user per poll
 */
export async function castVote(user: User, pollId: string, choice: PollChoice) {
  const poll = await getPollById(pollId);

  if (!poll) {
    throw new Error("Poll not found");
  }

  // Verify poll is in the user's municipality
  if (poll.municipalityId !== user.municipalityId) {
    throw new Error("You can only vote on polls in your municipality");
  }

  // Verify poll is active
  if (poll.status !== PollStatus.ACTIVE) {
    throw new Error("This poll is not currently active");
  }

  // Check if poll has started
  if (poll.startsAt && poll.startsAt > new Date()) {
    throw new Error("This poll has not started yet");
  }

  // Check if poll has ended
  if (poll.endsAt && poll.endsAt < new Date()) {
    throw new Error("This poll has ended");
  }

  // Check if user has already voted
  const existingVote = await getUserPollVote(pollId, user.id);
  if (existingVote) {
    throw new Error("You have already voted on this poll");
  }

  // Cast vote
  const vote = await prisma.pollVote.create({
    data: {
      municipalityId: user.municipalityId,
      pollId,
      userId: user.id,
      choice,
    },
  });

  // Create audit log (optional - consider privacy)
  await createAuditLog({
    action: AuditAction.POLL_VOTED,
    userId: user.id,
    municipalityId: user.municipalityId,
    resourceType: "Poll",
    resourceId: pollId,
    details: {
      // Don't log the actual choice for privacy
      voted: true,
    },
  });

  return vote;
}

