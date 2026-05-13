-- Optional owning / routing org unit on complaint intake (SDS assigned_unit alignment).
ALTER TABLE "public"."Complaint"
  ADD COLUMN IF NOT EXISTS "orgUnitId" TEXT;

ALTER TABLE "public"."Complaint"
  ADD CONSTRAINT "Complaint_orgUnitId_fkey"
  FOREIGN KEY ("orgUnitId") REFERENCES "public"."OrgUnit"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Complaint_orgUnitId_idx"
  ON "public"."Complaint"("orgUnitId");
