import { setRequestLocale } from "next-intl/server";
import { PublicShell } from "@/components/layout/public-shell";
import { PublicLegalHero } from "@/components/public/public-legal-hero";
import { PublicLegalSection } from "@/components/public/public-legal-section";
import {
  PublicLegalDocumentLayout,
  type LegalNavSection,
} from "@/components/public/public-legal-document-layout";
import { FileDown } from "lucide-react";

const EN_SECTIONS: LegalNavSection[] = [
  { id: "conformance", title: "Conformance status" },
  { id: "features", title: "Accessibility features" },
  { id: "bilingual", title: "Bilingual support" },
  { id: "feedback", title: "Feedback" },
  { id: "documents", title: "Related documents" },
];

const AM_SECTIONS: LegalNavSection[] = [
  { id: "conformance", title: "የተገናኝነት ሁኔታ" },
  { id: "features", title: "የተደራሽነት ባህሪያት" },
  { id: "bilingual", title: "ባለሁለት ቋንቋ ድጋፍ" },
  { id: "feedback", title: "ግብረ-መልስ" },
  { id: "documents", title: "ተዛማጅ ሰነዶች" },
];

export default async function AccessibilityPage({
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
        title={isAm ? "የተደራሽነት መግለጫ" : "Accessibility Statement"}
        subtitle={
          isAm
            ? "MoPD የቅሬታ አስተዳደር ስርዓት · ለሁሉም ዜጎች እኩል ተደራሽ"
            : "MoPD Complaint Management System · Inclusive access for all citizens"
        }
      />

      {isAm ? (
        <PublicLegalDocumentLayout navLabel="ይዘት" sections={AM_SECTIONS}>
          <PublicLegalSection id="conformance" title="የተገናኝነት ሁኔታ">
            <p>
              ይህ መድረክ ከዓለም አቀፍ የድር ይዘት ተደራሽነት መመሪያዎች{" "}
              <strong>Web Content Accessibility Guidelines (WCAG) 2.2 Level AA</strong>{" "}
              ጋር ለመጣጠም ተዘጋጅቷል። በስክሪን አንባቢዎች፣ በቁልፍ ሰሌዳ ብቻ እና
              በሌሎች አጋዥ ቴክኖሎጂዎች ለሚጠቀሙ ተጠቃሚዎች ምቹ ነው።
            </p>
          </PublicLegalSection>

          <PublicLegalSection id="features" title="የተደራሽነት ባህሪያት">
            <p>በዚህ መድረክ ላይ የሚከተሉት ባህሪያት ተካትተዋል፦</p>
            <ul className="list-disc space-y-3 pl-5">
              <li>
                <strong>የቁልፍ ሰሌዳ አሰሳ፦</strong> ሁሉም ቅጾች እና አዝራሮች
                በTab፣ Enter እና Space ብቻ ሙሉ በሙሉ ሊጠቀሙ ይችላሉ። ግልጽ
                የትኩረት አመልካቾች ተካትተዋል።
              </li>
              <li>
                <strong>የቀለም ንፅፅር፦</strong> ጽሑፍ እና ጀርባ ቀለሞች ቢያንስ
                4.5:1 ንፅፅር ይይዛሉ።
              </li>
              <li>
                <strong>የስክሪን አንባቢ ድጋፍ፦</strong> ምስሎች alt text አሏቸው፤
                ቅጾች እና አዝራሮች ARIA መለያዎች ተጠቅመዋል።
              </li>
              <li>
                <strong>Skip to Content፦</strong> በቁልፍ ሰሌዳ ተጠቃሚዎች
                ወደ ዋናው ይዘት በቀጥታ መዝለል ይችላሉ።
              </li>
            </ul>
          </PublicLegalSection>

          <PublicLegalSection id="bilingual" title="ባለሁለት ቋንቋ ድጋፍ">
            <p>
              መድረኩ በአማርኛ እና በእንግሊዝኛ ተደራሽ ነው። የቋንቋ መቀያየሪያው
              ገጹን ሳያድስ ትርጉም ይሰጣል፤ የform መረጃዎ ተጠብቆ ይቆያል።
              አቀማመጡ ለ200% የጽሑፍ ማጉላት ድጋፍ ያደርጋል።
            </p>
          </PublicLegalSection>

          <PublicLegalSection id="feedback" title="ግብረ-መልስ">
            <p>
              የተደራሽነት ችግር ካጋጠማዎት ወይም ተጨማሪ ድጋፍ ካስፈለገዎት{" "}
              <a
                href="mailto:accessibility@mopd.gov.et"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                accessibility@mopd.gov.et
              </a>{" "}
              ያሳውቁን።
            </p>
          </PublicLegalSection>

          <PublicLegalSection id="documents" title="ተዛማጅ ሰነዶች">
            <p>የWCAG 2.2 መመሪያ ሰነድ ማውረድ ይችላሉ፦</p>
            <ul className="space-y-3">
              <li>
                <a
                  href="/documents/Web Content Accessibility Guidelines (WCAG) 2.2.pdf"
                  download
                  className="inline-flex items-center gap-2 font-medium text-primary underline-offset-2 hover:underline"
                >
                  <FileDown className="h-4 w-4 shrink-0" aria-hidden />
                  WCAG 2.2 · Web Content Accessibility Guidelines
                </a>
              </li>
            </ul>
          </PublicLegalSection>
        </PublicLegalDocumentLayout>
      ) : (
        <PublicLegalDocumentLayout navLabel="Contents" sections={EN_SECTIONS}>
          <PublicLegalSection id="conformance" title="Conformance status">
            <p>
              This platform is designed to comply with{" "}
              <strong>Web Content Accessibility Guidelines (WCAG) 2.2 Level AA</strong>.
              It supports users of screen readers, keyboard-only navigation, and
              other assistive technologies.
            </p>
          </PublicLegalSection>

          <PublicLegalSection id="features" title="Accessibility features">
            <p>The following enhancements are built into the platform:</p>
            <ul className="list-disc space-y-3 pl-5">
              <li>
                <strong>Keyboard navigation:</strong> All forms and controls are
                operable with Tab, Enter, and Space. Visible focus indicators
                show the active element.
              </li>
              <li>
                <strong>Color contrast:</strong> Text and background combinations
                meet a minimum contrast ratio of 4.5:1.
              </li>
              <li>
                <strong>Screen reader support:</strong> Images include alt text;
                forms and controls use semantic HTML and ARIA where appropriate.
              </li>
              <li>
                <strong>Skip to content:</strong> Keyboard users can bypass the
                header and jump directly to the main content.
              </li>
            </ul>
          </PublicLegalSection>

          <PublicLegalSection id="bilingual" title="Bilingual support">
            <p>
              The portal is available in English and Amharic. The language
              switcher updates content in place without losing form progress.
              The layout supports text resizing up to 200% without loss of
              functionality.
            </p>
          </PublicLegalSection>

          <PublicLegalSection id="feedback" title="Feedback">
            <p>
              If you encounter accessibility barriers or need assistance,
              contact{" "}
              <a
                href="mailto:accessibility@mopd.gov.et"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                accessibility@mopd.gov.et
              </a>
              .
            </p>
          </PublicLegalSection>

          <PublicLegalSection id="documents" title="Related documents">
            <p>Download the official WCAG 2.2 guidelines:</p>
            <ul className="space-y-3">
              <li>
                <a
                  href="/documents/Web Content Accessibility Guidelines (WCAG) 2.2.pdf"
                  download
                  className="inline-flex items-center gap-2 font-medium text-primary underline-offset-2 hover:underline"
                >
                  <FileDown className="h-4 w-4 shrink-0" aria-hidden />
                  WCAG 2.2 · Web Content Accessibility Guidelines
                </a>
              </li>
            </ul>
          </PublicLegalSection>
        </PublicLegalDocumentLayout>
      )}
    </PublicShell>
  );
}
