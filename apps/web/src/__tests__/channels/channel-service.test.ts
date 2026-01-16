/**
 * Channel Service Tests
 * Tests for channel authorization and business logic
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { prisma } from "@ogp/database";
import {
  canPostToChannel,
  getChannelsByMunicipality,
  createChannelPost,
  canManagePost,
  getUserChannels,
} from "@/lib/services/channel-service";

describe("Channel Service", () => {
  let testMunicipality: any;
  let testChannel: any;
  let adminUser: any;
  let managerUser: any;
  let citizenUser: any;
  let otherMunicipalityUser: any;

  beforeAll(async () => {
    // Create test municipality
    testMunicipality = await prisma.municipality.create({
      data: {
        name: "Test City",
        slug: "test-city-channels",
        active: true,
      },
    });

    const otherMunicipality = await prisma.municipality.create({
      data: {
        name: "Other City",
        slug: "other-city-channels",
        active: true,
      },
    });

    // Create test users
    adminUser = await prisma.user.create({
      data: {
        email: "admin-channels@test.com",
        name: "Admin User",
        password: "hashed",
        role: "ADMIN",
        municipalityId: testMunicipality.id,
      },
    });

    managerUser = await prisma.user.create({
      data: {
        email: "manager-channels@test.com",
        name: "Manager User",
        password: "hashed",
        role: "MANAGER",
        municipalityId: testMunicipality.id,
      },
    });

    citizenUser = await prisma.user.create({
      data: {
        email: "citizen-channels@test.com",
        name: "Citizen User",
        password: "hashed",
        role: "CITIZEN",
        municipalityId: testMunicipality.id,
      },
    });

    otherMunicipalityUser = await prisma.user.create({
      data: {
        email: "other-admin@test.com",
        name: "Other Admin",
        password: "hashed",
        role: "ADMIN",
        municipalityId: otherMunicipality.id,
      },
    });

    // Create test channel
    testChannel = await prisma.officialChannel.create({
      data: {
        municipalityId: testMunicipality.id,
        name: "Test Official",
        title: "Test Mayor",
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.channelPost.deleteMany({
      where: { municipalityId: testMunicipality.id },
    });
    await prisma.channelPermission.deleteMany({
      where: { municipalityId: testMunicipality.id },
    });
    await prisma.officialChannel.deleteMany({
      where: { municipalityId: testMunicipality.id },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "admin-channels@test.com",
            "manager-channels@test.com",
            "citizen-channels@test.com",
            "other-admin@test.com",
          ],
        },
      },
    });
    await prisma.municipality.deleteMany({
      where: { slug: { in: ["test-city-channels", "other-city-channels"] } },
    });
  });

  describe("canPostToChannel", () => {
    it("should allow admin to post to any channel in their municipality", async () => {
      const canPost = await canPostToChannel(
        adminUser.id,
        testChannel.id,
        testMunicipality.id
      );
      expect(canPost).toBe(true);
    });

    it("should not allow manager without permission to post", async () => {
      const canPost = await canPostToChannel(
        managerUser.id,
        testChannel.id,
        testMunicipality.id
      );
      expect(canPost).toBe(false);
    });

    it("should allow manager with permission to post", async () => {
      // Grant permission
      await prisma.channelPermission.create({
        data: {
          municipalityId: testMunicipality.id,
          channelId: testChannel.id,
          userId: managerUser.id,
          roleGrantedByUserId: adminUser.id,
        },
      });

      const canPost = await canPostToChannel(
        managerUser.id,
        testChannel.id,
        testMunicipality.id
      );
      expect(canPost).toBe(true);

      // Cleanup
      await prisma.channelPermission.deleteMany({
        where: { userId: managerUser.id },
      });
    });

    it("should not allow user from different municipality to post", async () => {
      const canPost = await canPostToChannel(
        otherMunicipalityUser.id,
        testChannel.id,
        testMunicipality.id
      );
      expect(canPost).toBe(false);
    });

    it("should not allow citizen to post", async () => {
      const canPost = await canPostToChannel(
        citizenUser.id,
        testChannel.id,
        testMunicipality.id
      );
      expect(canPost).toBe(false);
    });
  });

  describe("getChannelsByMunicipality", () => {
    it("should return only active channels for municipality", async () => {
      const inactiveChannel = await prisma.officialChannel.create({
        data: {
          municipalityId: testMunicipality.id,
          name: "Inactive Official",
          title: "Inactive",
          isActive: false,
        },
      });

      const channels = await getChannelsByMunicipality(testMunicipality.id);

      expect(channels.length).toBeGreaterThanOrEqual(1);
      expect(channels.every((c) => c.isActive)).toBe(true);
      expect(channels.every((c) => c.municipalityId === testMunicipality.id)).toBe(true);

      // Cleanup
      await prisma.officialChannel.delete({ where: { id: inactiveChannel.id } });
    });
  });

  describe("createChannelPost", () => {
    it("should create a post successfully", async () => {
      const post = await createChannelPost({
        channelId: testChannel.id,
        authorUserId: adminUser.id,
        title: "Test Post",
        body: "This is a test post",
        visibility: "PUBLIC",
      });

      expect(post).toBeDefined();
      expect(post.title).toBe("Test Post");
      expect(post.channelId).toBe(testChannel.id);
      expect(post.authorUserId).toBe(adminUser.id);

      // Cleanup
      await prisma.channelPost.delete({ where: { id: post.id } });
    });
  });

  describe("canManagePost", () => {
    let testPost: any;

    beforeAll(async () => {
      testPost = await prisma.channelPost.create({
        data: {
          municipalityId: testMunicipality.id,
          channelId: testChannel.id,
          authorUserId: managerUser.id,
          title: "Manager Post",
          body: "Test",
          visibility: "PUBLIC",
        },
      });
    });

    afterAll(async () => {
      await prisma.channelPost.delete({ where: { id: testPost.id } });
    });

    it("should allow author to manage their own post", async () => {
      const canManage = await canManagePost(managerUser.id, testPost.id);
      expect(canManage).toBe(true);
    });

    it("should allow admin to manage any post in their municipality", async () => {
      const canManage = await canManagePost(adminUser.id, testPost.id);
      expect(canManage).toBe(true);
    });

    it("should not allow other users to manage post", async () => {
      const canManage = await canManagePost(citizenUser.id, testPost.id);
      expect(canManage).toBe(false);
    });

    it("should not allow admin from different municipality to manage post", async () => {
      const canManage = await canManagePost(otherMunicipalityUser.id, testPost.id);
      expect(canManage).toBe(false);
    });
  });

  describe("getUserChannels", () => {
    it("should return all channels for admin", async () => {
      const channels = await getUserChannels(adminUser.id);
      expect(channels.length).toBeGreaterThanOrEqual(1);
      expect(channels.every((c) => c.municipalityId === testMunicipality.id)).toBe(true);
    });

    it("should return only permitted channels for manager", async () => {
      // Grant permission
      await prisma.channelPermission.create({
        data: {
          municipalityId: testMunicipality.id,
          channelId: testChannel.id,
          userId: managerUser.id,
          roleGrantedByUserId: adminUser.id,
        },
      });

      const channels = await getUserChannels(managerUser.id);
      expect(channels.length).toBe(1);
      expect(channels[0].id).toBe(testChannel.id);

      // Cleanup
      await prisma.channelPermission.deleteMany({
        where: { userId: managerUser.id },
      });
    });

    it("should return empty array for citizen", async () => {
      const channels = await getUserChannels(citizenUser.id);
      expect(channels.length).toBe(0);
    });
  });
});

