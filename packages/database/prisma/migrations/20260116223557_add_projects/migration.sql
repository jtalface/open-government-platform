-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('OPEN', 'PLANNING', 'FUNDED', 'BIDDING', 'ASSIGNED', 'WORK_STARTED', 'COMPLETED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'PROJECT_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'PROJECT_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'PROJECT_STATUS_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'PROJECT_ARCHIVED';
ALTER TYPE "AuditAction" ADD VALUE 'PROJECT_UNARCHIVED';

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "municipalityId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'OPEN',
    "budgetAmount" DECIMAL(15,2),
    "budgetCurrency" TEXT NOT NULL DEFAULT 'USD',
    "fundingSource" TEXT,
    "biddingReference" TEXT,
    "assignedToName" TEXT,
    "assignedToId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "workStartedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "archivedByUserId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_updates" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "municipalityId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "visibility" "UpdateVisibility" NOT NULL DEFAULT 'PUBLIC',
    "message" TEXT NOT NULL,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_updates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_ticketId_key" ON "projects"("ticketId");

-- CreateIndex
CREATE INDEX "projects_municipalityId_idx" ON "projects"("municipalityId");

-- CreateIndex
CREATE INDEX "projects_ticketId_idx" ON "projects"("ticketId");

-- CreateIndex
CREATE INDEX "projects_categoryId_idx" ON "projects"("categoryId");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "projects_createdByUserId_idx" ON "projects"("createdByUserId");

-- CreateIndex
CREATE INDEX "projects_archivedAt_idx" ON "projects"("archivedAt");

-- CreateIndex
CREATE INDEX "projects_createdAt_idx" ON "projects"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "project_updates_projectId_idx" ON "project_updates"("projectId");

-- CreateIndex
CREATE INDEX "project_updates_municipalityId_idx" ON "project_updates"("municipalityId");

-- CreateIndex
CREATE INDEX "project_updates_authorUserId_idx" ON "project_updates"("authorUserId");

-- CreateIndex
CREATE INDEX "project_updates_visibility_idx" ON "project_updates"("visibility");

-- CreateIndex
CREATE INDEX "project_updates_createdAt_idx" ON "project_updates"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "municipalities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_updates" ADD CONSTRAINT "project_updates_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_updates" ADD CONSTRAINT "project_updates_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "municipalities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_updates" ADD CONSTRAINT "project_updates_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
