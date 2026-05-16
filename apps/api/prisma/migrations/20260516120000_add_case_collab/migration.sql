-- CreateEnum
CREATE TYPE "CaseNoteVisibility" AS ENUM ('INTERNAL', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "CaseTaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED');

-- CreateTable
CREATE TABLE "CaseNote" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "visibility" "CaseNoteVisibility" NOT NULL DEFAULT 'INTERNAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseTask" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "CaseTaskStatus" NOT NULL DEFAULT 'OPEN',
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CaseNote_complaintId_createdAt_idx" ON "CaseNote"("complaintId", "createdAt");

-- CreateIndex
CREATE INDEX "CaseTask_complaintId_status_idx" ON "CaseTask"("complaintId", "status");

-- CreateIndex
CREATE INDEX "CaseTask_complaintId_dueAt_idx" ON "CaseTask"("complaintId", "dueAt");

-- AddForeignKey
ALTER TABLE "CaseNote" ADD CONSTRAINT "CaseNote_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseTask" ADD CONSTRAINT "CaseTask_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
