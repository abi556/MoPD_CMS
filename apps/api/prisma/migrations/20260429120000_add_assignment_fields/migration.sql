-- Add ASSIGNED status for workflow ownership.
ALTER TYPE "public"."ComplaintStatus" ADD VALUE IF NOT EXISTS 'ASSIGNED';

-- Add assignment tracking columns to complaints table.
ALTER TABLE "public"."Complaint"
ADD COLUMN IF NOT EXISTS "assignedToUserId" TEXT,
ADD COLUMN IF NOT EXISTS "assignedByUserId" TEXT,
ADD COLUMN IF NOT EXISTS "assignedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "assignmentReason" TEXT;

CREATE INDEX IF NOT EXISTS "Complaint_assignedToUserId_idx"
ON "public"."Complaint"("assignedToUserId");
