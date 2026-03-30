-- AlterTable
ALTER TABLE "users" ADD COLUMN "securityQuestion1Id" INTEGER,
ADD COLUMN "securityQuestion2Id" INTEGER,
ADD COLUMN "securityQuestion3Id" INTEGER,
ADD COLUMN "securityAnswer1" TEXT,
ADD COLUMN "securityAnswer2" TEXT,
ADD COLUMN "securityAnswer3" TEXT;
