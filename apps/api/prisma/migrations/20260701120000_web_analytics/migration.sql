-- First-party web analytics (consent-gated on the client).
CREATE TABLE "WebAnalyticsEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "eventType" VARCHAR(64) NOT NULL,
    "pagePath" VARCHAR(256),
    "locale" "ComplaintLocale",
    "funnelName" VARCHAR(64),
    "funnelStep" VARCHAR(64),
    "funnelPhase" VARCHAR(64),
    "deviceClass" VARCHAR(16),
    "referrerCategory" VARCHAR(16),
    "correlationId" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebAnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WebAnalyticsEvent_eventType_occurredAt_idx" ON "WebAnalyticsEvent"("eventType", "occurredAt");
CREATE INDEX "WebAnalyticsEvent_funnelName_funnelStep_occurredAt_idx" ON "WebAnalyticsEvent"("funnelName", "funnelStep", "occurredAt");
CREATE INDEX "WebAnalyticsEvent_pagePath_occurredAt_idx" ON "WebAnalyticsEvent"("pagePath", "occurredAt");
CREATE INDEX "WebAnalyticsEvent_occurredAt_idx" ON "WebAnalyticsEvent"("occurredAt");
