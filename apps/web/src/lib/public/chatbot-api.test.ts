import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/api-client", () => ({
  apiPost: vi.fn(),
}));

import { apiPost } from "@/lib/api-client";
import { sendChatbotMessage } from "./chatbot-api";

describe("chatbot-api", () => {
  beforeEach(() => {
    vi.mocked(apiPost).mockReset();
  });

  it("posts public message without auth", async () => {
    vi.mocked(apiPost).mockResolvedValue({
      reply: "Track at /complaints/track",
      confidence: "verified",
      sources: [],
      sessionId: "abc",
      turnCount: 1,
    });

    const result = await sendChatbotMessage({
      sessionId: "abc",
      message: "How to track?",
      locale: "en",
    });

    expect(apiPost).toHaveBeenCalledWith(
      "/chatbot/message",
      {
        sessionId: "abc",
        message: "How to track?",
        locale: "en",
      },
      { auth: false },
    );
    expect(result.confidence).toBe("verified");
  });
});
