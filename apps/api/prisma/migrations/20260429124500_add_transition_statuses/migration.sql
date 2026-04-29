-- Add additional workflow statuses.
ALTER TYPE "public"."ComplaintStatus" ADD VALUE IF NOT EXISTS 'IN_INVESTIGATION';
ALTER TYPE "public"."ComplaintStatus" ADD VALUE IF NOT EXISTS 'CLOSED';

-- Add latest-transition tracking columns.
ALTER TABLE "public"."Complaint"
ADD COLUMN IF NOT EXISTS "lastTransitionByUserId" TEXT,
ADD COLUMN IF NOT EXISTS "lastTransitionAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "lastTransitionReason" TEXT;
