import { setRequestLocale } from "next-intl/server";
import { PublicShell } from "@/components/layout/public-shell";
import {
  CookiePolicyPreferencesSection,
  CookiePolicyTable,
  type CookiePolicyRow,
} from "@/components/public/cookie-storage-table";
import { CookiePreferencesPanel } from "@/components/public/cookie-preferences-panel";
import { PublicLegalHero } from "@/components/public/public-legal-hero";
import { PublicLegalSection } from "@/components/public/public-legal-section";
import {
  PublicLegalDocumentLayout,
  type LegalNavSection,
} from "@/components/public/public-legal-document-layout";
import { Link } from "@/i18n/navigation";

const EN_SECTIONS: LegalNavSection[] = [
  { id: "overview", title: "Overview" },
  { id: "essential", title: "Essential technologies" },
  { id: "optional", title: "Optional cookies" },
  { id: "staff", title: "Staff sign-in" },
  { id: "manage", title: "Manage preferences" },
  { id: "rights", title: "Your rights" },
];

const AM_SECTIONS: LegalNavSection[] = [
  { id: "overview", title: "አጠቃላይ" },
  { id: "essential", title: "አስፈላጊ ቴክኖሎጂዎች" },
  { id: "optional", title: "አማራጭ ኩኪዎች" },
  { id: "staff", title: "የሰራተኞች መግቢያ" },
  { id: "manage", title: "ምርጫዎችን አስተዳድር" },
  { id: "rights", title: "የእርስዎ መብቶች" },
];

const TABLE_HEADERS_EN = {
  what: "What we use",
  why: "Why we use it",
  howLong: "How long",
  essential: "Always on?",
};

const TABLE_HEADERS_AM = {
  what: "ምን እንጠቀማለን",
  why: "ለምን",
  howLong: "ለምን ያህል",
  essential: "ሁልጊዜ በርቷል?",
};

const ESSENTIAL_ROWS_EN: CookiePolicyRow[] = [
  {
    id: "language",
    what: "Language preference",
    why: "Remembers whether you use English or Amharic.",
    howLong: "Up to 1 year",
    essential: "Yes",
  },
  {
    id: "cookie-settings",
    what: "Cookie settings",
    why: "Remembers your cookie choices on this site.",
    howLong: "Up to 1 year",
    essential: "Yes",
  },
  {
    id: "complaint-draft",
    what: "Complaint draft",
    why: "Saves your in-progress complaint so you do not lose your work.",
    howLong: "Until you close the browser tab",
    essential: "Yes",
  },
  {
    id: "chat",
    what: "Chat assistant",
    why: "Keeps your Melhiq conversation going while you use the chat.",
    howLong: "Until you close the browser tab",
    essential: "Yes, when you use chat",
  },
  {
    id: "offline-cache",
    what: "Faster repeat visits",
    why: "Stores parts of the site on your device so pages load more quickly.",
    howLong: "Until you clear your browser data",
    essential: "Yes",
  },
];

const ESSENTIAL_ROWS_AM: CookiePolicyRow[] = [
  {
    id: "language",
    what: "የቋንቋ ምርጫ",
    why: "እንግሊዝኛ ወይም አማርኛ እንደሚጠቀሙ ያስታውሳል።",
    howLong: "እስከ 1 ዓመት",
    essential: "አዎ",
  },
  {
    id: "cookie-settings",
    what: "የኩኪ ምርጫዎች",
    why: "በዚህ ጣቢያ ላይ ያደረጉትን የኩኪ ምርጫዎች ያስታውሳል።",
    howLong: "እስከ 1 ዓመት",
    essential: "አዎ",
  },
  {
    id: "complaint-draft",
    what: "የቅሬታ ረቂቅ",
    why: "ያልጨረሱትን ቅሬታ ስላትያዙት ስራ አይጠፋም።",
    howLong: "የአሳሽ ትር እስከሚዘጉ ድረስ",
    essential: "አዎ",
  },
  {
    id: "chat",
    what: "የቻት ረዳት",
    why: "ቻቱን ሲጠቀሙ የMelhiq ውይይትዎን ይቀጥላል።",
    howLong: "የአሳሽ ትር እስከሚዘጉ ድረስ",
    essential: "አዎ፣ ቻት ሲጠቀሙ",
  },
  {
    id: "offline-cache",
    what: "ፈጣን ተደጋጋሚ ጉብኝት",
    why: "ገጾች በፍጥነት እንዲጫኑ የጣቢያ ክፍሎችን በመሳሪያዎ ላይ ያከማቻል።",
    howLong: "የአሳሽ መረጃ እስከሚያጽዱ ድረስ",
    essential: "አዎ",
  },
];

