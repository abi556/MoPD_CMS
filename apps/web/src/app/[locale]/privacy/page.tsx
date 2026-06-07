import { setRequestLocale } from "next-intl/server";
import { PublicShell } from "@/components/layout/public-shell";
import { FileDown, Shield, Info } from "lucide-react";

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
      <div className="mx-auto w-full max-w-max-width px-gutter py-12 md:py-20">
        {isAm ? (
          // Amharic Version
          <article className="mx-auto max-w-4xl space-y-12">
            <header className="space-y-4 border-b border-border-standard pb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-brand-surface px-3 py-1 text-primary">
                <Shield className="h-4 w-4" />
                <span className="text-label font-label uppercase">የዳታ ጥበቃ</span>
              </div>
              <h1 className="font-display text-4xl font-semibold text-on-background md:text-5xl">
                የግላዊነት እና የዳታ ጥበቃ ማስታወቂያ
              </h1>
              <p className="text-body text-text-secondary">
                የፕላንና ልማት ሚኒስቴር (MoPD) የቅሬታ ማስተናገጃ ሥርዓት (CMS) የግል መረጃዎን ደህንነት እና ምስጢራዊነት ለመጠበቅ ሙሉ በሙሉ ቁርጠኛ ነው።
              </p>
            </header>

            <section className="rounded-2xl border border-warning/20 bg-warning/5 p-6 space-y-3">
              <h2 className="flex items-center gap-2 text-h3 font-semibold text-on-surface">
                <Info className="h-5 w-5 text-warning" />
                የሕግ ተገዢነት ማረጋገጫ
              </h2>
              <p className="text-body-sm text-text-secondary leading-relaxed">
                ይህ የግላዊነት ማስታወቂያ በኢትዮጵያ ፌደራላዊ ዲሞክራሲያዊ ሪፐብሊክ <strong>የግል ዳታ ጥበቃ አዋጅ ቁጥር 1321/2016 (Proclamation No. 1321/2024)</strong> እና <strong>የዲጂታል መታወቂያ አዋጅ ቁጥር 1284/2015 (Proclamation No. 1284/2023)</strong> መሠረት የተዘጋጀ ነው።
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="font-h2 text-h2 text-brand-deep border-b border-border-standard pb-2">
                ፩. የምንሰበስባቸው መረጃዎች (Data Minimization)
              </h2>
              <p className="text-body text-text-secondary">
                አገልግሎቱን ለመስጠት የግድ አስፈላጊ የሆኑትን መረጃዎች ብቻ እንሰበስባለን (Data Minimization Principle)፦
              </p>
              <ul className="list-disc pl-6 space-y-2 text-body-sm text-text-secondary">
                <li><strong>የቅሬታ ዝርዝር፦</strong> የቅሬታው ርዕስ፣ ዝርዝር መግለጫ እና ቅሬታው የተፈጠረበት ቦታ (ክልል፣ ዞን፣ ወረዳ)።</li>
                <li><strong>የግንኙነት መረጃ (አማራጭ)፦</strong> ሙሉ ስም፣ የኢሜይል አድራሻ እና የስልክ ቁጥር። እነዚህ መረጃዎች ቅሬታዎን ለመከታተል እና ምላሽ ለመስጠት ብቻ ያገለግላሉ።</li>
                <li><strong>አስረጅ ሰነዶች (አማራጭ)፦</strong> ከቅሬታዎ ጋር የሚያያይዟቸው ፋይሎች ወይም ማስረጃዎች።</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="font-h2 text-h2 text-brand-deep border-b border-border-standard pb-2">
                ፪. መረጃዎችን የምንጠቀምበት መንገድ (Purpose Limitation)
              </h2>
              <p className="text-body text-text-secondary">
                የተሰበሰቡ የግል መረጃዎች ለተወሰነ ዓላማ ብቻ ያገለግላሉ (Purpose Limitation Principle)፦
              </p>
              <ul className="list-disc pl-6 space-y-2 text-body-sm text-text-secondary">
                <li>ቅሬታዎን ለመመርመር፣ ለመገምገም እና ተገቢውን ምላሽ ለመስጠት።</li>
                <li>የቅሬታዎን ሁኔታ ማሻሻያዎችን በኢሜይል ወይም በኤስኤምኤስ (SMS) ለእርስዎ ለማሳወቅ።</li>
                <li>በሚስጥር ማጣቀሻ ቁጥርዎ አማካኝነት የቅሬታዎን ሁኔታ በራስዎ እንዲከታተሉ ለማስቻል።</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="font-h2 text-h2 text-brand-deep border-b border-border-standard pb-2">
                ፫. የመረጃ ደህንነት ጥበቃ (Data Security)
              </h2>
              <p className="text-body text-text-secondary leading-relaxed">
                የግል መረጃዎን ለመጠበቅ የሚያስፈልጉትን የተገቢ መጠበቅ እርምጃዎች እንወስዳለን። ይህ የሚከተሉትን ያካትታል፦ መረጃ በሚላክበትና በሚቀመጥበት ጊዜ ምስጠራ፣ ለተፈቀዱ ሰራተኞች ብቻ የሚደረግ መዳረሻ ቁጥጥር፣ የተጠቃሚ መለያዎችን ማስጠበቅ፣ እና የሚያያዙትን ሰነዶች ከመቀበላቸው በፊት ለደህንነት ምርመራ መድረግ።
              </p>
              <p className="text-body-sm text-text-secondary leading-relaxed">
                የስርዓቱ ውስጥ የሚከናወኑ የመረጃ መዳረሻዎች እና ለውጦች በሕግ የሚጠይቀው መሠረት ይመዘገባሉ።
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="font-h2 text-h2 text-brand-deep border-b border-border-standard pb-2">
                ፬. የእርስዎ መብቶች (Data Subject Rights)
              </h2>
              <p className="text-body text-text-secondary">
                በአዋጅ ቁጥር 1321/2016 መሠረት የሚከተሉት መብቶች አሉዎት፦
              </p>
              <ul className="list-disc pl-6 space-y-2 text-body-sm text-text-secondary">
                <li>ስለ መረጃዎ አሰባሰብ እና አጠቃቀም የመረዳት መብት።</li>
                <li>የግል መረጃዎን የማየት እና የማግኘት መብት።</li>
                <li>ስህተት የሆኑ መረጃዎችን የማስተካከል ወይም የማረም መብት።</li>
                <li>መረጃዎ እንዲሰረዝ የመጠየቅ መብት (በሕግ በተቀመጠው የመረጃ ማቆያ ጊዜ ገደብ መሠረት)።</li>
                <li>በመረጃ አጠቃቀሙ ላይ ተቃውሞ የማቅረብ መብት።</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="font-h2 text-h2 text-brand-deep border-b border-border-standard pb-2">
                ፭. የመረጃ ማቆያ ጊዜ (Data Retention)
              </h2>
              <p className="text-body text-text-secondary">
                የእርስዎን ቅሬታ እና የግል መረጃዎች የምናቆየው ቅሬታዎን ለመፍታት ለሚያስፈልገው ጊዜ ብቻ ነው። ከዚያ በኋላ መረጃዎቹ በሕግ በተደነገገው መሠረት ደህንነቱ በተጠበቀ ሁኔታ ወደ ማህደር (Archive) ይዛወራሉ ወይም ሙሉ በሙሉ ይደመሰሳሉ።
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="font-h2 text-h2 text-brand-deep border-b border-border-standard pb-2">
                ፮. ግንኙነት እና ጥያቄዎች
              </h2>
              <p className="text-body text-text-secondary">
                ከግላዊነት ወይም ከዳታ ጥበቃ ጋር የተያያዙ ማናቸውም ጥያቄዎች ወይም ቅሬታዎች ካሉዎት በሚከተለው የኢሜይል አድራሻ የዳታ ጥበቃ መኮንናችንን (DPO) ማግኘት ይችላሉ፦{" "}
                <a href="mailto:dpo@mopd.gov.et" className="text-primary font-semibold underline">
                  dpo@mopd.gov.et
                </a>
              </p>
            </section>

            <section className="space-y-6 border-t border-border-standard pt-8">
              <h2 className="font-h2 text-h2 text-brand-deep">
                ተዛማጅ የሕግ ሰነዶች
              </h2>
              <p className="text-body-sm text-text-secondary">
                ስለ መብቶችዎ ለበለጠ መረጃ የሚከተሉትን ኦፊሴላዊ አዋጆች ማውረድ ይችላሉ፦
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <a
                  href="/documents/Ethiopian Personal Data Protection No. Proclamation No. 1321 2024.pdf"
                  download
                  className="flex items-center justify-between rounded-xl border border-border-standard p-4 hover:bg-brand-wash hover:border-primary transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-body text-sm font-semibold text-on-surface">የግል ዳታ ጥበቃ አዋጅ</p>
                    <p className="text-label text-text-placeholder">አዋጅ ቁጥር 1321/2016 (PDF)</p>
                  </div>
                  <FileDown className="h-5 w-5 text-primary" />
                </a>
                <a
                  href="/documents/Ethiopian Digital  ID Proclamation No. 1284 2023.pdf"
                  download
                  className="flex items-center justify-between rounded-xl border border-border-standard p-4 hover:bg-brand-wash hover:border-primary transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-body text-sm font-semibold text-on-surface">የዲጂታል መታወቂያ አዋጅ</p>
                    <p className="text-label text-text-placeholder">አዋጅ ቁጥር 1284/2015 (PDF)</p>
                  </div>
                  <FileDown className="h-5 w-5 text-primary" />
                </a>
              </div>
            </section>
          </article>
        ) : (
          // English Version
          <article className="mx-auto max-w-4xl space-y-12">
            <header className="space-y-4 border-b border-border-standard pb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-brand-surface px-3 py-1 text-primary">
                <Shield className="h-4 w-4" />
                <span className="text-label font-label uppercase">Data Protection</span>
              </div>
              <h1 className="font-display text-4xl font-semibold text-on-background md:text-5xl">
                Privacy Policy &amp; Data Protection Notice
              </h1>
              <p className="text-body text-text-secondary">
                The Ministry of Planning and Development (MoPD) Complaint Management System (CMS) is committed to protecting the privacy, confidentiality, and security of your personal data.
              </p>
            </header>

            <section className="rounded-2xl border border-warning/20 bg-warning/5 p-6 space-y-3">
              <h2 className="flex items-center gap-2 text-h3 font-semibold text-on-surface">
                <Info className="h-5 w-5 text-warning" />
                Regulatory &amp; Compliance Conformance
              </h2>
              <p className="text-body-sm text-text-secondary leading-relaxed">
                This Privacy Policy is established in accordance with the Federal Democratic Republic of Ethiopia <strong>Personal Data Protection Proclamation No. 1321/2024</strong> and <strong>Digital ID Proclamation No. 1284/2023</strong>.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="font-h2 text-h2 text-brand-deep border-b border-border-standard pb-2">
                1. Data We Collect (Data Minimization)
              </h2>
              <p className="text-body text-text-secondary">
                We adhere strictly to the principle of data minimization, collecting only the information necessary to process and resolve your complaint:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-body-sm text-text-secondary">
                <li><strong>Complaint Details:</strong> Subject, detailed description, and location of the issue (Region, Zone, Woreda) for correct routing.</li>
                <li><strong>Contact Information (Optional):</strong> Full name, email address, and phone number. Providing contact details is highly recommended for status tracking and reference recovery.</li>
                <li><strong>Supporting Documents (Optional):</strong> Any files, images, or documents you choose to upload as evidence.</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="font-h2 text-h2 text-brand-deep border-b border-border-standard pb-2">
                2. How We Use Your Data (Purpose Limitation)
              </h2>
              <p className="text-body text-text-secondary">
                Your personal data is processed solely for the specific purposes of complaint resolution:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-body-sm text-text-secondary">
                <li>To evaluate, route, investigate, and resolve your submitted complaint.</li>
                <li>To send you automated status updates and notifications via email or SMS.</li>
                <li>To allow you to securely track your complaint status using your unique reference number.</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="font-h2 text-h2 text-brand-deep border-b border-border-standard pb-2">
                3. How We Protect Your Data (Data Security)
              </h2>
              <p className="text-body text-text-secondary leading-relaxed">
                We take appropriate technical and organisational measures to protect your personal data. This includes encrypting data when it is sent and stored, restricting access to authorised staff who need it for their work, protecting user accounts, and checking uploaded files for security risks before they are accepted.
              </p>
              <p className="text-body-sm text-text-secondary leading-relaxed">
                Access to and changes within the system are recorded as required for accountability and oversight.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="font-h2 text-h2 text-brand-deep border-b border-border-standard pb-2">
                4. Your Rights (Data Subject Rights)
              </h2>
              <p className="text-body text-text-secondary">
                Under Proclamation No. 1321/2024, you have the following rights regarding your personal data:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-body-sm text-text-secondary">
                <li>The right to be informed about how your data is collected and processed.</li>
                <li>The right to access and receive a copy of your personal data.</li>
                <li>The right to rectify inaccurate or incomplete information.</li>
                <li>The right to request erasure (deletion) of your data, subject to regulatory retention schedules.</li>
                <li>The right to object to or restrict processing under specific legal grounds.</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="font-h2 text-h2 text-brand-deep border-b border-border-standard pb-2">
                5. Data Retention
              </h2>
              <p className="text-body text-text-secondary">
                We retain your personal data and complaint records only for as long as necessary to resolve your case and fulfill legal or administrative obligations. Once resolved, data is securely archived or permanently deleted in accordance with our records retention schedule.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="font-h2 text-h2 text-brand-deep border-b border-border-standard pb-2">
                6. Contact &amp; Inquiries
              </h2>
              <p className="text-body text-text-secondary">
                If you have any questions, concerns, or wish to exercise your data protection rights, please contact our Data Protection Officer (DPO) at:{" "}
                <a href="mailto:dpo@mopd.gov.et" className="text-primary font-semibold underline">
                  dpo@mopd.gov.et
                </a>
              </p>
            </section>

            <section className="space-y-6 border-t border-border-standard pt-8">
              <h2 className="font-h2 text-h2 text-brand-deep">
                Related legal documents
              </h2>
              <p className="text-body-sm text-text-secondary">
                You can download the official proclamations that govern how your data is handled:
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <a
                  href="/documents/Ethiopian Personal Data Protection No. Proclamation No. 1321 2024.pdf"
                  download
                  className="flex items-center justify-between rounded-xl border border-border-standard p-4 hover:bg-brand-wash hover:border-primary transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-body text-sm font-semibold text-on-surface">Personal Data Protection</p>
                    <p className="text-label text-text-placeholder">Proclamation No. 1321/2024 (PDF)</p>
                  </div>
                  <FileDown className="h-5 w-5 text-primary" />
                </a>
                <a
                  href="/documents/Ethiopian Digital  ID Proclamation No. 1284 2023.pdf"
                  download
                  className="flex items-center justify-between rounded-xl border border-border-standard p-4 hover:bg-brand-wash hover:border-primary transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-body text-sm font-semibold text-on-surface">Ethiopian Digital ID</p>
                    <p className="text-label text-text-placeholder">Proclamation No. 1284/2023 (PDF)</p>
                  </div>
                  <FileDown className="h-5 w-5 text-primary" />
                </a>
              </div>
            </section>
          </article>
        )}
      </div>
    </PublicShell>
  );
}
