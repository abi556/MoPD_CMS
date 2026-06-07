import { setRequestLocale } from "next-intl/server";
import { PublicShell } from "@/components/layout/public-shell";
import { FileText, Scale, UserCheck, AlertTriangle, HelpCircle } from "lucide-react";

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
      <div className="mx-auto w-full max-w-max-width px-gutter py-12 md:py-20">
        {isAm ? (
          // Amharic Version
          <article className="mx-auto max-w-4xl space-y-12">
            <header className="space-y-4 border-b border-border-standard pb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-brand-surface px-3 py-1 text-primary">
                <FileText className="h-4 w-4" />
                <span className="text-label font-label uppercase">የአገልግሎት ውሎች</span>
              </div>
              <h1 className="font-display text-4xl font-semibold text-on-background md:text-5xl">
                የአገልግሎት ውሎች እና ደንቦች
              </h1>
              <p className="text-body text-text-secondary">
                የፕላንና ልማት ሚኒስቴር (MoPD) የቅሬታ ማስተናገጃ ሥርዓት (CMS) የህዝብ መተግበሪያን ለመጠቀም የተቀመጡ የአገልግሎት ውሎች እና ደንቦች።
              </p>
            </header>

            <section className="space-y-6">
              <h2 className="font-h2 text-h2 text-brand-deep border-b border-border-standard pb-2">
                ፩. ውሎችን ስለመቀበል
              </h2>
              <p className="text-body text-text-secondary leading-relaxed">
                ይህን የቅሬታ ማስተናገጃ መድረክ በመጠቀም፣ በእነዚህ የአገልግሎት ውሎች እና ደንቦች ለመገዛት መስማማትዎን ያረጋግጣሉ። በእነዚህ ውሎች ካልተስማሙ፣ እባክዎ መድረኩን አይጠቀሙ።
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="font-h2 text-h2 text-brand-deep border-b border-border-standard pb-2">
                ፪. የተጠቃሚ ኃላፊነት እና ተገቢ አጠቃቀም
              </h2>
              <p className="text-body text-text-secondary">
                ይህን መድረክ ሲጠቀሙ የሚከተሉትን ኃላፊነቶች ለመወጣት ይስማማሉ፦
              </p>
              <ul className="list-disc pl-6 space-y-3 text-body-sm text-text-secondary">
                <li><strong>ትክክለኛ መረጃ ማቅረብ፦</strong> የሚያቀርቡት ቅሬታ እና የግል መረጃ ሙሉ በሙሉ እውነተኛ፣ ትክክለኛ እና ያልተዛባ መሆን አለበት። ሆን ብሎ የሐሰት መረጃ ማቅረብ በኢትዮጵያ ሕግ ያስቀጣል።</li>
                <li><strong>ሕጋዊ አጠቃቀም፦</strong> መድረኩን ለሕገ-ወጥ፣ ለተንኮል አዘል ወይም ለማጭበርበር ዓላማዎች መጠቀም በጥብቅ የተከለከለ ነው።</li>
                <li><strong>የማጣቀሻ ቁጥርን መጠበቅ፦</strong> ቅሬታዎን ካስገቡ በኋላ የሚሰጥዎትን የሚስጥር ማጣቀሻ ቁጥር (Reference Number) ደህንነቱ በተጠበቀ ቦታ የመጠበቅ ሙሉ ኃላፊነት የእርስዎ ነው። ይህ ቁጥር ከጠፋብዎ ቅሬታዎን ለመከታተል አስቸጋሪ ሊሆን ይችላል።</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="font-h2 text-h2 text-brand-deep border-b border-border-standard pb-2">
                ፫. የሚኒስቴሩ ኃላፊነቶች እና የአገልግሎት ደረጃ (SLA)
              </h2>
              <p className="text-body text-text-secondary">
                የፕላንና ልማት ሚኒስቴር (MoPD) የሚከተሉትን ለማከናወን ይተጋል፦
              </p>
              <ul className="list-disc pl-6 space-y-3 text-body-sm text-text-secondary">
                <li>ያቀረቡትን ቅሬታ በቅንነት፣ በገለልተኝነት እና በምስጢራዊነት ለመገምገም እና ለመመርመር።</li>
                <li>በአገልግሎት ደረጃ ስምምነታችን (SLA) መሠረት ለቅሬታዎ በተቻለ ፍጥነት ምላሽ ለመስጠት (በተለምዶ እንደ ቅሬታው ዓይነት ከ3 እስከ 5 የሥራ ቀናት ውስጥ)።</li>
                <li>የእርስዎን የግል መረጃዎች በሀገሪቱ የግል ዳታ ጥበቃ አዋጅ ቁጥር 1321/2016 መሠረት ሙሉ በሙሉ ለመጠበቅ።</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="font-h2 text-h2 text-brand-deep border-b border-border-standard pb-2">
                ፬. የተከለከሉ ተግባራት
              </h2>
              <p className="text-body text-text-secondary">
                በዚህ መድረክ ላይ የሚከተሉትን ማድረግ በጥብቅ የተከለከለ ነው፦
              </p>
              <ul className="list-disc pl-6 space-y-3 text-body-sm text-text-secondary">
                <li>የማስፈራሪያ፣ የስድብ፣ የጥላቻ ንግግር ወይም የሌሎችን መብት የሚጥሱ ቃላትን በቅሬታ መግለጫ ውስጥ መጠቀም።</li>
                <li>ሆን ብሎ የተበከሉ ፋይሎችን (ቫይረሶችን) ወይም ተንኮል አዘል ሶፍትዌሮችን ለማያያዝ መሞከር።</li>
                <li>በስርዓቱ ላይ ተደጋጋሚ የሐሰት ጥያቄዎችን በመላክ የአገልግሎት መቋረጥ (DDoS) ለመፍጠር መሞከር።</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="font-h2 text-h2 text-brand-deep border-b border-border-standard pb-2">
                ፭. የአዕምሯዊ ንብረት መብት
              </h2>
              <p className="text-body text-text-secondary leading-relaxed">
                በዚህ መድረክ ላይ የሚገኙ ማናቸውም ይዘቶች፣ አርማዎች፣ ዲዛይኖች እና ቴክኖሎጂዎች የፕላንና ልማት ሚኒስቴር (MoPD) ንብረቶች ናቸው። ያለ ሚኒስቴሩ ፈቃድ እነዚህን ይዘቶች ለሌላ ዓላማ ማባዛት ወይም መጠቀም የተከለከለ ነው።
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="font-h2 text-h2 text-brand-deep border-b border-border-standard pb-2">
                ፮. ተፈጻሚነት ያለው ሕግ
              </h2>
              <p className="text-body text-text-secondary leading-relaxed">
                እነዚህ ውሎች እና ደንቦች በኢትዮጵያ ፌደራላዊ ዲሞክራሲያዊ ሪፐብሊክ ሕጎች መሠረት የሚተረጎሙ እና የሚመሩ ይሆናሉ። ከዚህ መድረክ አጠቃቀም ጋር ተያይዞ የሚነሱ ማናቸውም አለመግባባቶች በኢትዮጵያ ፍርድ ቤቶች ብቻ የሚታዩ ይሆናል።
              </p>
            </section>

            <section className="space-y-6 border-t border-border-standard pt-8">
              <h2 className="font-h2 text-h2 text-brand-deep">
                እርዳታ እና ግንኙነት
              </h2>
              <p className="text-body text-text-secondary">
                ስለ አገልግሎት ውሎቹ ማንኛውም ጥያቄ ካለዎት እባክዎ በኢሜይል አድራሻችን ያግኙን፦{" "}
                <a href="mailto:support@mopd.gov.et" className="text-primary font-semibold underline">
                  support@mopd.gov.et
                </a>
              </p>
            </section>
          </article>
        ) : (
          // English Version
          <article className="mx-auto max-w-4xl space-y-12">
            <header className="space-y-4 border-b border-border-standard pb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-brand-surface px-3 py-1 text-primary">
                <FileText className="h-4 w-4" />
                <span className="text-label font-label uppercase">Terms of Service</span>
              </div>
              <h1 className="font-display text-4xl font-semibold text-on-background md:text-5xl">
                Terms of Service
              </h1>
              <p className="text-body text-text-secondary">
                Terms, conditions, and user responsibilities governing the use of the Ministry of Planning and Development (MoPD) Complaint Management System (CMS).
              </p>
            </header>

            <section className="space-y-6">
              <h2 className="font-h2 text-h2 text-brand-deep border-b border-border-standard pb-2">
                1. Acceptance of Terms
              </h2>
              <p className="text-body text-text-secondary leading-relaxed">
                By accessing and using this Complaint Management System public portal, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree with any of these terms, please do not use the system.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="font-h2 text-h2 text-brand-deep border-b border-border-standard pb-2">
                2. User Conduct &amp; Responsibilities
              </h2>
              <p className="text-body text-text-secondary">
                When submitting a complaint, you agree to fulfill the following responsibilities:
              </p>
              <ul className="list-disc pl-6 space-y-3 text-body-sm text-text-secondary">
                <li><strong>Provide Accurate Information:</strong> All information, descriptions, and personal details provided must be truthful, accurate, and complete. Submitting deliberately false or misleading claims is prohibited and may carry legal consequences under Ethiopian law.</li>
                <li><strong>Lawful Use:</strong> You must use this portal solely for legitimate, non-malicious, and lawful purposes.</li>
                <li><strong>Secure Reference Number:</strong> You are solely responsible for keeping your unique complaint reference number secure. This number is required to track status or request recovery.</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="font-h2 text-h2 text-brand-deep border-b border-border-standard pb-2">
                3. Ministry Commitments &amp; Service Levels (SLA)
              </h2>
              <p className="text-body text-text-secondary">
                The Ministry of Planning and Development (MoPD) is committed to:
              </p>
              <ul className="list-disc pl-6 space-y-3 text-body-sm text-text-secondary">
                <li>Reviewing and processing all submitted complaints with fairness, impartiality, and confidentiality.</li>
                <li>Adhering to established Service Level Agreements (SLAs) to provide timely responses (typically within 3 to 5 business days, depending on complaint complexity).</li>
                <li>Protecting your personal data in strict compliance with the Ethiopian Personal Data Protection Proclamation No. 1321/2024.</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="font-h2 text-h2 text-brand-deep border-b border-border-standard pb-2">
                4. Prohibited Activities
              </h2>
              <p className="text-body text-text-secondary">
                The following activities are strictly prohibited on this platform:
              </p>
              <ul className="list-disc pl-6 space-y-3 text-body-sm text-text-secondary">
                <li>Using abusive, offensive, defamatory, or threatening language in your complaint description.</li>
                <li>Uploading files containing viruses, malware, or any other harmful code.</li>
                <li>Attempting to disrupt system availability through automated spamming or Denial of Service (DDoS) attacks.</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="font-h2 text-h2 text-brand-deep border-b border-border-standard pb-2">
                5. Intellectual Property
              </h2>
              <p className="text-body text-text-secondary leading-relaxed">
                All software, designs, logos, text, and graphics on this portal are the intellectual property of the Ministry of Planning and Development (MoPD). Unauthorized reproduction, modification, or distribution of this content is strictly prohibited.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="font-h2 text-h2 text-brand-deep border-b border-border-standard pb-2">
                6. Governing Law
              </h2>
              <p className="text-body text-text-secondary leading-relaxed">
                These Terms of Service are governed by and construed in accordance with the laws of the Federal Democratic Republic of Ethiopia. Any disputes arising from the use of this system shall be subject to the exclusive jurisdiction of the courts of Ethiopia.
              </p>
            </section>

            <section className="space-y-6 border-t border-border-standard pt-8">
              <h2 className="font-h2 text-h2 text-brand-deep">
                Support &amp; Contact
              </h2>
              <p className="text-body text-text-secondary">
                If you have any questions regarding these Terms of Service, please contact our support team at:{" "}
                <a href="mailto:support@mopd.gov.et" className="text-primary font-semibold underline">
                  support@mopd.gov.et
                </a>
              </p>
            </section>
          </article>
        )}
      </div>
    </PublicShell>
  );
}
