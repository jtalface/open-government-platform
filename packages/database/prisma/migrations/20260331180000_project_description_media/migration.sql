-- Optional images (max 3 enforced in application) for project main description
ALTER TABLE "projects" ADD COLUMN "descriptionMedia" JSONB NOT NULL DEFAULT '[]';
