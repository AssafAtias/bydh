-- Scope finance types to specific user + family profile.
ALTER TABLE "IncomeType"
  ADD COLUMN "ownerUserId" TEXT,
  ADD COLUMN "familyId" TEXT;

ALTER TABLE "ExpenseType"
  ADD COLUMN "ownerUserId" TEXT,
  ADD COLUMN "familyId" TEXT;

-- Backfill from existing finance rows.
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

-- Drop orphaned types that are not referenced anywhere.
DELETE FROM "IncomeType" WHERE "ownerUserId" IS NULL OR "familyId" IS NULL;
DELETE FROM "ExpenseType" WHERE "ownerUserId" IS NULL OR "familyId" IS NULL;

ALTER TABLE "IncomeType"
  ALTER COLUMN "ownerUserId" SET NOT NULL,
  ALTER COLUMN "familyId" SET NOT NULL;

ALTER TABLE "ExpenseType"
  ALTER COLUMN "ownerUserId" SET NOT NULL,
  ALTER COLUMN "familyId" SET NOT NULL;

ALTER TABLE "IncomeType"
  ADD CONSTRAINT "IncomeType_ownerUserId_fkey"
  FOREIGN KEY ("ownerUserId") REFERENCES "AppUser"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "IncomeType"
  ADD CONSTRAINT "IncomeType_familyId_fkey"
  FOREIGN KEY ("familyId") REFERENCES "FamilyProfile"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExpenseType"
  ADD CONSTRAINT "ExpenseType_ownerUserId_fkey"
  FOREIGN KEY ("ownerUserId") REFERENCES "AppUser"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExpenseType"
  ADD CONSTRAINT "ExpenseType_familyId_fkey"
  FOREIGN KEY ("familyId") REFERENCES "FamilyProfile"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "IncomeType_ownerUserId_familyId_idx" ON "IncomeType"("ownerUserId", "familyId");
CREATE INDEX "ExpenseType_ownerUserId_familyId_idx" ON "ExpenseType"("ownerUserId", "familyId");
