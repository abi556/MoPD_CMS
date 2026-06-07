import { setRequestLocale } from "next-intl/server";
import { PublicShell } from "@/components/layout/public-shell";
import { PublicLegalHero } from "@/components/public/public-legal-hero";
import { PublicLegalSection } from "@/components/public/public-legal-section";
import {
  PublicLegalDocumentLayout,
  type LegalNavSection,
} from "@/components/public/public-legal-document-layout";
import { ContactForm } from "@/components/public/contact-form";

const EN_SECTIONS: LegalNavSection[] = [
  { id: "message-form", title: "Send a message" },
  { id: "address", title: "Physical address" },
  { id: "hours", title: "Office hours" },
  { id: "phone", title: "Phone" },
  { id: "email", title: "Email" },
  { id: "website", title: "Official website" },
];

const AM_SECTIONS: LegalNavSection[] = [
  { id: "message-form", title: "መልዕክት ይላኩ" },
  { id: "address", title: "አካላዊ አድራሻ" },
  { id: "hours", title: "የሥራ ሰዓታት" },
  { id: "phone", title: "ስልክ" },
  { id: "email", title: "ኢሜይል" },
  { id: "website", title: "ይፋዊ ድረ-ገጽ" },
];

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
      <PublicLegalHero
        title={isAm ? "ያግኙን" : "Contact Us"}
        subtitle={
          isAm
            ? "MoPD የቅሬታ አስተዳደር ስርዓት · ለጥያቄ፣ አስተያየት ወይም ድጋፍ"
            : "MoPD Complaint Management System · Inquiries, feedback, and support"
        }
      />

      {isAm ? (
        <PublicLegalDocumentLayout navLabel="ይዘት" sections={AM_SECTIONS}>
          <PublicLegalSection id="message-form" title="መልዕክት ይላኩ">
            <ContactForm />
          </PublicLegalSection>

          <PublicLegalSection id="address" title="አካላዊ አድራሻ">
            <p>
              የፕላንና ልማት ሚኒስቴር (MoPD)
              <br />
              አራት ኪሎ (ከጠቅላይ ሚኒስትር ጽሕፈት ቤት አጠገብ)
              <br />
              አዲስ አበባ፣ ኢትዮጵያ
            </p>
          </PublicLegalSection>

          <PublicLegalSection id="hours" title="የሥራ ሰዓታት">
            <p>
              ከሰኞ እስከ ሐሙስ፦ 8:30 – 12:30 እና 1:30 – 5:30
              <br />
              አርብ፦ 8:30 – 11:30 እና 1:30 – 5:30
              <br />
              ቅዳሜ እና እሁድ፦ ዝግ
            </p>
          </PublicLegalSection>

          <PublicLegalSection id="phone" title="ስልክ">
            <p>
              ዋና መሥሪያ ቤት፦ +251 11 122 8200
              <br />
              የህዝብ ግንኙነት፦ +251 11 122 8215
              <br />
              ፋክስ፦ +251 11 122 8300
            </p>
          </PublicLegalSection>

          <PublicLegalSection id="email" title="ኢሜይል">
            <p>
              አጠቃላይ መረጃ፦{" "}
              <a
                href="mailto:info@mopd.gov.et"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                info@mopd.gov.et
              </a>
              <br />
              የቅሬታ ድጋፍ፦{" "}
              <a
                href="mailto:support@mopd.gov.et"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                support@mopd.gov.et
              </a>
              <br />
              የዳታ ጥበቃ (DPO)፦{" "}
              <a
                href="mailto:dpo@mopd.gov.et"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                dpo@mopd.gov.et
              </a>
            </p>
          </PublicLegalSection>

          <PublicLegalSection id="website" title="ይፋዊ ድረ-ገጽ">
            <p>
              ስለ ሚኒስቴሩ ተጨማሪ መረጃ{" "}
              <a
                href="https://www.mopd.gov.et"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                www.mopd.gov.et
              </a>
            </p>
          </PublicLegalSection>
        </PublicLegalDocumentLayout>
      ) : (
        <PublicLegalDocumentLayout navLabel="Contents" sections={EN_SECTIONS}>
          <PublicLegalSection id="message-form" title="Send us a message">
            <ContactForm />
          </PublicLegalSection>

          <PublicLegalSection id="address" title="Physical address">
            <p>
              Ministry of Planning and Development (MoPD)
              <br />
              Arat Kilo (Next to the Prime Minister&apos;s Office)
              <br />
              Addis Ababa, Ethiopia
            </p>
          </PublicLegalSection>

          <PublicLegalSection id="hours" title="Office hours">
            <p>
              Monday to Thursday: 8:30 AM – 12:30 PM &amp; 1:30 PM – 5:30 PM
              <br />
              Friday: 8:30 AM – 11:30 AM &amp; 1:30 PM – 5:30 PM
              <br />
              Saturday &amp; Sunday: Closed
            </p>
          </PublicLegalSection>

          <PublicLegalSection id="phone" title="Phone">
            <p>
              Main office: +251 11 122 8200
              <br />
              Public relations: +251 11 122 8215
              <br />
              Fax: +251 11 122 8300
            </p>
          </PublicLegalSection>

          <PublicLegalSection id="email" title="Email">
            <p>
              General inquiries:{" "}
              <a
                href="mailto:info@mopd.gov.et"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                info@mopd.gov.et
              </a>
              <br />
              CMS support:{" "}
              <a
                href="mailto:support@mopd.gov.et"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                support@mopd.gov.et
              </a>
              <br />
              Data protection (DPO):{" "}
              <a
                href="mailto:dpo@mopd.gov.et"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                dpo@mopd.gov.et
              </a>
            </p>
          </PublicLegalSection>

          <PublicLegalSection id="website" title="Official website">
            <p>
              Learn more about the Ministry at{" "}
              <a
                href="https://www.mopd.gov.et"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                www.mopd.gov.et
              </a>
            </p>
          </PublicLegalSection>
        </PublicLegalDocumentLayout>
      )}
    </PublicShell>
  );
}
