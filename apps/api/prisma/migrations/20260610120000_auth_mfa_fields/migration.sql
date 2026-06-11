-- Add auth MFA fields to User table
ALTER TABLE "public"."User"
ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "public"."User"
ADD COLUMN IF NOT EXISTS "mfaMethod" TEXT;

ALTER TABLE "public"."User"
ADD COLUMN IF NOT EXISTS "totpSecret" TEXT;

ALTER TABLE "public"."User"
ADD COLUMN IF NOT EXISTS "totpVerifiedAt" TIMESTAMP(3);
