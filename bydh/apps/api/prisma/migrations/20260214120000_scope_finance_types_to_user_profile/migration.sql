-- Scope finance types to specific user + family profile.
-- This migration is intentionally idempotent and shadow-db safe.

DO $$
BEGIN
  IF to_regclass('"IncomeType"') IS NOT NULL THEN
    ALTER TABLE "IncomeType"
      ADD COLUMN IF NOT EXISTS "ownerUserId" TEXT,
      ADD COLUMN IF NOT EXISTS "familyId" TEXT;
  END IF;

  IF to_regclass('"ExpenseType"') IS NOT NULL THEN
    ALTER TABLE "ExpenseType"
      ADD COLUMN IF NOT EXISTS "ownerUserId" TEXT,
      ADD COLUMN IF NOT EXISTS "familyId" TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('"IncomeType"') IS NOT NULL
     AND to_regclass('"IncomeSource"') IS NOT NULL
     AND to_regclass('"FamilyProfile"') IS NOT NULL THEN
    UPDATE "IncomeType" AS t
    SET
      "ownerUserId" = src."ownerUserId",
      "familyId" = src."familyId"
    FROM (
      SELECT
        i."typeId" AS "typeId",
        MIN(f."ownerUserId") AS "ownerUserId",
        MIN(i."familyId") AS "familyId"
      FROM "IncomeSource" AS i
      JOIN "FamilyProfile" AS f ON f."id" = i."familyId"
      WHERE i."typeId" IS NOT NULL
      GROUP BY i."typeId"
    ) AS src
    WHERE t."id" = src."typeId";

    DELETE FROM "IncomeType" WHERE "ownerUserId" IS NULL OR "familyId" IS NULL;
    ALTER TABLE "IncomeType"
      ALTER COLUMN "ownerUserId" SET NOT NULL,
      ALTER COLUMN "familyId" SET NOT NULL;
  END IF;

  IF to_regclass('"ExpenseType"') IS NOT NULL
     AND to_regclass('"FamilyExpense"') IS NOT NULL
     AND to_regclass('"FamilyProfile"') IS NOT NULL THEN
    UPDATE "ExpenseType" AS t
    SET
      "ownerUserId" = src."ownerUserId",
      "familyId" = src."familyId"
    FROM (
      SELECT
        e."typeId" AS "typeId",
        MIN(f."ownerUserId") AS "ownerUserId",
        MIN(e."familyId") AS "familyId"
      FROM "FamilyExpense" AS e
      JOIN "FamilyProfile" AS f ON f."id" = e."familyId"
      GROUP BY e."typeId"
    ) AS src
    WHERE t."id" = src."typeId";

    DELETE FROM "ExpenseType" WHERE "ownerUserId" IS NULL OR "familyId" IS NULL;
    ALTER TABLE "ExpenseType"
      ALTER COLUMN "ownerUserId" SET NOT NULL,
      ALTER COLUMN "familyId" SET NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('"IncomeType"') IS NOT NULL
     AND to_regclass('"AppUser"') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'IncomeType_ownerUserId_fkey'
     ) THEN
    ALTER TABLE "IncomeType"
      ADD CONSTRAINT "IncomeType_ownerUserId_fkey"
      FOREIGN KEY ("ownerUserId") REFERENCES "AppUser"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF to_regclass('"IncomeType"') IS NOT NULL
     AND to_regclass('"FamilyProfile"') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'IncomeType_familyId_fkey'
     ) THEN
    ALTER TABLE "IncomeType"
      ADD CONSTRAINT "IncomeType_familyId_fkey"
      FOREIGN KEY ("familyId") REFERENCES "FamilyProfile"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF to_regclass('"ExpenseType"') IS NOT NULL
     AND to_regclass('"AppUser"') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'ExpenseType_ownerUserId_fkey'
     ) THEN
    ALTER TABLE "ExpenseType"
      ADD CONSTRAINT "ExpenseType_ownerUserId_fkey"
      FOREIGN KEY ("ownerUserId") REFERENCES "AppUser"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF to_regclass('"ExpenseType"') IS NOT NULL
     AND to_regclass('"FamilyProfile"') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'ExpenseType_familyId_fkey'
     ) THEN
    ALTER TABLE "ExpenseType"
      ADD CONSTRAINT "ExpenseType_familyId_fkey"
      FOREIGN KEY ("familyId") REFERENCES "FamilyProfile"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('"IncomeType"') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "IncomeType_ownerUserId_familyId_idx"
      ON "IncomeType"("ownerUserId", "familyId");
  END IF;

  IF to_regclass('"ExpenseType"') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "ExpenseType_ownerUserId_familyId_idx"
      ON "ExpenseType"("ownerUserId", "familyId");
  END IF;
END $$;
