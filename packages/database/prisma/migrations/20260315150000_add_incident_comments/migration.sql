-- CreateTable
CREATE TABLE "incident_comments" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "municipalityId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incident_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "incident_comments_incidentId_idx" ON "incident_comments"("incidentId");

-- CreateIndex
CREATE INDEX "incident_comments_authorUserId_idx" ON "incident_comments"("authorUserId");

-- CreateIndex
CREATE INDEX "incident_comments_municipalityId_idx" ON "incident_comments"("municipalityId");

-- CreateIndex
CREATE INDEX "incident_comments_createdAt_idx" ON "incident_comments"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "incident_comments" ADD CONSTRAINT "incident_comments_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incident_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_comments" ADD CONSTRAINT "incident_comments_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_comments" ADD CONSTRAINT "incident_comments_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "municipalities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
