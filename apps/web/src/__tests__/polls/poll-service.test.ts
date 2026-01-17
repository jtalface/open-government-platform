import { describe, it, expect, beforeEach, vi } from "vitest";
import { PollStatus, PollChoice, UserRole } from "@ogp/database";
import {
  canManagePolls,
  canManagePoll,
  canViewPollResults,
  createPoll,
  castVote,
  activatePoll,
  closePoll,
} from "@/lib/services/poll-service";
import type { User } from "next-auth";

// Mock Prisma client
vi.mock("@ogp/database", () => ({
  prisma: {
    poll: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    pollVote: {
      create: vi.fn(),
      findUnique: vi.fn(),
      groupBy: vi.fn(),
    },
  },
  PollStatus: {
    DRAFT: "DRAFT",
    ACTIVE: "ACTIVE",
    CLOSED: "CLOSED",
    ARCHIVED: "ARCHIVED",
  },
  PollChoice: {
    A: "A",
    B: "B",
  },
  UserRole: {
    CITIZEN: "CITIZEN",
    MANAGER: "MANAGER",
    ADMIN: "ADMIN",
  },
  AuditAction: {
    POLL_CREATED: "POLL_CREATED",
    POLL_ACTIVATED: "POLL_ACTIVATED",
    POLL_CLOSED: "POLL_CLOSED",
    POLL_VOTED: "POLL_VOTED",
  },
}));

// Mock audit service
vi.mock("@/lib/services/audit-service", () => ({
  createAuditLog: vi.fn(),
}));

describe("Poll Service - RBAC", () => {
  const citizen: User = {
    id: "citizen-1",
    email: "citizen@test.com",
    name: "Citizen User",
    role: UserRole.CITIZEN,
    municipalityId: "muni-1",
  };

  const manager: User = {
    id: "manager-1",
    email: "manager@test.com",
    name: "Manager User",
    role: UserRole.MANAGER,
    municipalityId: "muni-1",
  };

  const admin: User = {
    id: "admin-1",
    email: "admin@test.com",
    name: "Admin User",
    role: UserRole.ADMIN,
    municipalityId: "muni-1",
  };

  const otherManager: User = {
    id: "manager-2",
    email: "manager2@test.com",
    name: "Other Manager",
    role: UserRole.MANAGER,
    municipalityId: "muni-1",
  };

  describe("canManagePolls", () => {
    it("should return false for citizen", () => {
      expect(canManagePolls(citizen)).toBe(false);
    });

    it("should return true for manager", () => {
      expect(canManagePolls(manager)).toBe(true);
    });

    it("should return true for admin", () => {
      expect(canManagePolls(admin)).toBe(true);
    });
  });

  describe("canManagePoll", () => {
    const pollByManager = {
      createdByUserId: "manager-1",
      municipalityId: "muni-1",
    };

    it("should return false for citizen", () => {
      expect(canManagePoll(citizen, pollByManager)).toBe(false);
    });

    it("should return true for manager who created the poll", () => {
      expect(canManagePoll(manager, pollByManager)).toBe(true);
    });

    it("should return false for different manager", () => {
      expect(canManagePoll(otherManager, pollByManager)).toBe(false);
    });

    it("should return true for admin in same municipality", () => {
      expect(canManagePoll(admin, pollByManager)).toBe(true);
    });

    it("should return false for admin in different municipality", () => {
      const adminDifferentMuni: User = {
        ...admin,
        municipalityId: "muni-2",
      };
      expect(canManagePoll(adminDifferentMuni, pollByManager)).toBe(false);
    });
  });

  describe("canViewPollResults", () => {
    const pollByManager = {
      createdByUserId: "manager-1",
      municipalityId: "muni-1",
    };

    it("should return false for citizen", () => {
      expect(canViewPollResults(citizen, pollByManager)).toBe(false);
    });

    it("should return true for poll creator", () => {
      expect(canViewPollResults(manager, pollByManager)).toBe(true);
    });

    it("should return false for different manager", () => {
      expect(canViewPollResults(otherManager, pollByManager)).toBe(false);
    });

    it("should return true for admin in same municipality", () => {
      expect(canViewPollResults(admin, pollByManager)).toBe(true);
    });
  });
});

