-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "Priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "SlaStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'BREACHED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable: Complaint priority + categoryId
ALTER TABLE "public"."Complaint"
  ADD COLUMN IF NOT EXISTS "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN IF NOT EXISTS "categoryId" TEXT;

-- Backfill: ensure all existing rows have NORMAL priority
UPDATE "public"."Complaint" SET "priority" = 'NORMAL' WHERE "priority" IS NULL;

-- CreateTable: SlaConfig
CREATE TABLE IF NOT EXISTS "public"."SlaConfig" (
  "id"                   TEXT NOT NULL,
  "name"                 TEXT NOT NULL,
  "priority"             "Priority" NOT NULL,
  "categoryId"           TEXT,
  "targetHours"          INTEGER NOT NULL,
  "warningThresholdPct"  INTEGER NOT NULL DEFAULT 80,
  "escalationRoleId"     TEXT,
  "isActive"             BOOLEAN NOT NULL DEFAULT true,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SlaConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SlaConfig_priority_categoryId_key"
  ON "public"."SlaConfig"("priority", "categoryId");

CREATE INDEX IF NOT EXISTS "SlaConfig_priority_isActive_idx"
  ON "public"."SlaConfig"("priority", "isActive");

-- CreateTable: ComplaintSla
CREATE TABLE IF NOT EXISTS "public"."ComplaintSla" (
  "id"            TEXT NOT NULL,
  "complaintId"   TEXT NOT NULL,
  "slaConfigId"   TEXT NOT NULL,
  "startedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "targetAt"      TIMESTAMP(3) NOT NULL,
  "warningAt"     TIMESTAMP(3) NOT NULL,
  "warnedAt"      TIMESTAMP(3),
  "breachedAt"    TIMESTAMP(3),
  "completedAt"   TIMESTAMP(3),
  "status"        "SlaStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ComplaintSla_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ComplaintSla_complaintId_key"
  ON "public"."ComplaintSla"("complaintId");

CREATE INDEX IF NOT EXISTS "ComplaintSla_status_idx"
  ON "public"."ComplaintSla"("status");

CREATE INDEX IF NOT EXISTS "ComplaintSla_targetAt_idx"
  ON "public"."ComplaintSla"("targetAt");

-- Foreign keys
ALTER TABLE "public"."ComplaintSla"
  ADD CONSTRAINT "ComplaintSla_complaintId_fkey"
  FOREIGN KEY ("complaintId") REFERENCES "public"."Complaint"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."ComplaintSla"
  ADD CONSTRAINT "ComplaintSla_slaConfigId_fkey"
  FOREIGN KEY ("slaConfigId") REFERENCES "public"."SlaConfig"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
