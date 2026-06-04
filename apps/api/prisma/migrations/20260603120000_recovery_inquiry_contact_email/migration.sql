-- Manual recovery: contact email for async staff outcomes; drop unused partial phone.
ALTER TABLE "ReferenceRecoveryInquiry" DROP COLUMN IF EXISTS "phonePartial";
ALTER TABLE "ReferenceRecoveryInquiry" ADD COLUMN IF NOT EXISTS "contactEmail" TEXT;
UPDATE "ReferenceRecoveryInquiry" SET "contactEmail" = 'legacy@mopd.local' WHERE "contactEmail" IS NULL;
ALTER TABLE "ReferenceRecoveryInquiry" ALTER COLUMN "contactEmail" SET NOT NULL;
