-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_ticketId_fkey";

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