describe("Poll Service - Business Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const manager: User = {
    id: "manager-1",
    email: "manager@test.com",
    name: "Manager User",
    role: UserRole.MANAGER,
    municipalityId: "muni-1",
  };

  const citizen: User = {
    id: "citizen-1",
    email: "citizen@test.com",
    name: "Citizen User",
    role: UserRole.CITIZEN,
    municipalityId: "muni-1",
  };

  describe("createPoll", () => {
    it("should throw error if citizen tries to create poll", async () => {
      await expect(
        createPoll(citizen, {
          title: "Test Poll",
          optionA: "Yes",
          optionB: "No",
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should allow manager to create poll", async () => {
      const { prisma } = await import("@ogp/database");
      const mockPoll = {
        id: "poll-1",
        title: "Test Poll",
        optionA: "Yes",
        optionB: "No",
        status: PollStatus.DRAFT,
        municipalityId: "muni-1",
        createdByUserId: "manager-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.poll.findFirst as any).mockResolvedValue(null);
      (prisma.poll.create as any).mockResolvedValue(mockPoll);

      const result = await createPoll(manager, {
        title: "Test Poll",
        optionA: "Yes",
        optionB: "No",
      });

      expect(result).toEqual(mockPoll);
      expect(prisma.poll.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: "Test Poll",
            optionA: "Yes",
            optionB: "No",
            municipalityId: "muni-1",
            createdByUserId: "manager-1",
          }),
        })
      );
    });
  });

  describe("castVote", () => {
    const mockPoll = {
      id: "poll-1",
      municipalityId: "muni-1",
      status: PollStatus.ACTIVE,
      startsAt: new Date(Date.now() - 1000),
      endsAt: null,
    };

    it("should allow citizen to vote on active poll", async () => {
      const { prisma } = await import("@ogp/database");
      
      (prisma.poll.findUnique as any).mockResolvedValue(mockPoll);
      (prisma.pollVote.findUnique as any).mockResolvedValue(null);
      (prisma.pollVote.create as any).mockResolvedValue({
        id: "vote-1",
        pollId: "poll-1",
        userId: "citizen-1",
        choice: PollChoice.A,
      });

      const result = await castVote(citizen, "poll-1", PollChoice.A);

      expect(result.choice).toBe(PollChoice.A);
      expect(prisma.pollVote.create).toHaveBeenCalled();
    });

    it("should throw error if user already voted", async () => {
      const { prisma } = await import("@ogp/database");
      
      (prisma.poll.findUnique as any).mockResolvedValue(mockPoll);
      (prisma.pollVote.findUnique as any).mockResolvedValue({
        id: "existing-vote",
        pollId: "poll-1",
        userId: "citizen-1",
        choice: PollChoice.B,
      });

      await expect(
        castVote(citizen, "poll-1", PollChoice.A)
      ).rejects.toThrow("already voted");
    });

    it("should throw error if poll is not active", async () => {
      const { prisma } = await import("@ogp/database");
      
      (prisma.poll.findUnique as any).mockResolvedValue({
        ...mockPoll,
        status: PollStatus.CLOSED,
      });

      await expect(
        castVote(citizen, "poll-1", PollChoice.A)
      ).rejects.toThrow("not currently active");
    });

    it("should throw error if voting on poll in different municipality", async () => {
      const { prisma } = await import("@ogp/database");
      
      (prisma.poll.findUnique as any).mockResolvedValue({
        ...mockPoll,
        municipalityId: "muni-2",
      });

      await expect(
        castVote(citizen, "poll-1", PollChoice.A)
      ).rejects.toThrow("only vote on polls in your municipality");
    });
  });

  describe("activatePoll", () => {
    it("should close existing active poll when activating new poll", async () => {
      const { prisma } = await import("@ogp/database");
      
      const existingActivePoll = {
        id: "poll-1",
        status: PollStatus.ACTIVE,
        municipalityId: "muni-1",
        createdByUserId: "manager-1",
      };

      const newPoll = {
        id: "poll-2",
        status: PollStatus.DRAFT,
        municipalityId: "muni-1",
        createdByUserId: "manager-1",
        startsAt: null,
      };

      (prisma.poll.findUnique as any).mockResolvedValue(newPoll);
      (prisma.poll.findFirst as any).mockResolvedValue(existingActivePoll);
      (prisma.poll.update as any).mockResolvedValue({
        ...newPoll,
        status: PollStatus.ACTIVE,
      });

      await activatePoll(manager, "poll-2");

      // Should close the existing active poll
      expect(prisma.poll.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "poll-1" },
          data: expect.objectContaining({
            status: PollStatus.CLOSED,
          }),
        })
      );

      // Should activate the new poll
      expect(prisma.poll.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "poll-2" },
          data: expect.objectContaining({
            status: PollStatus.ACTIVE,
          }),
        })
      );
    });
  });
});

