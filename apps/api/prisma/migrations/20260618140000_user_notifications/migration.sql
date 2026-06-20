-- CreateEnum
CREATE TYPE "UserNotificationType" AS ENUM (
  'complaint_assigned',
  'case_task_assigned',
  'case_task_reassigned',
  'sla_warning',
  'sla_breached',
  'account_password_changed',
  'account_email_changed',
  'security_mfa_reminder',
  'report_export_ready',
  'report_export_failed'
);

-- CreateEnum
CREATE TYPE "UserNotificationSeverity" AS ENUM ('info', 'success', 'warning', 'critical');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "lastMfaReminderAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "UserNotification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "UserNotificationType" NOT NULL,
  "severity" "UserNotificationSeverity" NOT NULL DEFAULT 'info',
  "messageKey" TEXT NOT NULL,
  "messageParams" JSONB,
  "link" TEXT,
  "entityType" TEXT,
  "entityId" TEXT,
  "dedupKey" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserNotification_userId_readAt_createdAt_idx" ON "UserNotification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserNotification_userId_dedupKey_key" ON "UserNotification"("userId", "dedupKey");

-- AddForeignKey
ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
