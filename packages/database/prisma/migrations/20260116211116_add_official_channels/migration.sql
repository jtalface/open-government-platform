-- CreateEnum
CREATE TYPE "PostVisibility" AS ENUM ('PUBLIC', 'DRAFT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'CHANNEL_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'CHANNEL_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'CHANNEL_DEACTIVATED';
ALTER TYPE "AuditAction" ADD VALUE 'CHANNEL_PERMISSION_GRANTED';
ALTER TYPE "AuditAction" ADD VALUE 'CHANNEL_PERMISSION_REVOKED';
ALTER TYPE "AuditAction" ADD VALUE 'CHANNEL_POST_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'CHANNEL_POST_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'CHANNEL_POST_DELETED';

-- CreateTable
CREATE TABLE "official_channels" (
    "id" TEXT NOT NULL,
    "municipalityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "official_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_permissions" (
    "id" TEXT NOT NULL,
    "municipalityId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleGrantedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_posts" (
    "id" TEXT NOT NULL,
    "municipalityId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "visibility" "PostVisibility" NOT NULL DEFAULT 'PUBLIC',
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "official_channels_municipalityId_idx" ON "official_channels"("municipalityId");

-- CreateIndex
CREATE INDEX "official_channels_isActive_idx" ON "official_channels"("isActive");

-- CreateIndex
CREATE INDEX "channel_permissions_municipalityId_idx" ON "channel_permissions"("municipalityId");

-- CreateIndex
CREATE INDEX "channel_permissions_channelId_idx" ON "channel_permissions"("channelId");

-- CreateIndex
CREATE INDEX "channel_permissions_userId_idx" ON "channel_permissions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "channel_permissions_channelId_userId_key" ON "channel_permissions"("channelId", "userId");

-- CreateIndex
CREATE INDEX "channel_posts_municipalityId_idx" ON "channel_posts"("municipalityId");

-- CreateIndex
CREATE INDEX "channel_posts_channelId_idx" ON "channel_posts"("channelId");

-- CreateIndex
CREATE INDEX "channel_posts_authorUserId_idx" ON "channel_posts"("authorUserId");

-- CreateIndex
CREATE INDEX "channel_posts_visibility_idx" ON "channel_posts"("visibility");

-- CreateIndex
CREATE INDEX "channel_posts_publishedAt_idx" ON "channel_posts"("publishedAt" DESC);

-- CreateIndex
CREATE INDEX "channel_posts_deletedAt_idx" ON "channel_posts"("deletedAt");

-- AddForeignKey
ALTER TABLE "official_channels" ADD CONSTRAINT "official_channels_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "municipalities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_permissions" ADD CONSTRAINT "channel_permissions_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "official_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_permissions" ADD CONSTRAINT "channel_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_posts" ADD CONSTRAINT "channel_posts_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "municipalities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_posts" ADD CONSTRAINT "channel_posts_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "official_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_posts" ADD CONSTRAINT "channel_posts_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
