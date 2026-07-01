import { setRequestLocale } from "next-intl/server";
import { PublicShell } from "@/components/layout/public-shell";
import { PublicLegalHero } from "@/components/public/public-legal-hero";
import { PublicLegalSection } from "@/components/public/public-legal-section";
import {
  PublicLegalDocumentLayout,
  type LegalNavSection,
} from "@/components/public/public-legal-document-layout";
import { FileDown } from "lucide-react";
import { Link } from "@/i18n/navigation";

const EN_SECTIONS: LegalNavSection[] = [
  { id: "legal-basis", title: "Legal basis" },
  { id: "data-collection", title: "Data we collect" },
  { id: "data-use", title: "How we use data" },
  { id: "cookies", title: "Cookies & storage" },
  { id: "data-security", title: "Data security" },
  { id: "your-rights", title: "Your rights" },
  { id: "retention", title: "Data retention" },
  { id: "contact", title: "Contact" },
  { id: "documents", title: "Related documents" },
];

const AM_SECTIONS: LegalNavSection[] = [
  { id: "legal-basis", title: "የሕግ መሠረት" },
  { id: "data-collection", title: "የምንሰበስባቸው መረጃዎች" },
  { id: "data-use", title: "መረጃን የምንጠቀምበት መንገድ" },
  { id: "cookies", title: "ኩኪዎች እና ማከማቻ" },
  { id: "data-security", title: "የመረጃ ደህንነት" },
  { id: "your-rights", title: "የእርስዎ መብቶች" },
  { id: "retention", title: "የመረጃ ማቆያ" },
  { id: "contact", title: "ግንኙነት" },
  { id: "documents", title: "ተዛማጅ ሰነዶች" },
];

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isAm = locale === "am";

  return (
    <PublicShell>
      <PublicLegalHero
        title={
          isAm
            ? "የግላዊነት እና የዳታ ጥበቃ ማስታወቂያ"
            : "Privacy Policy"
        }
        subtitle={
          isAm
            ? "MoPD የቅሬታ አስተዳደር ስርዓት · የተሻሻለ · ጁን 2026"
            : "MoPD Complaint Management System · Effective June 2026"
        }
      />

      {isAm ? (
        <PublicLegalDocumentLayout navLabel="ይዘት" sections={AM_SECTIONS}>
          <PublicLegalSection id="legal-basis" title="የሕግ መሠረት">
            <p>
              የፕላንና ልማት ሚኒስቴር (MoPD) የቅሬታ ማስተናገጃ ሥርዓት (CMS) የግል መረጃዎን
              ደህንነት እና ምስጢራዊነት ለመጠበቅ ቁርጠኛ ነው። ይህ ማስታወቂያ በኢትዮጵያ ፌደራላዊ
              ዲሞክራሲያዊ ሪፐብሊክ{" "}
              <strong>የግል ዳታ ጥበቃ አዋጅ ቁጥር 1321/2024</strong> እና{" "}
              <strong>የዲጂታል መታወቂያ አዋጅ ቁጥር 1284/2023</strong> መሠረት
              የተዘጋጀ ነው።
            </p>
          </PublicLegalSection>

          <PublicLegalSection
            id="data-collection"
            title="የምንሰበስባቸው መረጃዎች"
          >
            <p>
              አገልግሎቱን ለመስጠት የግድ አስፈላጊ የሆኑትን መረጃዎች ብቻ እንሰበስባለን፦
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>የቅሬታ ዝርዝር፦</strong> የቅሬታው ርዕስ፣ ዝርዝር መግለጫ እና
                ቦታ (ክልል፣ ዞን፣ ወረዳ)።
              </li>
              <li>
                <strong>የግንኙነት መረጃ (አማራጭ)፦</strong> ሙሉ ስም፣ ኢሜይል እና
                ስልክ — ለመከታተል እና ምላሽ ብቻ።
              </li>
              <li>
                <strong>አስረጅ ሰነዶች (አማራጭ)፦</strong> ከቅሬታዎ ጋር የሚያያዩ
                ፋይሎች ወይም ማስረጃዎች።
              </li>
            </ul>
          </PublicLegalSection>

          <PublicLegalSection
            id="data-use"
            title="መረጃን የምንጠቀምበት መንገድ"
          >
            <p>የተሰበሰቡ የግል መረጃዎች ለተወሰነ ዓላማ ብቻ ያገለግላሉ፦</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>ቅሬታዎን ለመመርመር፣ ለመገምገም እና ተገቢውን ምላሽ ለመስጠት።</li>
              <li>የቅሬታ ሁኔታ ማሻሻያዎችን በኢሜይል ወይም SMS ለማሳወቅ።</li>
              <li>በማጣቀሻ ቁጥር ቅሬታዎን በራስዎ እንዲከታተሉ ለማስቻል።</li>
            </ul>
          </PublicLegalSection>

          <PublicLegalSection id="cookies" title="ኩኪዎች እና ማከማቻ">
            <p>
              ድረ-ገጹ ለቋንቋ ምርጫ፣ የቅሬታ ረቂቅ ማስቀመጥ እና ቻት (ሲጠቀሙ) አስፈላጊ ኩኪዎችን
              እና ተመሳሳይ ቴክኖሎጂዎችን ይጠቀማል። አማራጭ የትንታኔ ኩኪዎች ከመረጡ በኋላ
              ብቻ ይጠቀማሉ። ሙሉ ዝርዝር በ{" "}
              <Link
                href="/cookies"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                የኩኪ እና የማከማቻ ፖሊሲ
              </Link>{" "}
              ላይ ይገኛል።
            </p>
          </PublicLegalSection>

          <PublicLegalSection id="data-security" title="የመረጃ ደህንነት">
            <p>
              የግል መረጃዎን ለመጠበቅ የሚያስፈልጉትን ቴክኒካል እና ድርጅታዊ መጠበቅ እርምጃዎች
              እንወስዳለን — ምስጠራ፣ ለተፈቀዱ ሰራተኞች ብቻ መዳረሻ፣ መለያ ጥበቃ፣ እና
              የሚያያዙትን ፋይሎች ከመቀበል በፊት ደህንነት ምርመራ።
            </p>
            <p>
              የመረጃ መዳረሻዎች እና ለውጦች በሕግ የሚጠይቀው መሠረት ይመዘገባሉ።
            </p>
          </PublicLegalSection>

          <PublicLegalSection id="your-rights" title="የእርስዎ መብቶች">
            <p>በአዋጅ ቁጥር 1321/2024 መሠረት የሚከተሉት መብቶች አሉዎት፦</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>ስለ መረጃ አሰባሰብ እና አጠቃቀም የመረዳት መብት።</li>
              <li>የግል መረጃዎን የማየት እና የማግኘት መብት።</li>
              <li>ስህተት የሆኑ መረጃዎችን የማስተካከል መብት።</li>
              <li>መረጃዎ እንዲሰረዝ የመጠየቅ መብት (በሕግ ገደብ መሠረት)።</li>
              <li>በመረጃ አጠቃቀም ላይ ተቃውሞ የማቅረብ መብት።</li>
            </ul>
          </PublicLegalSection>

          <PublicLegalSection id="retention" title="የመረጃ ማቆያ">
            <p>
              ቅሬታዎን እና የግል መረጃዎችን ቅሬታዎን ለመፍታት ለሚያስፈልገው ጊዜ ብቻ
              እናቆያለን። ከዚያ በኋላ መረጃው ወደ ማህደር ይዛወራል ወይም በሕግ መሠረት
              ሙሉ በሙሉ ይደመሰሳል።
            </p>
          </PublicLegalSection>

          <PublicLegalSection id="contact" title="ግንኙነት">
            <p>
              ከግላዊነት ጋር የተያያዙ ጥያቄዎች ወይም ቅሬታዎች ካሉዎት የዳታ ጥበቃ
              መኮንናችንን በ{" "}
              <a
                href="mailto:dpo@mopd.gov.et"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                dpo@mopd.gov.et
              </a>{" "}
              ያግኙ።
            </p>
          </PublicLegalSection>

          <PublicLegalSection id="documents" title="ተዛማጅ የሕግ ሰነዶች">
            <p>ስለ መብቶችዎ ለበለጠ መረጃ የሚከተሉትን ኦፊሴላዊ አዋጆች ማውረድ ይችላሉ፦</p>
            <ul className="space-y-3">
              <li>
                <a
                  href="/documents/Ethiopian Personal Data Protection No. Proclamation No. 1321 2024.pdf"
                  download
                  className="inline-flex items-center gap-2 font-medium text-primary underline-offset-2 hover:underline"
                >
                  <FileDown className="h-4 w-4 shrink-0" aria-hidden />
                  የግል ዳታ ጥበቃ አዋጅ · 1321/2024
                </a>
              </li>
              <li>
                <a
                  href="/documents/Ethiopian Digital  ID Proclamation No. 1284 2023.pdf"
                  download
                  className="inline-flex items-center gap-2 font-medium text-primary underline-offset-2 hover:underline"
                >
                  <FileDown className="h-4 w-4 shrink-0" aria-hidden />
                  የዲጂታል መታወቂያ አዋጅ · 1284/2023
                </a>
              </li>
            </ul>
          </PublicLegalSection>
        </PublicLegalDocumentLayout>
      ) : (
        <PublicLegalDocumentLayout navLabel="Contents" sections={EN_SECTIONS}>
          <PublicLegalSection id="legal-basis" title="Legal basis">
            <p>
              The Ministry of Planning and Development (MoPD) Complaint
              Management System is committed to protecting the privacy,
              confidentiality, and security of your personal data. This policy
              is established in accordance with the Federal Democratic Republic
              of Ethiopia{" "}
              <strong>Personal Data Protection Proclamation No. 1321/2024</strong>{" "}
              and <strong>Digital ID Proclamation No. 1284/2023</strong>.
            </p>
          </PublicLegalSection>

          <PublicLegalSection id="data-collection" title="Data we collect">
            <p>
              We collect only the information necessary to process and resolve
              your complaint:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Complaint details:</strong> Subject, description, and
                location (region, zone, woreda) for correct routing.
              </li>
              <li>
                <strong>Contact information (optional):</strong> Name, email,
                and phone — recommended for status updates and reference
                recovery.
              </li>
              <li>
                <strong>Supporting documents (optional):</strong> Files you
                choose to upload as evidence.
              </li>
            </ul>
          </PublicLegalSection>

          <PublicLegalSection id="data-use" title="How we use data">
            <p>Your personal data is processed solely for complaint resolution:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>To evaluate, route, investigate, and resolve your complaint.</li>
              <li>To send status updates via email or SMS.</li>
              <li>To let you track your complaint using your reference number.</li>
            </ul>
          </PublicLegalSection>

          <PublicLegalSection id="cookies" title="Cookies & similar technologies">
            <p>
              The portal uses essential cookies and similar browser storage for
              language preference, saving in-progress complaints, and chat when
              you use it. Optional analytics are off unless you enable them. See
              the full{" "}
              <Link
                href="/cookies"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                Cookie &amp; Storage Policy
              </Link>
              .
            </p>
          </PublicLegalSection>

          <PublicLegalSection id="data-security" title="Data security">
            <p>
              We apply appropriate technical and organisational measures —
              including encryption in transit and at rest, access controls for
              authorised staff, account protection, and security checks on
              uploaded files.
            </p>
            <p>
              Access to and changes within the system are recorded as required
              for accountability.
            </p>
          </PublicLegalSection>

          <PublicLegalSection id="your-rights" title="Your rights">
            <p>
              Under Proclamation No. 1321/2024, you have the right to:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Be informed about how your data is collected and used.</li>
              <li>Access and receive a copy of your personal data.</li>
              <li>Rectify inaccurate or incomplete information.</li>
              <li>Request erasure, subject to legal retention requirements.</li>
              <li>Object to or restrict processing under applicable law.</li>
            </ul>
          </PublicLegalSection>

          <PublicLegalSection id="retention" title="Data retention">
            <p>
              We retain your complaint and personal data only as long as needed
              to resolve your case and meet legal obligations. Thereafter, data
              is securely archived or permanently deleted per our retention
              schedule.
            </p>
          </PublicLegalSection>

          <PublicLegalSection id="contact" title="Contact">
            <p>
              For privacy questions or to exercise your data protection rights,
              contact our Data Protection Officer at{" "}
              <a
                href="mailto:dpo@mopd.gov.et"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                dpo@mopd.gov.et
              </a>
              .
            </p>
          </PublicLegalSection>

          <PublicLegalSection id="documents" title="Related documents">
            <p>
              Download the official proclamations that govern how your data is
              handled:
            </p>
            <ul className="space-y-3">
              <li>
                <a
                  href="/documents/Ethiopian Personal Data Protection No. Proclamation No. 1321 2024.pdf"
                  download
                  className="inline-flex items-center gap-2 font-medium text-primary underline-offset-2 hover:underline"
                >
                  <FileDown className="h-4 w-4 shrink-0" aria-hidden />
                  Personal Data Protection · Proclamation 1321/2024
                </a>
              </li>
              <li>
                <a
                  href="/documents/Ethiopian Digital  ID Proclamation No. 1284 2023.pdf"
                  download
                  className="inline-flex items-center gap-2 font-medium text-primary underline-offset-2 hover:underline"
                >
                  <FileDown className="h-4 w-4 shrink-0" aria-hidden />
                  Ethiopian Digital ID · Proclamation 1284/2023
                </a>
              </li>
            </ul>
          </PublicLegalSection>
        </PublicLegalDocumentLayout>
      )}
    </PublicShell>
  );
}
