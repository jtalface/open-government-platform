-- AlterTable
ALTER TABLE "incident_events" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "incident_events_deletedAt_idx" ON "incident_events"("deletedAt");
