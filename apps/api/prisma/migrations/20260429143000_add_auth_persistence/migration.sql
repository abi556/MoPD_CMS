CREATE TABLE IF NOT EXISTS "public"."User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key"
ON "public"."User"("email");

CREATE TABLE IF NOT EXISTS "public"."Role" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Role_name_key"
ON "public"."Role"("name");

CREATE TABLE IF NOT EXISTS "public"."UserRole" (
  "userId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

CREATE INDEX IF NOT EXISTS "UserRole_roleId_idx"
ON "public"."UserRole"("roleId");

ALTER TABLE "public"."UserRole"
ADD CONSTRAINT "UserRole_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "public"."User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."UserRole"
ADD CONSTRAINT "UserRole_roleId_fkey"
FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
