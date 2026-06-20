import { describe, expect, it } from "vitest";
import enAuth from "../../../messages/staff/auth.en.json";
import enNavPublic from "../../../messages/public/nav-public.en.json";
import enNavStaff from "../../../messages/staff/nav-staff.en.json";
import enPublic from "../../../messages/public/public.en.json";
import enRecovery from "../../../messages/staff/recoveryInquiries.en.json";
import enStaff from "../../../messages/staff/staff.en.json";
import enComplaints from "../../../messages/staff/complaints.en.json";
import amAuth from "../../../messages/staff/auth.am.json";
import amNavPublic from "../../../messages/public/nav-public.am.json";
import amNavStaff from "../../../messages/staff/nav-staff.am.json";
import {
  loadChatbotMessages,
  loadMessages,
  loadStaffMessages,
} from "./load-messages";

const EXPECTED_NAMESPACES = [
  "common",
  "errors",
  "nav-public",
  "public",
  "faq",
  "complaintSubmit",
  "complaintTrack",
  "complaintRecover",
  "complaintRecoverManual",
  "chatbot",
  "contactForm",
  "auth",
  "nav-staff",
  "staff",
  "recoveryInquiries",
  "admin",
  "reports",
  "profile",
  "notifications",
  "inbox",
  "complaints",
  "help",
  "helpGuides",
] as const;

function leafPaths(
  value: unknown,
  prefix = "",
): string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) {
    return prefix ? [prefix] : [];
  }
  return entries.flatMap(([key, child]) =>
    leafPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

function namespaceLeafPaths(
  messages: Record<string, unknown>,
  namespace: string,
): string[] {
  return leafPaths(messages[namespace]).map((path) => `${namespace}.${path}`);
}

describe("loadMessages", () => {
  it("returns all expected top-level namespaces for en", async () => {
    const messages = await loadMessages("en");
    expect(Object.keys(messages).sort()).toEqual([...EXPECTED_NAMESPACES].sort());
  });

  it("loads split bundle content for en", async () => {
    const messages = await loadMessages("en");
    expect(messages.auth).toEqual(enAuth);
    expect(messages.staff).toEqual(enStaff);
    expect(messages.recoveryInquiries).toEqual(enRecovery);
    expect(messages.public).toEqual(enPublic);
    expect(messages["nav-public"]).toEqual(enNavPublic);
    expect(messages["nav-staff"]).toEqual(enNavStaff);
  });

  it("nav-public and nav-staff only overlap on shared mobile shell keys", async () => {
    const messages = await loadMessages("en");
    const publicKeys = Object.keys(messages["nav-public"] as object);
    const staffKeys = Object.keys(messages["nav-staff"] as object);
    const overlap = publicKeys.filter((key) => staffKeys.includes(key));
    const allowedOverlap = new Set(["menu", "openMenu", "home", "login"]);
    const unexpected = overlap.filter((key) => !allowedOverlap.has(key));
    expect(unexpected).toEqual([]);
  });

  it("nav-public includes mobile shell keys", () => {
    expect(enNavPublic.openMenu).toBeDefined();
    expect(enNavPublic.menu).toBeDefined();
  });

  it("am has the same namespace leaf paths as en", async () => {
    const [en, am] = await Promise.all([loadMessages("en"), loadMessages("am")]);
    const enPaths = EXPECTED_NAMESPACES.flatMap((ns) =>
      namespaceLeafPaths(en as Record<string, unknown>, ns),
    ).sort();
    const amPaths = EXPECTED_NAMESPACES.flatMap((ns) =>
      namespaceLeafPaths(am as Record<string, unknown>, ns),
    ).sort();
    expect(amPaths).toEqual(enPaths);
  });

  it("loads am split bundles", async () => {
    const messages = await loadMessages("am");
    expect(messages.auth).toEqual(amAuth);
    expect(messages["nav-public"]).toEqual(amNavPublic);
    expect(messages["nav-staff"]).toEqual(amNavStaff);
  });

  it("exposes critical staff and public strings", async () => {
    const messages = await loadMessages("en");
    expect((messages.auth as { loginTitle: string }).loginTitle).toBe(
      enAuth.loginTitle,
    );
    expect(
      (messages["nav-staff"] as { dashboard: string }).dashboard,
    ).toBe(enNavStaff.dashboard);
    expect((messages.public as { heroTitle: string }).heroTitle).toBe(
      enPublic.heroTitle,
    );
    expect(
      (messages.staff as { dashboard: { title: string } }).dashboard.title,
    ).toBe(enStaff.dashboard.title);
    expect((messages.recoveryInquiries as { title: string }).title).toBe(
      enRecovery.title,
    );
    expect(
      (messages["nav-staff"] as { complaintCase: string }).complaintCase,
    ).toBe(enNavStaff.complaintCase);
    expect(
      (messages.complaints as { actions: { transitionReasonHint: string } })
        .actions.transitionReasonHint,
    ).toBe(enComplaints.actions.transitionReasonHint);
  });
});

describe("loadStaffMessages", () => {
  it("does not include public or chatbot namespaces", async () => {
    const messages = await loadStaffMessages("en");
    expect(messages).not.toHaveProperty("chatbot");
    expect(messages).not.toHaveProperty("public");
    expect(messages).not.toHaveProperty("nav-public");
    expect(messages).toHaveProperty("nav-staff");
    expect(messages).toHaveProperty("auth");
    expect(messages).toHaveProperty("notifications");
    expect(messages).toHaveProperty("complaints");
  });
});

describe("loadChatbotMessages", () => {
  it("loads only chatbot namespace", async () => {
    const messages = await loadChatbotMessages("en");
    const full = await loadMessages("en");
    expect(Object.keys(messages)).toEqual(["chatbot"]);
    expect(messages.chatbot).toEqual(full.chatbot);
  });
});
