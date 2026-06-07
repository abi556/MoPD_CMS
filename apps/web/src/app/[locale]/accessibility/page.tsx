import { setRequestLocale } from "next-intl/server";
import { PublicShell } from "@/components/layout/public-shell";
import { Accessibility, FileDown, CheckCircle2, MessageSquare, HelpCircle } from "lucide-react";

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
      <div className="mx-auto w-full max-w-max-width px-gutter py-12 md:py-20">
        {isAm ? (
          // Amharic Version
          <article className="mx-auto max-w-4xl space-y-12">
            <header className="space-y-4 border-b border-border-standard pb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-brand-surface px-3 py-1 text-primary">
                <Accessibility className="h-4 w-4" />
                <span className="text-label font-label uppercase">ተደራሽነት</span>
              </div>
              <h1 className="font-display text-4xl font-semibold text-on-background md:text-5xl">
                የተደራሽነት መግለጫ (Accessibility Statement)
              </h1>
              <p className="text-body text-text-secondary">
                የፕላንና ልማት ሚኒስቴር (MoPD) የቅሬታ ማስተናገጃ ሥርዓት (CMS) አካል ጉዳተኞችን ጨምሮ ለሁሉም ዜጎች እኩል ተደራሽ እንዲሆን ለማድረግ ቁርጠኛ ነው።
              </p>
            </header>

            <section className="space-y-6">
              <h2 className="font-h2 text-h2 text-brand-deep border-b border-border-standard pb-2">
                ፩. የተደራሽነት ደረጃ (Conformance Status)
              </h2>
              <p className="text-body text-text-secondary leading-relaxed">
                ይህ መድረክ ከዓለም አቀፍ የድር ይዘት ተደራሽነት መመሪያዎች <strong>Web Content Accessibility Guidelines (WCAG) 2.2 Level AA</strong> ጋር ሙሉ በሙሉ የተጣጣመ እንዲሆን ተደርጎ የተገነባ ነው። ይህም በስክሪን አንባቢዎች (Screen Readers)፣ በቁልፍ ሰሌዳ ብቻ (Keyboard-only) እና በሌሎች አጋዥ ቴክኖሎጂዎች ለሚጠቀሙ ዜጎች ምቹ ያደርገዋል።
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="font-h2 text-h2 text-brand-deep border-b border-border-standard pb-2">
                ፪. የተገበሩ የተደራሽነት ባህሪያት
              </h2>
              <p className="text-body text-text-secondary">
                በዚህ መድረክ ላይ የሚከተሉት የተደራሽነት ባህሪያት ተካተዋል፦
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border-standard p-5 space-y-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <h3 className="font-h3 text-h3 text-on-surface">የቁልፍ ሰሌዳ አሰሳ (Keyboard Navigation)</h3>
                  <p className="text-body-sm text-text-secondary">
                    ሁሉም አገልግሎቶች እና ቅጾች ያለ መዳፊት (Mouse) በቁልፍ ሰሌዳ (Tab, Enter, Space) ብቻ ሙሉ በሙሉ ማሰስ እና መጠቀም ይቻላል። ግልጽ የትኩረት አመልካቾች (Visible Focus Rings) ተካተዋል።
                  </p>
                </div>
                <div className="rounded-xl border border-border-standard p-5 space-y-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <h3 className="font-h3 text-h3 text-on-surface">የቀለም ንፅፅር (Color Contrast)</h3>
                  <p className="text-body-sm text-text-secondary">
                    በጽሑፎች እና በጀርባ ቀለማት መካከል ያለው የንፅፅር መጠን (Contrast Ratio) ቢያንስ 4.5:1 እንዲሆን ተደርጓል፤ ይህም ማየት ለተሳናቸው ዜጎች ለማንበብ ምቹ ያደርገዋል።
                  </p>
                </div>
                <div className="rounded-xl border border-border-standard p-5 space-y-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <h3 className="font-h3 text-h3 text-on-surface">የስክሪን አንባቢ ድጋፍ (ARIA)</h3>
                  <p className="text-body-sm text-text-secondary">
                    ሁሉም ምስሎች እና አዶዎች ገላጭ ጽሑፎች (Alt Text) አሏቸው። ቅጾች እና አዝራሮች በስክሪን አንባቢዎች (እንደ NVDA፣ JAWS) በቀላሉ እንዲነበቡ በARIA መለያዎች ተደራጅተዋል።
                  </p>
                </div>
                <div className="rounded-xl border border-border-standard p-5 space-y-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <h3 className="font-h3 text-h3 text-on-surface">ቀጥታ ወደ ይዘት መዝለል</h3>
                  <p className="text-body-sm text-text-secondary">
                    በቁልፍ ሰሌዳ ለሚጠቀሙ ተጠቃሚዎች ምቾት ሲባል፣ የራስጌ አሰሳዎችን ዘልሎ በቀጥታ ወደ ዋናው ይዘት የሚወስድ "Skip to Content" አዝራር በገጹ መጀመሪያ ላይ ተካቷል።
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="font-h2 text-h2 text-brand-deep border-b border-border-standard pb-2">
                ፫. ባለሁለት ቋንቋ ድጋፍ (Bilingual Support)
              </h2>
              <p className="text-body text-text-secondary leading-relaxed">
                መድረኩ በአማርኛ እና በእንግሊዝኛ ቋንቋዎች ሙሉ በሙሉ ተደራሽ ነው። የቋንቋ መቀያየሪያው ገጹን ሳያድስ (In-place Translation) በቅጽበት ይተረጉማል፤ ይህም ተጠቃሚው የሞላውን መረጃ ሳያጣ ቋንቋ እንዲቀይር ያስችለዋል።
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="font-h2 text-h2 text-brand-deep border-b border-border-standard pb-2">
                ፬. ግብረ-መልስ እና የእርዳታ ጥያቄ
              </h2>
              <p className="text-body text-text-secondary leading-relaxed">
                ይህን መድረክ ሲጠቀሙ ማናቸውም የተደራሽነት ችግሮች ካጋጠሙዎት ወይም ተጨማሪ ድጋፍ ካስፈለገዎት እባክዎ በሚከተለው የኢሜይል አድራሻ ያሳውቁን፦{" "}
                <a href="mailto:accessibility@mopd.gov.et" className="text-primary font-semibold underline">
                  accessibility@mopd.gov.et
                </a>
              </p>
            </section>

            <section className="space-y-6 border-t border-border-standard pt-8">
              <h2 className="font-h2 text-h2 text-brand-deep">
                ኦፊሴላዊ የተደራሽነት መመሪያዎች
              </h2>
              <p className="text-body-sm text-text-secondary">
                ለበለጠ መረጃ ዓለም አቀፉን የተደራሽነት መመሪያ ሰነድ ማውረድ ይችላሉ፦
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <a
                  href="/documents/Web Content Accessibility Guidelines (WCAG) 2.2.pdf"
                  download
                  className="flex items-center justify-between rounded-xl border border-border-standard p-4 hover:bg-brand-wash hover:border-primary transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-body text-sm font-semibold text-on-surface">WCAG 2.2 መመሪያዎች</p>
                    <p className="text-label text-text-placeholder">Web Content Accessibility Guidelines (PDF)</p>
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
                <Accessibility className="h-4 w-4" />
                <span className="text-label font-label uppercase">Accessibility</span>
              </div>
              <h1 className="font-display text-4xl font-semibold text-on-background md:text-5xl">
                Accessibility Statement
              </h1>
              <p className="text-body text-text-secondary">
                The Ministry of Planning and Development (MoPD) is committed to ensuring that its Complaint Management System (CMS) is inclusive and fully accessible to all citizens, including individuals with disabilities.
              </p>
            </header>

            <section className="space-y-6">
              <h2 className="font-h2 text-h2 text-brand-deep border-b border-border-standard pb-2">
                1. Conformance Status (WCAG 2.2 AA)
              </h2>
              <p className="text-body text-text-secondary leading-relaxed">
                This platform is designed and developed to comply fully with the Web Content Accessibility Guidelines <strong>WCAG 2.2 Level AA</strong>. This ensures a highly accessible experience for users navigating with assistive technologies, including screen readers, keyboard-only input, and speech recognition software.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="font-h2 text-h2 text-brand-deep border-b border-border-standard pb-2">
                2. Implemented Accessibility Features
              </h2>
              <p className="text-body text-text-secondary">
                The following accessibility enhancements are built directly into the platform:
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border-standard p-5 space-y-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <h3 className="font-h3 text-h3 text-on-surface">Keyboard Navigation</h3>
                  <p className="text-body-sm text-text-secondary">
                    All interactive elements, forms, and buttons are fully navigable using standard keyboard commands (Tab, Shift+Tab, Enter, Space). Clear, high-contrast focus rings indicate the active element.
                  </p>
                </div>
                <div className="rounded-xl border border-border-standard p-5 space-y-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <h3 className="font-h3 text-h3 text-on-surface">Color Contrast</h3>
                  <p className="text-body-sm text-text-secondary">
                    Text and background color combinations adhere to a minimum contrast ratio of 4.5:1, ensuring readability for users with low vision or color blindness.
                  </p>
                </div>
                <div className="rounded-xl border border-border-standard p-5 space-y-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <h3 className="font-h3 text-h3 text-on-surface">Screen Reader Support (ARIA)</h3>
                  <p className="text-body-sm text-text-secondary">
                    Semantic HTML, ARIA landmarks, and descriptive labels are implemented throughout to ensure screen readers (such as NVDA, JAWS, or VoiceOver) can accurately interpret page structure and form inputs.
                  </p>
                </div>
                <div className="rounded-xl border border-border-standard p-5 space-y-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <h3 className="font-h3 text-h3 text-on-surface">Skip to Content</h3>
                  <p className="text-body-sm text-text-secondary">
                    A skip link is available at the very top of each page, allowing keyboard users to bypass the main header navigation and jump directly to the primary content area.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="font-h2 text-h2 text-brand-deep border-b border-border-standard pb-2">
                3. Bilingual &amp; Responsive Design
              </h2>
              <p className="text-body text-text-secondary leading-relaxed">
                The portal supports both English and Amharic. The language switcher translates the page instantly in-place without refreshing, preserving any form inputs. The layout is fully responsive, supporting text resizing up to 200% without loss of functionality.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="font-h2 text-h2 text-brand-deep border-b border-border-standard pb-2">
                4. Feedback &amp; Accommodations
              </h2>
              <p className="text-body text-text-secondary leading-relaxed">
                If you encounter any accessibility barriers or require assistance with submitting a complaint, please contact our accessibility team at:{" "}
                <a href="mailto:accessibility@mopd.gov.et" className="text-primary font-semibold underline">
                  accessibility@mopd.gov.et
                </a>
              </p>
            </section>

            <section className="space-y-6 border-t border-border-standard pt-8">
              <h2 className="font-h2 text-h2 text-brand-deep">
                Official Accessibility Guidelines
              </h2>
              <p className="text-body-sm text-text-secondary">
                For further reference, you can download the official WCAG 2.2 guidelines document:
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <a
                  href="/documents/Web Content Accessibility Guidelines (WCAG) 2.2.pdf"
                  download
                  className="flex items-center justify-between rounded-xl border border-border-standard p-4 hover:bg-brand-wash hover:border-primary transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-body text-sm font-semibold text-on-surface">WCAG 2.2 Guidelines</p>
                    <p className="text-label text-text-placeholder">Web Content Accessibility Guidelines (PDF)</p>
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
