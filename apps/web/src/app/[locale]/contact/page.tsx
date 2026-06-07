import { setRequestLocale } from "next-intl/server";
import { PublicShell } from "@/components/layout/public-shell";
import { Mail, Phone, MapPin, Clock, Shield, Globe } from "lucide-react";

export default async function ContactPage({
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
                <Mail className="h-4 w-4" />
                <span className="text-label font-label uppercase">አግኙን</span>
              </div>
              <h1 className="font-display text-4xl font-semibold text-on-background md:text-5xl">
                የፕላንና ልማት ሚኒስቴር (MoPD)
              </h1>
              <p className="text-body text-text-secondary">
                ለማንኛውም ጥያቄ፣ አስተያየት ወይም ድጋፍ በሚከተሉት አድራሻዎች ሊያገኙን ይችላሉ።
              </p>
            </header>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-border-standard p-6 space-y-4">
                <h2 className="text-h3 font-semibold text-brand-deep flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  አካላዊ አድራሻ
                </h2>
                <p className="text-body-sm text-text-secondary leading-relaxed">
                  የፕላንና ልማት ሚኒስቴር (MoPD)<br />
                  አራት ኪሎ (ከጠቅላይ ሚኒስትር ጽሕፈት ቤት አጠገብ)<br />
                  አዲስ አበባ፣ ኢትዮጵያ
                </p>
              </div>

              <div className="rounded-2xl border border-border-standard p-6 space-y-4">
                <h2 className="text-h3 font-semibold text-brand-deep flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  የሥራ ሰዓታት
                </h2>
                <p className="text-body-sm text-text-secondary leading-relaxed">
                  ከሰኞ እስከ ሐሙስ፦ ከጠዋቱ 2:30 - 6:30 እና ከሰዓት 7:30 - 11:30<br />
                  አርብ፦ ከጠዋቱ 2:30 - 5:30 እና ከሰዓት 7:30 - 11:30<br />
                  ቅዳሜ እና እሁድ፦ ዝግ ነው
                </p>
              </div>

              <div className="rounded-2xl border border-border-standard p-6 space-y-4">
                <h2 className="text-h3 font-semibold text-brand-deep flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  የስልክ አድራሻዎች
                </h2>
                <p className="text-body-sm text-text-secondary leading-relaxed">
                  ዋና መሥሪያ ቤት፦ +251 11 122 8200<br />
                  የህዝብ ግንኙነት፦ +251 11 122 8215<br />
                  ፋክስ፦ +251 11 122 8300
                </p>
              </div>

              <div className="rounded-2xl border border-border-standard p-6 space-y-4">
                <h2 className="text-h3 font-semibold text-brand-deep flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  የኢሜይል አድራሻዎች
                </h2>
                <p className="text-body-sm text-text-secondary leading-relaxed">
                  አጠቃላይ መረጃ፦ <a href="mailto:info@mopd.gov.et" className="text-primary font-semibold underline">info@mopd.gov.et</a><br />
                  የቅሬታ ድጋፍ፦ <a href="mailto:support@mopd.gov.et" className="text-primary font-semibold underline">support@mopd.gov.et</a><br />
                  የዳታ ጥበቃ (DPO)፦ <a href="mailto:dpo@mopd.gov.et" className="text-primary font-semibold underline">dpo@mopd.gov.et</a>
                </p>
              </div>
            </div>

            <section className="rounded-2xl border border-primary/10 bg-brand-wash p-6 space-y-3">
              <h2 className="flex items-center gap-2 text-h3 font-semibold text-on-surface">
                <Globe className="h-5 w-5 text-primary" />
                ኦፊሴላዊ ድረ-ገጾች
              </h2>
              <p className="text-body-sm text-text-secondary leading-relaxed">
                ሚኒስቴሩን በተመለከተ ተጨማሪ መረጃዎችን ለማግኘት ዋናውን ድረ-ገጽ መጎብኘት ይችላሉ፦{" "}
                <a href="https://www.mopd.gov.et" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold underline">
                  www.mopd.gov.et
                </a>
              </p>
            </section>
          </article>
        ) : (
          // English Version
          <article className="mx-auto max-w-4xl space-y-12">
            <header className="space-y-4 border-b border-border-standard pb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-brand-surface px-3 py-1 text-primary">
                <Mail className="h-4 w-4" />
                <span className="text-label font-label uppercase">Contact Us</span>
              </div>
              <h1 className="font-display text-4xl font-semibold text-on-background md:text-5xl">
                Ministry of Planning &amp; Development
              </h1>
              <p className="text-body text-text-secondary">
                For any inquiries, feedback, or support regarding the Complaint Management System, please reach out to us through the channels below.
              </p>
            </header>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-border-standard p-6 space-y-4">
                <h2 className="text-h3 font-semibold text-brand-deep flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Physical Address
                </h2>
                <p className="text-body-sm text-text-secondary leading-relaxed">
                  Ministry of Planning and Development (MoPD)<br />
                  Arat Kilo (Next to the Prime Minister's Office)<br />
                  Addis Ababa, Ethiopia
                </p>
              </div>

              <div className="rounded-2xl border border-border-standard p-6 space-y-4">
                <h2 className="text-h3 font-semibold text-brand-deep flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Office Hours
                </h2>
                <p className="text-body-sm text-text-secondary leading-relaxed">
                  Monday to Thursday: 8:30 AM - 12:30 PM &amp; 1:30 PM - 5:30 PM<br />
                  Friday: 8:30 AM - 11:30 AM &amp; 1:30 PM - 5:30 PM<br />
                  Saturday &amp; Sunday: Closed
                </p>
              </div>

              <div className="rounded-2xl border border-border-standard p-6 space-y-4">
                <h2 className="text-h3 font-semibold text-brand-deep flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  Phone Contacts
                </h2>
                <p className="text-body-sm text-text-secondary leading-relaxed">
                  Main Office: +251 11 122 8200<br />
                  Public Relations: +251 11 122 8215<br />
                  Fax: +251 11 122 8300
                </p>
              </div>

              <div className="rounded-2xl border border-border-standard p-6 space-y-4">
                <h2 className="text-h3 font-semibold text-brand-deep flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Email Addresses
                </h2>
                <p className="text-body-sm text-text-secondary leading-relaxed">
                  General Info: <a href="mailto:info@mopd.gov.et" className="text-primary font-semibold underline">info@mopd.gov.et</a><br />
                  CMS Support: <a href="mailto:support@mopd.gov.et" className="text-primary font-semibold underline">support@mopd.gov.et</a><br />
                  Data Protection (DPO): <a href="mailto:dpo@mopd.gov.et" className="text-primary font-semibold underline">dpo@mopd.gov.et</a>
                </p>
              </div>
            </div>

            <section className="rounded-2xl border border-primary/10 bg-brand-wash p-6 space-y-3">
              <h2 className="flex items-center gap-2 text-h3 font-semibold text-on-surface">
                <Globe className="h-5 w-5 text-primary" />
                Official Website
              </h2>
              <p className="text-body-sm text-text-secondary leading-relaxed">
                To learn more about the Ministry of Planning and Development, please visit our main official website at:{" "}
                <a href="https://www.mopd.gov.et" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold underline">
                  www.mopd.gov.et
                </a>
              </p>
            </section>
          </article>
        )}
      </div>
    </PublicShell>
  );
}
