CREATE TABLE IF NOT EXISTS "public"."ComplaintHistory" (
  "id" TEXT NOT NULL,
  "complaintId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "fromStatus" "public"."ComplaintStatus",
  "toStatus" "public"."ComplaintStatus" NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ComplaintHistory_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."ComplaintHistory"
ADD CONSTRAINT "ComplaintHistory_complaintId_fkey"
FOREIGN KEY ("complaintId") REFERENCES "public"."Complaint"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "ComplaintHistory_complaintId_createdAt_idx"
ON "public"."ComplaintHistory"("complaintId", "createdAt");
