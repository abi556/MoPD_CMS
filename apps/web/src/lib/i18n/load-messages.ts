import type { AbstractIntlMessages } from "next-intl";
import type { AppLocale } from "@/i18n/routing";

type JsonModule = { default: Record<string, unknown> };

const EN_BUNDLES = {
  common: () => import("../../../messages/shared/common.en.json"),
  errors: () => import("../../../messages/shared/errors.en.json"),
  navPublic: () => import("../../../messages/public/nav-public.en.json"),
  public: () => import("../../../messages/public/public.en.json"),
  faq: () => import("../../../messages/public/faq.en.json"),
  complaintSubmit: () => import("../../../messages/public/complaintSubmit.en.json"),
  complaintTrack: () => import("../../../messages/public/complaintTrack.en.json"),
  complaintRecover: () => import("../../../messages/public/complaintRecover.en.json"),
  complaintRecoverManual: () =>
    import("../../../messages/public/complaintRecoverManual.en.json"),
  chatbot: () => import("../../../messages/public/chatbot.en.json"),
  contactForm: () => import("../../../messages/public/contactForm.en.json"),
  auth: () => import("../../../messages/staff/auth.en.json"),
  navStaff: () => import("../../../messages/staff/nav-staff.en.json"),
  staff: () => import("../../../messages/staff/staff.en.json"),
  recoveryInquiries: () =>
    import("../../../messages/staff/recoveryInquiries.en.json"),
  admin: () => import("../../../messages/staff/admin.en.json"),
  reports: () => import("../../../messages/staff/reports.en.json"),
  profile: () => import("../../../messages/staff/profile.en.json"),
  notifications: () => import("../../../messages/staff/notifications.en.json"),
  inbox: () => import("../../../messages/staff/notifications-inbox.en.json"),
  complaints: () => import("../../../messages/staff/complaints.en.json"),
  help: () => import("../../../messages/staff/help.en.json"),
  helpGuides: () => import("../../../messages/staff/help-guides.en.json"),
} as const;

const AM_BUNDLES = {
  common: () => import("../../../messages/shared/common.am.json"),
  errors: () => import("../../../messages/shared/errors.am.json"),
  navPublic: () => import("../../../messages/public/nav-public.am.json"),
  public: () => import("../../../messages/public/public.am.json"),
  faq: () => import("../../../messages/public/faq.am.json"),
  complaintSubmit: () => import("../../../messages/public/complaintSubmit.am.json"),
  complaintTrack: () => import("../../../messages/public/complaintTrack.am.json"),
  complaintRecover: () => import("../../../messages/public/complaintRecover.am.json"),
  complaintRecoverManual: () =>
    import("../../../messages/public/complaintRecoverManual.am.json"),
  chatbot: () => import("../../../messages/public/chatbot.am.json"),
  contactForm: () => import("../../../messages/public/contactForm.am.json"),
  auth: () => import("../../../messages/staff/auth.am.json"),
  navStaff: () => import("../../../messages/staff/nav-staff.am.json"),
  staff: () => import("../../../messages/staff/staff.am.json"),
  recoveryInquiries: () =>
    import("../../../messages/staff/recoveryInquiries.am.json"),
  admin: () => import("../../../messages/staff/admin.am.json"),
  reports: () => import("../../../messages/staff/reports.am.json"),
  profile: () => import("../../../messages/staff/profile.am.json"),
  notifications: () => import("../../../messages/staff/notifications.am.json"),
  inbox: () => import("../../../messages/staff/notifications-inbox.am.json"),
  complaints: () => import("../../../messages/staff/complaints.am.json"),
  help: () => import("../../../messages/staff/help.am.json"),
  helpGuides: () => import("../../../messages/staff/help-guides.am.json"),
} as const;

type BundleKey = keyof typeof EN_BUNDLES;

async function loadBundle<K extends BundleKey>(
  locale: AppLocale,
  key: K,
): Promise<JsonModule["default"]> {
  const loaders = locale === "am" ? AM_BUNDLES : EN_BUNDLES;
  const mod = (await loaders[key]()) as JsonModule;
  return mod.default;
}

export async function loadStaffMessages(
  locale: AppLocale,
): Promise<AbstractIntlMessages> {
  const [auth, navStaff, staff, recoveryInquiries, admin, reports, profile, notifications, inbox, complaints, help, helpGuides] =
    await Promise.all([
      loadBundle(locale, "auth"),
      loadBundle(locale, "navStaff"),
      loadBundle(locale, "staff"),
      loadBundle(locale, "recoveryInquiries"),
      loadBundle(locale, "admin"),
      loadBundle(locale, "reports"),
      loadBundle(locale, "profile"),
      loadBundle(locale, "notifications"),
      loadBundle(locale, "inbox"),
      loadBundle(locale, "complaints"),
      loadBundle(locale, "help"),
      loadBundle(locale, "helpGuides"),
    ]);

  return {
    auth,
    "nav-staff": navStaff,
    staff,
    recoveryInquiries,
    admin,
    reports,
    profile,
    notifications,
    inbox,
    complaints,
    help,
    helpGuides,
  } as AbstractIntlMessages;
}

export async function loadMessages(
  locale: AppLocale,
): Promise<AbstractIntlMessages> {
  const [
    common,
    errors,
    navPublic,
    publicMsgs,
    faq,
    complaintSubmit,
    complaintTrack,
    complaintRecover,
    complaintRecoverManual,
    chatbot,
    contactForm,
    auth,
    navStaff,
    staff,
    recoveryInquiries,
    admin,
    reports,
    profile,
    notifications,
    inbox,
    complaints,
    help,
    helpGuides,
  ] = await Promise.all([
    loadBundle(locale, "common"),
    loadBundle(locale, "errors"),
    loadBundle(locale, "navPublic"),
    loadBundle(locale, "public"),
    loadBundle(locale, "faq"),
    loadBundle(locale, "complaintSubmit"),
    loadBundle(locale, "complaintTrack"),
    loadBundle(locale, "complaintRecover"),
    loadBundle(locale, "complaintRecoverManual"),
    loadBundle(locale, "chatbot"),
    loadBundle(locale, "contactForm"),
    loadBundle(locale, "auth"),
    loadBundle(locale, "navStaff"),
    loadBundle(locale, "staff"),
    loadBundle(locale, "recoveryInquiries"),
    loadBundle(locale, "admin"),
    loadBundle(locale, "reports"),
    loadBundle(locale, "profile"),
    loadBundle(locale, "notifications"),
    loadBundle(locale, "inbox"),
    loadBundle(locale, "complaints"),
    loadBundle(locale, "help"),
    loadBundle(locale, "helpGuides"),
  ]);

  return {
    common,
    errors,
    "nav-public": navPublic,
    public: publicMsgs,
    faq,
    complaintSubmit,
    complaintTrack,
    complaintRecover,
    complaintRecoverManual,
    chatbot,
    contactForm,
    auth,
    "nav-staff": navStaff,
    staff,
    recoveryInquiries,
    admin,
    reports,
    profile,
    notifications,
    inbox,
    complaints,
    help,
    helpGuides,
  } as AbstractIntlMessages;
}

export async function loadChatbotMessages(
  locale: AppLocale,
): Promise<AbstractIntlMessages> {
  const chatbot = await loadBundle(locale, "chatbot");
  return { chatbot } as AbstractIntlMessages;
}