const OPTIONAL_ROWS_EN: CookiePolicyRow[] = [
  {
    id: "analytics",
    what: "Usage analytics (first-party)",
    why: "Counts page views, device type, and where people stop in the complaint form so we can improve the portal. Only runs if you opt in.",
    howLong: "Session ID up to 1 year; event data retained up to 13 months",
    essential: "Only if you opt in",
  },
];

const OPTIONAL_ROWS_AM: CookiePolicyRow[] = [
  {
    id: "analytics",
    what: "የአጠቃቀም ትንታኔ (የእኛ ስርዓት)",
    why: "ገጽ ጉብኝት፣ የመሳሪያ አይነት እና ሰዎች በቅሬታ ቅጽ ላይ የሚያቆሙበትን ደረጃ ይቆጥራል። ከመረጡ በኋላ ብቻ ይሰራል።",
    howLong: "የክፍለ ጊዜ መለያ እስከ 1 ዓመት፤ የክስተት መረጃ እስከ 13 ወር",
    essential: "ከመረጡ በኋላ ብቻ",
  },
];

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isAm = locale === "am";

  const essentialRows = isAm ? ESSENTIAL_ROWS_AM : ESSENTIAL_ROWS_EN;
  const optionalRows = isAm ? OPTIONAL_ROWS_AM : OPTIONAL_ROWS_EN;
  const headers = isAm ? TABLE_HEADERS_AM : TABLE_HEADERS_EN;

  return (
    <PublicShell>
      <PublicLegalHero
        title={isAm ? "የኩኪ እና የማከማቻ ፖሊሲ" : "Cookie & Storage Policy"}
        subtitle={
          isAm
            ? "MoPD የቅሬታ አስተዳደር ስርዓት · የተሻሻለ · ጁን 2026"
            : "MoPD Complaint Management System · Effective June 2026"
        }
      />

      <PublicLegalDocumentLayout
        navLabel={isAm ? "ይዘት" : "Contents"}
        sections={isAm ? AM_SECTIONS : EN_SECTIONS}
      >
        <PublicLegalSection id="overview" title={isAm ? "አጠቃላይ" : "Overview"}>
          <p>
            {isAm ? (
              <>
                ይህ ገጽ በድረ-ገጻችን ላይ የምንጠቀማቸውን ኩኪዎች እና ተመሳሳይ ቴክኖሎጂዎች በቀላል ቋንቋ
                ይገልጻል። በ<strong>የግል ዳታ ጥበቃ አዋጅ ቁጥር 1321/2024</strong> መሠረት
                አገልግሎቱን ለመስጠት የሚያስፈልጉ ቴክኖሎጂዎች ያስፈልጋሉ። አማራጭ የትንታኔ ኩኪዎች
                ከመረጡ በኋላ ብቻ ይጠቀማሉ።
              </>
            ) : (
              <>
                This page explains, in plain language, the cookies and similar
                technologies we use on this complaint portal. Under{" "}
                <strong>Personal Data Protection Proclamation No. 1321/2024</strong>,
                essential technologies are needed to provide the service you
                request. Optional analytics are only used if you opt in.
              </>
            )}
          </p>
          <p>
            {isAm ? (
              <>
                ቅሬታ ሲያስገቡ የዳታ ማቀናበር ፈቃድ በተለየ ቅጽ ይሰበሰባል። ይመልከቱ —{" "}
                <Link
                  href="/privacy"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  የግላዊነት ፖሊሲ
                </Link>
                .
              </>
            ) : (
              <>
                Consent to process your complaint data is collected separately
                when you submit a complaint. See our{" "}
                <Link
                  href="/privacy"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  Privacy Policy
                </Link>
                .
              </>
            )}
          </p>
        </PublicLegalSection>

        <PublicLegalSection
          id="essential"
          title={isAm ? "አስፈላጊ ቴክኖሎጂዎች" : "Essential technologies"}
        >
          <p className="mb-4 text-text-secondary">
            {isAm
              ? "እነዚህ አገልግሎቱን ለመጠቀም ያስፈልጋሉ። ፈቃድ አያስፈልጋም።"
              : "These are required for the portal to work. We do not ask for consent to use them."}
          </p>
          <CookiePolicyTable
            tableKey="essential"
            caption={
              isAm ? "አስፈላጊ ቴክኖሎጂዎች" : "Essential cookies and browser storage"
            }
            headers={headers}
            rows={essentialRows}
          />
        </PublicLegalSection>

        <PublicLegalSection
          id="optional"
          title={isAm ? "አማራጭ ኩኪዎች" : "Optional cookies"}
        >
          <p className="mb-4">
            {isAm
              ? "ዛሬ የማስታወቂያ ወይም የሶሻል ሚዲያ ክትትል ኩኪዎችን አንጠቀምም። የእውቂያ ቅጹ ቀጥታ ወደ የMoPD ስርዓት ይላካል። ከነቁ ከሆነ የእኛ ትንታኔ ብቻ ይሰራል።"
              : "We do not use advertising or social-media tracking cookies. Messages from the contact form are sent directly to MoPD systems. If you opt in, only our first-party usage analytics runs."}
          </p>
          <CookiePolicyTable
            tableKey="optional"
            caption={isAm ? "አማራጭ ኩኪዎች" : "Optional cookies"}
            headers={headers}
            rows={optionalRows}
          />
          <p className="mt-4 text-body-sm text-text-secondary">
            {isAm
              ? "ትንታኔ ከመረጡ በኋላ ብቻ ይሰራል። የሶስተኛ ወገን የማስታወቂያ ትራከር አይጠቀምም።"
              : "Analytics only runs if you opt in. We do not use third-party advertising trackers."}
          </p>
        </PublicLegalSection>

        <PublicLegalSection
          id="staff"
          title={isAm ? "የሰራተኞች መግቢያ" : "Staff sign-in"}
        >
          <p>
            {isAm
              ? "የሰራተኞች ዳሽቦርን የሚጠቀሙ ሰራተኞች ተጨማሪ አስፈላጊ የመግቢያ ኩኪዎችን ይጠቀማሉ። እነዚህ ደህንነቱ የተጠበቀ የስራ መግቢያ ነው እና ለህዝብ አገልግሎት አያስፈልጉም።"
              : "MoPD staff who use the internal dashboard rely on additional essential sign-in cookies. These keep sessions secure and are not used for public complaint services."}
          </p>
        </PublicLegalSection>

        <PublicLegalSection
          id="manage"
          title={isAm ? "ምርጫዎችን አስተዳድር" : "Manage preferences"}
        >
          <CookiePolicyPreferencesSection
            title={isAm ? "የእርስዎ የኩኪ ምርጫዎች" : "Your cookie preferences"}
          >
            <CookiePreferencesPanel showActions />
          </CookiePolicyPreferencesSection>
        </PublicLegalSection>

        <PublicLegalSection
          id="rights"
          title={isAm ? "የእርስዎ መብቶች" : "Your rights"}
        >
          <p>
            {isAm ? (
              <>
                አማራጭ ኩኪ ፈቃድዎን በማንኛውም ጊዜ መለወጥ ወይም መሰረዝ ይችላሉ። ጥያቄዎች፦{" "}
                <a
                  href="mailto:dpo@mopd.gov.et"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  dpo@mopd.gov.et
                </a>
                .
              </>
            ) : (
              <>
                You may change or withdraw optional cookie consent at any time
                using the panel above. For privacy questions contact{" "}
                <a
                  href="mailto:dpo@mopd.gov.et"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  dpo@mopd.gov.et
                </a>
                .
              </>
            )}
          </p>
        </PublicLegalSection>
      </PublicLegalDocumentLayout>
    </PublicShell>
  );
}
