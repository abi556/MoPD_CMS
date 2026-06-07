import { setRequestLocale } from "next-intl/server";
import { PublicShell } from "@/components/layout/public-shell";
import { PublicLegalHero } from "@/components/public/public-legal-hero";
import { PublicLegalSection } from "@/components/public/public-legal-section";
import {
  PublicLegalDocumentLayout,
  type LegalNavSection,
} from "@/components/public/public-legal-document-layout";

const EN_SECTIONS: LegalNavSection[] = [
  { id: "acceptance", title: "Acceptance of terms" },
  { id: "user-conduct", title: "User responsibilities" },
  { id: "ministry", title: "Ministry commitments" },
  { id: "prohibited", title: "Prohibited activities" },
  { id: "ip", title: "Intellectual property" },
  { id: "law", title: "Governing law" },
  { id: "support", title: "Support & contact" },
];

const AM_SECTIONS: LegalNavSection[] = [
  { id: "acceptance", title: "ውሎችን ስለመቀበል" },
  { id: "user-conduct", title: "የተጠቃሚ ኃላፊነት" },
  { id: "ministry", title: "የሚኒስቴር ግዴታዎች" },
  { id: "prohibited", title: "የተከለከሉ ተግባራት" },
  { id: "ip", title: "የአዕምሮ ንብረት" },
  { id: "law", title: "ተፈጻሚነት ያለው ሕግ" },
  { id: "support", title: "እርዳታ እና ግንኙነት" },
];

