/**
 * Project Service Tests
 * Tests for project business logic and RBAC
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  canManageProjects,
  createProjectFromTicket,
  updateProject,
  transitionProjectStatus,
  archiveProject,
  unarchiveProject,
} from "@/lib/services/project-service";
import { prisma } from "@ogp/database";

// Mock Prisma
vi.mock("@ogp/database", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    ticket: {
      findUnique: vi.fn(),
    },
    project: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("Project Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("canManageProjects", () => {
    it("should return true for admin in same municipality", async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "admin-1",
        role: "ADMIN",
        municipalityId: "muni-1",
      });

      const result = await canManageProjects("admin-1", "muni-1");
      expect(result).toBe(true);
    });

    it("should return false for manager", async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "manager-1",
        role: "MANAGER",
        municipalityId: "muni-1",
      });

      const result = await canManageProjects("manager-1", "muni-1");
      expect(result).toBe(false);
    });

    it("should return false for citizen", async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "citizen-1",
        role: "CITIZEN",
        municipalityId: "muni-1",
      });

      const result = await canManageProjects("citizen-1", "muni-1");
      expect(result).toBe(false);
    });

    it("should return false for admin in different municipality", async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "admin-1",
        role: "ADMIN",
        municipalityId: "muni-2",
      });

      const result = await canManageProjects("admin-1", "muni-1");
      expect(result).toBe(false);
    });

    it("should return false for non-existent user", async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      const result = await canManageProjects("non-existent", "muni-1");
      expect(result).toBe(false);
    });
  });

  describe("createProjectFromTicket", () => {
    it("should create project for admin", async () => {
      const mockTicket = {
        id: "ticket-1",
        municipalityId: "muni-1",
        categoryId: "cat-1",
        title: "Test Ticket",
      };

      const mockProject = {
        id: "project-1",
        title: "Test Project",
        municipalityId: "muni-1",
      };

      (prisma.ticket.findUnique as any).mockResolvedValue(mockTicket);
      (prisma.project.findUnique as any).mockResolvedValue(null);
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "admin-1",
        role: "ADMIN",
        municipalityId: "muni-1",
      });
      (prisma.project.create as any).mockResolvedValue(mockProject);

      const result = await createProjectFromTicket(
        {
          ticketId: "ticket-1",
          title: "Test Project",
          description: "Test Description",
        },
        "admin-1"
      );

      expect(result).toEqual(mockProject);
    });

    it("should throw error if ticket not found", async () => {
      (prisma.ticket.findUnique as any).mockResolvedValue(null);

      await expect(
        createProjectFromTicket(
          {
            ticketId: "non-existent",
            title: "Test Project",
            description: "Test Description",
          },
          "admin-1"
        )
      ).rejects.toThrow("Ticket not found");
    });

    it("should throw error if project already exists for ticket", async () => {
      const mockTicket = {
        id: "ticket-1",
        municipalityId: "muni-1",
        categoryId: "cat-1",
        title: "Test Ticket",
      };

      (prisma.ticket.findUnique as any).mockResolvedValue(mockTicket);
      (prisma.project.findUnique as any).mockResolvedValue({ id: "existing-project" });

      await expect(
        createProjectFromTicket(
          {
            ticketId: "ticket-1",
            title: "Test Project",
            description: "Test Description",
          },
          "admin-1"
        )
      ).rejects.toThrow("Project already exists for this ticket");
    });

    it("should throw error if user is not admin", async () => {
      const mockTicket = {
        id: "ticket-1",
        municipalityId: "muni-1",
        categoryId: "cat-1",
        title: "Test Ticket",
      };

      (prisma.ticket.findUnique as any).mockResolvedValue(mockTicket);
      (prisma.project.findUnique as any).mockResolvedValue(null);
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "manager-1",
        role: "MANAGER",
        municipalityId: "muni-1",
      });

      await expect(
        createProjectFromTicket(
          {
            ticketId: "ticket-1",
            title: "Test Project",
            description: "Test Description",
          },
          "manager-1"
        )
      ).rejects.toThrow("Only admins can create projects");
    });
  });

  describe("transitionProjectStatus", () => {
    it("should transition status for admin", async () => {
      const mockProject = {
        id: "project-1",
        municipalityId: "muni-1",
        status: "OPEN",
        fundingSource: "Test Fund",
        assignedToName: "Test Contractor",
      };

      (prisma.project.findUnique as any).mockResolvedValue(mockProject);
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "admin-1",
        role: "ADMIN",
        municipalityId: "muni-1",
      });
      (prisma.project.update as any).mockResolvedValue({
        ...mockProject,
        status: "PLANNING",
      });

      const result = await transitionProjectStatus("project-1", "PLANNING" as any, "admin-1");

      expect(result.status).toBe("PLANNING");
    });

    it("should throw error when transitioning to FUNDED without funding source", async () => {
      const mockProject = {
        id: "project-1",
        municipalityId: "muni-1",
        status: "OPEN",
        fundingSource: null,
      };

      (prisma.project.findUnique as any).mockResolvedValue(mockProject);
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "admin-1",
        role: "ADMIN",
        municipalityId: "muni-1",
      });

      await expect(
        transitionProjectStatus("project-1", "FUNDED" as any, "admin-1")
      ).rejects.toThrow("Funding source is required for FUNDED status");
    });

    it("should throw error when transitioning to ASSIGNED without assignedToName", async () => {
      const mockProject = {
        id: "project-1",
        municipalityId: "muni-1",
        status: "BIDDING",
        assignedToName: null,
      };

      (prisma.project.findUnique as any).mockResolvedValue(mockProject);
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "admin-1",
        role: "ADMIN",
        municipalityId: "muni-1",
      });

      await expect(
        transitionProjectStatus("project-1", "ASSIGNED" as any, "admin-1")
      ).rejects.toThrow("Assigned vendor/contractor is required for ASSIGNED status");
    });

    it("should throw error if user is not admin", async () => {
      const mockProject = {
        id: "project-1",
        municipalityId: "muni-1",
        status: "OPEN",
      };

      (prisma.project.findUnique as any).mockResolvedValue(mockProject);
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "manager-1",
        role: "MANAGER",
        municipalityId: "muni-1",
      });

      await expect(
        transitionProjectStatus("project-1", "PLANNING" as any, "manager-1")
      ).rejects.toThrow("Only admins can change project status");
    });
  });

  describe("archiveProject", () => {
    it("should archive project for admin", async () => {
      const mockProject = {
        id: "project-1",
        municipalityId: "muni-1",
        archivedAt: null,
      };

      (prisma.project.findUnique as any).mockResolvedValue(mockProject);
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "admin-1",
        role: "ADMIN",
        municipalityId: "muni-1",
      });
      (prisma.project.update as any).mockResolvedValue({
        ...mockProject,
        archivedAt: new Date(),
        archivedByUserId: "admin-1",
      });

      const result = await archiveProject("project-1", "admin-1");

      expect(result.archivedAt).toBeTruthy();
      expect(result.archivedByUserId).toBe("admin-1");
    });

    it("should throw error if project is already archived", async () => {
      const mockProject = {
        id: "project-1",
        municipalityId: "muni-1",
        archivedAt: new Date(),
      };

      (prisma.project.findUnique as any).mockResolvedValue(mockProject);

      await expect(archiveProject("project-1", "admin-1")).rejects.toThrow(
        "Project is already archived"
      );
    });

    it("should throw error if user is not admin", async () => {
      const mockProject = {
        id: "project-1",
        municipalityId: "muni-1",
        archivedAt: null,
      };

      (prisma.project.findUnique as any).mockResolvedValue(mockProject);
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "manager-1",
        role: "MANAGER",
        municipalityId: "muni-1",
      });

      await expect(archiveProject("project-1", "manager-1")).rejects.toThrow(
        "Only admins can archive projects"
      );
    });
  });

  describe("unarchiveProject", () => {
    it("should unarchive project for admin", async () => {
      const mockProject = {
        id: "project-1",
        municipalityId: "muni-1",
        archivedAt: new Date(),
      };

      (prisma.project.findUnique as any).mockResolvedValue(mockProject);
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "admin-1",
        role: "ADMIN",
        municipalityId: "muni-1",
      });
      (prisma.project.update as any).mockResolvedValue({
        ...mockProject,
        archivedAt: null,
        archivedByUserId: null,
      });

      const result = await unarchiveProject("project-1", "admin-1");

      expect(result.archivedAt).toBeNull();
      expect(result.archivedByUserId).toBeNull();
    });

    it("should throw error if project is not archived", async () => {
      const mockProject = {
        id: "project-1",
        municipalityId: "muni-1",
        archivedAt: null,
      };

      (prisma.project.findUnique as any).mockResolvedValue(mockProject);

      await expect(unarchiveProject("project-1", "admin-1")).rejects.toThrow(
        "Project is not archived"
      );
    });

    it("should throw error if user is not admin", async () => {
      const mockProject = {
        id: "project-1",
        municipalityId: "muni-1",
        archivedAt: new Date(),
      };

      (prisma.project.findUnique as any).mockResolvedValue(mockProject);
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "citizen-1",
        role: "CITIZEN",
        municipalityId: "muni-1",
      });

      await expect(unarchiveProject("project-1", "citizen-1")).rejects.toThrow(
        "Only admins can unarchive projects"
      );
    });
  });
});

