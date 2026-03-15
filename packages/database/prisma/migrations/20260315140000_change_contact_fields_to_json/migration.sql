-- AlterTable
-- Convert existing string values to JSON objects, or set to NULL if empty
ALTER TABLE "categories" 
  ALTER COLUMN "vereador" TYPE JSONB USING 
    CASE 
      WHEN "vereador" IS NULL OR "vereador" = '' THEN NULL
      ELSE jsonb_build_object('name', "vereador", 'phone', '', 'email', '')
    END,
  ALTER COLUMN "administrador" TYPE JSONB USING 
    CASE 
      WHEN "administrador" IS NULL OR "administrador" = '' THEN NULL
      ELSE jsonb_build_object('name', "administrador", 'phone', '', 'email', '')
    END,
  ALTER COLUMN "responsavel" TYPE JSONB USING 
    CASE 
      WHEN "responsavel" IS NULL OR "responsavel" = '' THEN NULL
      ELSE jsonb_build_object('name', "responsavel", 'phone', '', 'email', '')
    END;
