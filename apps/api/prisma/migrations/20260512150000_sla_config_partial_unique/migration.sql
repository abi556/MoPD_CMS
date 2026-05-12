-- =============================================================================
-- SlaConfig: partial unique indexes (NULL-safe)
-- =============================================================================
--
-- The original `@@unique([priority, categoryId])` constraint created a standard
-- Postgres unique index. In Postgres, NULL is NOT EQUAL to NULL inside unique
-- indexes by default, so two rows with (priority='NORMAL', categoryId=NULL)
-- were considered distinct and both inserted successfully. That defeated the
-- intent of "one generic config per priority".
--
-- Fix: replace the unconditional index with TWO partial unique indexes that
-- enforce one ACTIVE row per (priority, categoryId), splitting on NULL.
-- Inactive rows (isActive=false) may accumulate — useful for history/audit
-- and harmless because the picker filters by isActive=true.
-- =============================================================================

-- Step 1 (data cleanup): For any priority that currently has multiple active
-- generic configs (categoryId IS NULL), keep the OLDEST and deactivate the rest.
-- This prevents the new unique index from failing on existing data in dev DBs.
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY "priority", "categoryId"
    ORDER BY "createdAt" ASC
  ) AS rn
  FROM "public"."SlaConfig"
  WHERE "isActive" = true
)
UPDATE "public"."SlaConfig" sc
SET "isActive" = false, "updatedAt" = NOW()
FROM ranked r
WHERE sc.id = r.id AND r.rn > 1;

-- Step 2: Drop the old strict unique index (Prisma-generated, NULL-distinct)
DROP INDEX IF EXISTS "public"."SlaConfig_priority_categoryId_key";

-- Step 3: Create partial unique indexes — one active row per (priority, categoryId)
-- Specific configs (categoryId IS NOT NULL): unique on (priority, categoryId) WHERE active
CREATE UNIQUE INDEX "SlaConfig_priority_categoryId_active_specific_key"
  ON "public"."SlaConfig"("priority", "categoryId")
  WHERE "categoryId" IS NOT NULL AND "isActive" = true;

-- Generic configs (categoryId IS NULL): unique on (priority) WHERE active
CREATE UNIQUE INDEX "SlaConfig_priority_active_generic_key"
  ON "public"."SlaConfig"("priority")
  WHERE "categoryId" IS NULL AND "isActive" = true;
