-- =============================================================================
-- Admin reference data: ComplaintCategory + OrgUnit
-- =============================================================================

-- ComplaintCategory: hierarchical complaint classification
CREATE TABLE IF NOT EXISTS "public"."ComplaintCategory" (
  "id"        TEXT NOT NULL,
  "code"      TEXT NOT NULL,
  "nameEn"    TEXT NOT NULL,
  "nameAm"    TEXT,
  "parentId"  TEXT,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ComplaintCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ComplaintCategory_code_key"
  ON "public"."ComplaintCategory"("code");

CREATE INDEX IF NOT EXISTS "ComplaintCategory_parentId_idx"
  ON "public"."ComplaintCategory"("parentId");

CREATE INDEX IF NOT EXISTS "ComplaintCategory_isActive_sortOrder_idx"
  ON "public"."ComplaintCategory"("isActive", "sortOrder");

ALTER TABLE "public"."ComplaintCategory"
  ADD CONSTRAINT "ComplaintCategory_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "public"."ComplaintCategory"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- OrgUnit: organizational unit hierarchy (departments, directorates, etc.)
CREATE TABLE IF NOT EXISTS "public"."OrgUnit" (
  "id"        TEXT NOT NULL,
  "code"      TEXT NOT NULL,
  "nameEn"    TEXT NOT NULL,
  "nameAm"    TEXT,
  "parentId"  TEXT,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrgUnit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "OrgUnit_code_key"
  ON "public"."OrgUnit"("code");

CREATE INDEX IF NOT EXISTS "OrgUnit_parentId_idx"
  ON "public"."OrgUnit"("parentId");

CREATE INDEX IF NOT EXISTS "OrgUnit_isActive_sortOrder_idx"
  ON "public"."OrgUnit"("isActive", "sortOrder");

ALTER TABLE "public"."OrgUnit"
  ADD CONSTRAINT "OrgUnit_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "public"."OrgUnit"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Wire Complaint.categoryId as a real FK to ComplaintCategory
ALTER TABLE "public"."Complaint"
  ADD CONSTRAINT "Complaint_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "public"."ComplaintCategory"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Complaint_categoryId_idx"
  ON "public"."Complaint"("categoryId");

-- Wire SlaConfig.categoryId as a real FK to ComplaintCategory
ALTER TABLE "public"."SlaConfig"
  ADD CONSTRAINT "SlaConfig_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "public"."ComplaintCategory"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
