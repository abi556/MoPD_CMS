import { apiPost } from "@/lib/api-client";
import type { WebAnalyticsEventInput } from "@/lib/public/web-analytics";

export async function sendAnalyticsEvents(
  sessionId: string,
  events: WebAnalyticsEventInput[],
): Promise<void> {
  if (events.length === 0) return;
  try {
    await apiPost<{ recorded: number }>(
      "/analytics/events",
      { sessionId, events },
      { auth: false },
    );
  } catch {
    /* Non-blocking: portal works if analytics endpoint is unavailable */
  }
}
