-- CreateEnum
CREATE TYPE "ReferenceRecoveryInquiryStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'RESOLVED', 'REJECTED');

-- CreateTable
CREATE TABLE "ReferenceRecoveryInquiry" (
    "id" TEXT NOT NULL,
    "status" "ReferenceRecoveryInquiryStatus" NOT NULL DEFAULT 'PENDING',
    "locale" "ComplaintLocale" NOT NULL,
    "subjectFragment" TEXT NOT NULL,
    "submittedDateGregorian" TIMESTAMP(3),
    "submittedDateEthiopian" TEXT,
    "categoryId" TEXT,
    "orgUnitId" TEXT,
    "phonePartial" TEXT,
    "additionalNotes" TEXT,
    "matchedComplaintId" TEXT,
    "resolvedReferenceNo" TEXT,
    "assignedToUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferenceRecoveryInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReferenceRecoveryInquiry_status_createdAt_idx" ON "ReferenceRecoveryInquiry"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ReferenceRecoveryInquiry_categoryId_idx" ON "ReferenceRecoveryInquiry"("categoryId");

-- CreateIndex
CREATE INDEX "ReferenceRecoveryInquiry_orgUnitId_idx" ON "ReferenceRecoveryInquiry"("orgUnitId");

-- CreateIndex
CREATE INDEX "Complaint_complainantEmail_idx" ON "Complaint"("complainantEmail");

-- CreateIndex
CREATE INDEX "Complaint_complainantPhone_idx" ON "Complaint"("complainantPhone");
