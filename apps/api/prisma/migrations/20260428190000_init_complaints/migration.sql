-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('SUBMITTED');

-- CreateEnum
CREATE TYPE "ComplaintChannel" AS ENUM ('WEB', 'ASSISTED', 'EMAIL', 'SMS', 'USSD');

-- CreateEnum
CREATE TYPE "ComplaintLocale" AS ENUM ('en', 'am');

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "sequenceNo" SERIAL NOT NULL,
    "referenceNo" TEXT NOT NULL,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'SUBMITTED',
    "channel" "ComplaintChannel" NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locale" "ComplaintLocale" NOT NULL,
    "consentGiven" BOOLEAN NOT NULL,
    "complainantName" TEXT,
    "complainantEmail" TEXT,
    "complainantPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Complaint_sequenceNo_key" ON "Complaint"("sequenceNo");

-- CreateIndex
CREATE UNIQUE INDEX "Complaint_referenceNo_key" ON "Complaint"("referenceNo");

-- CreateIndex
CREATE INDEX "Complaint_referenceNo_idx" ON "Complaint"("referenceNo");

-- CreateIndex
CREATE INDEX "Complaint_submittedAt_idx" ON "Complaint"("submittedAt");