export default async function TermsPage({
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
        title={isAm ? "የአገልግሎት ውሎች" : "Terms of Service"}
        subtitle={
          isAm
            ? "MoPD የቅሬታ አስተዳደር ስርዓት · የተሻሻለ · ጁን 2026"
            : "MoPD Complaint Management System · Effective June 2026"
        }
      />

      {isAm ? (
        <PublicLegalDocumentLayout navLabel="ይዘት" sections={AM_SECTIONS}>
          <PublicLegalSection id="acceptance" title="ውሎችን ስለመቀበል">
            <p>
              ይህን የቅሬታ ማስተናገጃ መድረክ በመጠቀም፣ በእነዚህ የአገልግሎት ውሎች ለመገዛት
              መስማማትዎን ያረጋግጣሉ። በእነዚህ ውሎች ካልተስማሙ፣ እባክዎ መድረኩን አይጠቀሙ።
            </p>
          </PublicLegalSection>

          <PublicLegalSection id="user-conduct" title="የተጠቃሚ ኃላፊነት">
            <p>ይህን መድረክ ሲጠቀሙ የሚከተሉትን ኃላፊነቶች ለመወጣት ይስማማሉ፦</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>ትክክለኛ መረጃ፦</strong> የሚያቀርቡት ቅሬታ እና መረጃ እውነተኛ
                እና ትክክለኛ መሆን አለበት። ሆን ብሎ የሐሰት መረጃ ማቅረብ በሕግ
                ይቀጣል።
              </li>
              <li>
                <strong>ሕጋዊ አጠቃቀም፦</strong> መድረኩን ለሕገ-ወጥ፣ ለተንኮል አዘል ወይም
                ለማጭበርበር ዓላማዎች መጠቀም የተከለከለ ነው።
              </li>
              <li>
                <strong>ማጣቀሻ ቁጥር፦</strong> ከመላክ በኋላ የሚሰጥዎትን ማጣቀሻ ቁጥር
                በደህንነት መጠበቅ የእርስዎ ኃላፊነት ነው።
              </li>
            </ul>
          </PublicLegalSection>

          <PublicLegalSection id="ministry" title="የሚኒስቴር ግዴታዎች">
            <p>የፕላንና ልማት ሚኒስቴር (MoPD) የሚከተሉትን ለማከናወን ይተጋል፦</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                ቅሬታዎን በቅንነት፣ በገለልተኝነት እና በምስጢራዊነት ለመገምገም።
              </li>
              <li>
                በተለምዶ ከ3 እስከ 5 የሥራ ቀናት ውስጥ ምላሽ ለመስጠት (በቅሬታው
                ዓይነት ሊለወጥ ይችላል)።
              </li>
              <li>
                የግል መረጃዎችን በአዋጅ 1321/2024 መሠረት ለመጠበቅ።
              </li>
            </ul>
          </PublicLegalSection>

          <PublicLegalSection id="prohibited" title="የተከለከሉ ተግባራት">
            <p>በዚህ መድረክ ላይ የሚከተሉትን ማድረግ የተከለከለ ነው፦</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>የማስፈራሪያ፣ የስድብ ወይም የጥላቻ ንግግር በቅሬታ ውስጥ መጠቀም።</li>
              <li>ተንኮል አዘል ፋይሎችን ለማያያዝ መሞከር።</li>
              <li>በተደጋጋሚ የሐሰት ጥያቄዎች አገልግሎትን ለመቋረጥ መሞከር።</li>
            </ul>
          </PublicLegalSection>

          <PublicLegalSection id="ip" title="የአዕምሮ ንብረት">
            <p>
              በዚህ መድረክ ላይ የሚገኙ ይዘቶች፣ አርማዎች እና ዲዛይኖች የMoPD ንብረት
              ናቸው። ያለ ፈቃድ ማባዛት ወይም መጠቀም የተከለከለ ነው።
            </p>
          </PublicLegalSection>

          <PublicLegalSection id="law" title="ተፈጻሚነት ያለው ሕግ">
            <p>
              እነዚህ ውሎች በኢትዮጵያ ፌደራላዊ ዲሞክራሲያዊ ሪፐብሊክ ሕጎች መሠረት
              የሚተረጎሙ ይሆናሉ። ከመድረኩ አጠቃቀም ጋር የሚነሱ አለመግባባቶች በኢትዮጵያ
              ፍርድ ቤቶች ብቻ ይታያሉ።
            </p>
          </PublicLegalSection>

          <PublicLegalSection id="support" title="እርዳታ እና ግንኙነት">
            <p>
              ስለ አገልግሎት ውሎቹ ጥያቄ ካለዎት{" "}
              <a
                href="mailto:support@mopd.gov.et"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                support@mopd.gov.et
              </a>{" "}
              ያግኙን።
            </p>
          </PublicLegalSection>
        </PublicLegalDocumentLayout>
      ) : (
        <PublicLegalDocumentLayout navLabel="Contents" sections={EN_SECTIONS}>
          <PublicLegalSection id="acceptance" title="Acceptance of terms">
            <p>
              By using this Complaint Management System, you agree to be bound
              by these Terms of Service. If you do not agree, please do not use
              the system.
            </p>
          </PublicLegalSection>

          <PublicLegalSection id="user-conduct" title="User responsibilities">
            <p>When submitting a complaint, you agree to:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Provide accurate information:</strong> All details must
                be truthful and complete. Deliberately false claims may carry
                legal consequences under Ethiopian law.
              </li>
              <li>
                <strong>Use the portal lawfully:</strong> For legitimate,
                non-malicious purposes only.
              </li>
              <li>
                <strong>Keep your reference number secure:</strong> Required for
                tracking and recovery.
              </li>
            </ul>
          </PublicLegalSection>

          <PublicLegalSection id="ministry" title="Ministry commitments">
            <p>The Ministry of Planning and Development (MoPD) commits to:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Reviewing complaints with fairness, impartiality, and
                confidentiality.
              </li>
              <li>
                Responding within established timelines (typically 3–5 business
                days, depending on complexity).
              </li>
              <li>
                Protecting personal data under Proclamation No. 1321/2024.
              </li>
            </ul>
          </PublicLegalSection>

          <PublicLegalSection id="prohibited" title="Prohibited activities">
            <p>The following are strictly prohibited:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Abusive, offensive, or threatening language in complaints.</li>
              <li>Uploading malware or harmful files.</li>
              <li>Attempting to disrupt system availability through spam or abuse.</li>
            </ul>
          </PublicLegalSection>

          <PublicLegalSection id="ip" title="Intellectual property">
            <p>
              All content, logos, and designs on this portal are the property
              of MoPD. Unauthorized reproduction or distribution is prohibited.
            </p>
          </PublicLegalSection>

          <PublicLegalSection id="law" title="Governing law">
            <p>
              These terms are governed by the laws of the Federal Democratic
              Republic of Ethiopia. Disputes shall be subject to the exclusive
              jurisdiction of Ethiopian courts.
            </p>
          </PublicLegalSection>

          <PublicLegalSection id="support" title="Support & contact">
            <p>
              Questions about these terms? Contact{" "}
              <a
                href="mailto:support@mopd.gov.et"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                support@mopd.gov.et
              </a>
              .
            </p>
          </PublicLegalSection>
        </PublicLegalDocumentLayout>
      )}
    </PublicShell>
  );
}
